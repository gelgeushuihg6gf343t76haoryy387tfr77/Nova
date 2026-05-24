import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.deps import get_db
from app.models import Business, User
from app.schemas.business import BusinessCreate, BusinessRead
from app.schemas.common import MessageResponse

router = APIRouter()
logger = logging.getLogger("business_clarity")


@router.get("", response_model=list[BusinessRead])
def list_businesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = list(db.scalars(select(Business).where(Business.owner_user_id == current_user.id)).all())
    return [BusinessRead.model_validate(row) for row in rows]


@router.post("", response_model=BusinessRead)
def create_business(payload: BusinessCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = Business(owner_user_id=current_user.id, **payload.model_dump())
    db.add(business)
    db.commit()
    db.refresh(business)
    logger.info("business_created id=%s owner=%s", business.id, current_user.id)
    return BusinessRead.model_validate(business)


@router.delete("/{business_id}", response_model=MessageResponse)
def delete_business(business_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.scalar(
        select(Business).where(and_(Business.id == business_id, Business.owner_user_id == current_user.id))
    )
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    db.delete(business)
    db.commit()
    logger.info("business_deleted id=%s", business_id)
    return MessageResponse(message="Deleted successfully")
