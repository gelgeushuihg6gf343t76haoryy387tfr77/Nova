import json
import logging
import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import enforce_free_plan_limit, get_current_user
from app.billing.lemon_squeezy import create_checkout_url, verify_webhook_signature
from app.billing.payment_webhook import verify_payment_webhook_signature
from app.db.deps import get_db
from app.models import BillingWebhookEvent, Business, CategoryKind, Income, PlanTier, User
from app.schemas.billing import CheckoutRequest, CheckoutResponse
from app.schemas.payment_webhook import PaymentInboundEvent
from app.services.category_match import resolve_category_id

logger = logging.getLogger("nova")

router = APIRouter()


@router.post("/checkout/lemonsqueezy", response_model=CheckoutResponse)
def create_checkout(payload: CheckoutRequest, current_user: User = Depends(get_current_user)) -> CheckoutResponse:
    if payload.plan not in {"starter", "pro"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")

    try:
        url = create_checkout_url(payload.plan, current_user.email, str(current_user.id))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Lemon Squeezy checkout error") from exc
    return CheckoutResponse(checkout_url=url)


@router.post("/webhook/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(default="", alias="X-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    if not verify_webhook_signature(raw_body, x_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    event = json.loads(raw_body.decode("utf-8"))
    event_name = event.get("meta", {}).get("event_name", "")
    attrs = event.get("data", {}).get("attributes", {})
    event_id = str(event.get("data", {}).get("id") or "")

    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing event id")

    replay_guard = BillingWebhookEvent(provider="lemonsqueezy", external_event_id=event_id)
    db.add(replay_guard)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return {"received": True, "duplicate": True}

    custom_data = attrs.get("custom_data", {})
    user_id = custom_data.get("user_id")
    if not user_id:
        db.commit()
        return {"received": True}

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError:
        db.commit()
        return {"received": True}

    user = db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        db.commit()
        return {"received": True}

    user.provider = "lemonsqueezy"
    customer_id = attrs.get("customer_id") or attrs.get("user_email")
    if customer_id:
        user.provider_customer_id = str(customer_id)

    if event_name in {"subscription_created", "subscription_updated"}:
        user.subscription_status = attrs.get("status", "active")
        plan = custom_data.get("plan")
        user.plan = PlanTier.pro if plan == "pro" else PlanTier.starter
    elif event_name == "subscription_cancelled":
        user.subscription_status = "cancelled"
        user.plan = PlanTier.free

    db.commit()
    return {"received": True}


@router.post("/webhook/payments")
async def payment_inbound_webhook(
    request: Request,
    x_signature: str = Header(default="", alias="X-Signature"),
    db: Session = Depends(get_db),
):
    """Inbound payment events (e.g. Stripe-style) create Income rows; deduped by event_id."""
    raw_body = await request.body()
    if not verify_payment_webhook_signature(raw_body, x_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    try:
        payload = PaymentInboundEvent.model_validate_json(raw_body.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload") from exc

    if payload.event_type not in {"payment_success", "subscription_payment"}:
        return {"received": True, "ignored": True}

    dup = db.scalar(
        select(BillingWebhookEvent.id).where(
            BillingWebhookEvent.provider == "payment_inbound",
            BillingWebhookEvent.external_event_id == payload.event_id,
        )
    )
    if dup:
        return {"received": True, "duplicate": True}

    business = db.scalar(select(Business).where(Business.id == payload.business_id))
    if not business:
        return {"received": True, "unknown_business": True}

    user = db.scalar(select(User).where(User.id == business.owner_user_id))
    if not user:
        return {"received": True, "unknown_business": True}

    enforce_free_plan_limit(db, user, payload.business_id)

    occurred = payload.event_timestamp.date() if payload.event_timestamp else date.today()
    created_at = payload.event_timestamp if payload.event_timestamp else datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    cat = resolve_category_id(db, payload.business_id, CategoryKind.income, payload.description, None)
    income = Income(
        business_id=payload.business_id,
        amount_cents=payload.amount_cents,
        occurred_on=occurred,
        source=payload.description,
        category_id=cat,
        notes=None,
        created_at=created_at,
    )
    replay = BillingWebhookEvent(provider="payment_inbound", external_event_id=payload.event_id)
    db.add(replay)
    db.add(income)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"received": True, "duplicate": True}

    db.refresh(income)
    logger.info(
        "income_payment_webhook income_id=%s business_id=%s event_id=%s",
        income.id,
        payload.business_id,
        payload.event_id,
    )
    return {"received": True, "income_id": str(income.id)}
