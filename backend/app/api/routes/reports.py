from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_business_id
from app.db.deps import get_db
from app.schemas.dashboard import ReportsResponse
from app.services.metrics import monthly_report

router = APIRouter()


@router.get("/monthly", response_model=ReportsResponse)
def reports(business_id=Depends(get_current_business_id), db: Session = Depends(get_db)) -> ReportsResponse:
    return monthly_report(db, business_id)


@router.get("/export")
def export_reports_csv(business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    report = monthly_report(db, business_id)
    csv_rows = ["month,income_cents,expense_cents,profit_cents"]
    csv_rows.extend(
        f"{row.month},{row.income_cents},{row.expense_cents},{row.profit_cents}" for row in report.monthly
    )
    return {"csv": "\n".join(csv_rows)}
