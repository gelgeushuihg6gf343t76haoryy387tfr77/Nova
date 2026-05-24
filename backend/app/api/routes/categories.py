import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_business_id
from app.db.deps import get_db
from app.models import Category, CategoryKind
from app.schemas.categories import CategoryCreate, CategoryRead

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: Session = Depends(get_db),
    kind: CategoryKind | None = Query(default=None),
):
    stmt = select(Category).where(Category.business_id == business_id)
    if kind is not None:
        stmt = stmt.where(Category.kind == kind)
    stmt = stmt.order_by(Category.name)
    rows = list(db.scalars(stmt).all())
    return [CategoryRead.model_validate(r) for r in rows]


@router.post("", response_model=CategoryRead)
def create_category(
    payload: CategoryCreate,
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: Session = Depends(get_db),
):
    row = Category(business_id=business_id, kind=payload.kind, name=payload.name.strip())
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists for this type",
        ) from exc
    db.refresh(row)
    return CategoryRead.model_validate(row)
