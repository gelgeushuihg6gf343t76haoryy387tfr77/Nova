import uuid
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.deps import get_db
from app.models import Business, Expense, Income, Invoice, PlanTier, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_token(token)
        user_id = uuid.UUID(payload.get("sub", ""))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials") from exc

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_business_id(
    x_business_id: str | None = Header(default=None, alias="X-Business-Id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> uuid.UUID:
    if not x_business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-Business-Id header is required")

    try:
        business_id = uuid.UUID(x_business_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid business id") from exc

    business = db.scalar(
        select(Business).where(and_(Business.id == business_id, Business.owner_user_id == current_user.id))
    )
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return business.id


def get_current_business(db: Session, business_id: uuid.UUID, owner_user_id: uuid.UUID) -> Business:
    business = db.scalar(
        select(Business).where(and_(Business.id == business_id, Business.owner_user_id == owner_user_id))
    )
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return business


def require_starter_or_pro(current_user: User = Depends(get_current_user)) -> User:
    if current_user.plan not in (PlanTier.starter, PlanTier.pro):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Starter plan or higher required")
    return current_user


def require_pro_plan(current_user: User = Depends(get_current_user)) -> User:
    if current_user.plan != PlanTier.pro:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pro plan required")
    return current_user


def remaining_free_plan_slots(
    db: Session,
    current_user: User,
    business_id: uuid.UUID,
    monthly_limit: int = 100,
) -> int | None:
    if current_user.plan != PlanTier.free:
        return None
    month_start = datetime.now(timezone.utc).date().replace(day=1)
    income_count = db.scalar(
        select(func.count()).select_from(Income).where(and_(Income.business_id == business_id, Income.occurred_on >= month_start))
    ) or 0
    expense_count = db.scalar(
        select(func.count()).select_from(Expense).where(and_(Expense.business_id == business_id, Expense.occurred_on >= month_start))
    ) or 0
    invoice_count = db.scalar(
        select(func.count()).select_from(Invoice).where(and_(Invoice.business_id == business_id, Invoice.issued_on >= month_start))
    ) or 0
    total = income_count + expense_count + invoice_count
    return max(0, monthly_limit - total)


def free_plan_soft_warning(
    db: Session,
    current_user: User,
    business_id: uuid.UUID,
    monthly_limit: int = 100,
) -> str | None:
    if current_user.plan != PlanTier.free:
        return None
    remaining = remaining_free_plan_slots(db, current_user, business_id, monthly_limit=monthly_limit)
    if remaining is None:
        return None
    if remaining <= 0:
        return "Free plan soft limit reached (100 monthly transactions). Upgrade to Pro is coming soon."
    if remaining <= 10:
        return f"Free plan reminder: {remaining} transaction slots left this month."
    return None


def enforce_free_plan_limit(
    db: Session,
    current_user: User,
    business_id: uuid.UUID,
    monthly_limit: int = 100,
) -> None:
    # Backward-compatible shim for existing route imports.
    free_plan_soft_warning(db, current_user, business_id, monthly_limit=monthly_limit)
