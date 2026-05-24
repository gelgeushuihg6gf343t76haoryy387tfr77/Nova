from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_business_id
from app.db.deps import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.metrics import dashboard_data

router = APIRouter()


@router.get("/summary", response_model=DashboardResponse)
def summary(business_id=Depends(get_current_business_id), db: Session = Depends(get_db)) -> DashboardResponse:
    return dashboard_data(db, business_id)
