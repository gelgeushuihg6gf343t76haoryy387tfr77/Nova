import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import free_plan_soft_warning, get_current_business, get_current_business_id, get_current_user
from app.db.deps import get_db
from app.models import CategoryKind, Income
from app.schemas.common import MessageResponse
from app.schemas.transactions import IncomeCreate, IncomeRead, IncomeUpdate
from app.services.category_match import income_text_for_match, resolve_category_id
from app.services.crud_service import create_entity, delete_entity, get_owned_entity, list_entities, update_entity
from app.services.exchange_rates import exchange_service

router = APIRouter()
logger = logging.getLogger("nova")


@router.get("", response_model=list[IncomeRead])
def list_income(
    business_id=Depends(get_current_business_id),
    db: Session = Depends(get_db),
    time_scope: Literal["all", "recent", "history"] = Query("all"),
    created_after: datetime | None = Query(None),
    created_before: datetime | None = Query(None),
):
    stmt = select(Income).where(Income.business_id == business_id)
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    if time_scope == "recent":
        stmt = stmt.where(Income.created_at >= cutoff)
    elif time_scope == "history":
        stmt = stmt.where(Income.created_at < cutoff)
    if created_after is not None:
        stmt = stmt.where(Income.created_at >= created_after)
    if created_before is not None:
        stmt = stmt.where(Income.created_at < created_before)
    stmt = stmt.order_by(Income.occurred_on.desc())
    rows = list_entities(db, stmt)
    return [IncomeRead.model_validate(row) for row in rows]


@router.post("", response_model=IncomeRead)
def create_income(
    payload: IncomeCreate,
    business_id=Depends(get_current_business_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    text = income_text_for_match(data.get("source"), data.get("notes"))
    data["category_id"] = resolve_category_id(
        db, business_id, CategoryKind.income, text, data.get("category_id")
    )

    business = get_current_business(db, business_id, current_user.id)
    if data.get("original_currency", "USD") != business.currency_code:
        converted, rate = exchange_service.convert(db, data["amount_cents"], data["original_currency"], business.currency_code)
        data["converted_amount_cents"] = converted
        data["conversion_rate"] = rate
    else:
        data["converted_amount_cents"] = data["amount_cents"]
        data["conversion_rate"] = 1.0

    item = create_entity(db, Income, {**data, "business_id": business_id})
    logger.info("income_created id=%s business_id=%s amount_cents=%s currency=%s", item.id, business_id, item.amount_cents, item.original_currency)
    warning = free_plan_soft_warning(db, current_user, business_id)
    return IncomeRead(**IncomeRead.model_validate(item).model_dump(exclude={"warning"}), warning=warning)


@router.put("/{income_id}", response_model=IncomeRead)
def update_income(income_id: uuid.UUID, payload: IncomeUpdate, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Income, income_id, business_id)
    item = update_entity(db, item, payload.model_dump(exclude_unset=True))
    logger.info("income_updated id=%s business_id=%s", income_id, business_id)
    return IncomeRead.model_validate(item)


@router.delete("/{income_id}", response_model=MessageResponse)
def delete_income(income_id: uuid.UUID, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Income, income_id, business_id)
    logger.info("income_deleted id=%s business_id=%s", income_id, business_id)
    return delete_entity(db, item)
