import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import free_plan_soft_warning, get_current_business_id, get_current_user
from app.db.deps import get_db
from app.models import Subscription
from app.schemas.common import MessageResponse
from app.schemas.subscriptions import SubscriptionCreate, SubscriptionRead, SubscriptionUpdate
from app.services.crud_service import create_entity, delete_entity, get_owned_entity, list_entities, update_entity

router = APIRouter()
logger = logging.getLogger("nova")


@router.get("", response_model=list[SubscriptionRead])
def list_subscriptions(business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    rows = list_entities(db, select(Subscription).where(Subscription.business_id == business_id).order_by(Subscription.created_at.desc()))
    return [SubscriptionRead.model_validate(row) for row in rows]


@router.post("", response_model=SubscriptionRead)
def create_subscription(
    payload: SubscriptionCreate,
    business_id=Depends(get_current_business_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = create_entity(db, Subscription, {**payload.model_dump(), "business_id": business_id})
    logger.info("subscription_created id=%s business_id=%s", item.id, business_id)
    warning = free_plan_soft_warning(db, current_user, business_id)
    return SubscriptionRead(**SubscriptionRead.model_validate(item).model_dump(exclude={"warning"}), warning=warning)


@router.put("/{subscription_id}", response_model=SubscriptionRead)
def update_subscription(subscription_id: uuid.UUID, payload: SubscriptionUpdate, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Subscription, subscription_id, business_id)
    item = update_entity(db, item, payload.model_dump(exclude_unset=True))
    logger.info("subscription_updated id=%s business_id=%s", subscription_id, business_id)
    return SubscriptionRead.model_validate(item)


@router.delete("/{subscription_id}", response_model=MessageResponse)
def delete_subscription(subscription_id: uuid.UUID, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Subscription, subscription_id, business_id)
    logger.info("subscription_deleted id=%s business_id=%s", subscription_id, business_id)
    return delete_entity(db, item)
