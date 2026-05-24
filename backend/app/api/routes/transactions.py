import csv
import io
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.api.deps import get_current_business_id, get_current_user
from app.db.deps import get_db
from app.models import CategoryKind, Expense, Income, User
from app.schemas.common import MessageResponse
from app.schemas.transactions import CsvImportSummary
from app.services.category_match import resolve_category_id
from app.services.crud_service import create_entity

router = APIRouter()

_REQUIRED_HEADERS = {"amount", "type", "description"}


def _normalize_header(key: str) -> str:
    return key.strip().lower().replace(" ", "_")


def _parse_amount(raw: str) -> int | None:
    text = raw.strip().replace(",", "")
    if not text:
        return None
    try:
        value = Decimal(text)
    except InvalidOperation:
        return None
    cents = int(value * 100)
    if cents <= 0 or cents > 1_000_000_000:
        return None
    return cents


def _parse_type(raw: str) -> str | None:
    t = raw.strip().lower()
    if t in ("income", "in"):
        return "income"
    if t in ("expense", "exp", "out"):
        return "expense"
    return None


def _parse_date_optional(raw: str) -> date | None:
    text = raw.strip()
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


@router.post("/import/csv", response_model=CsvImportSummary)
def import_transactions_csv(
    file: UploadFile = File(...),
    business_id: uuid.UUID = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CsvImportSummary:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file required")

    raw = file.file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV must be UTF-8") from exc

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV has no header row")

    field_map = {_normalize_header(h): h for h in reader.fieldnames if h}
    has_default_shape = _REQUIRED_HEADERS.issubset(set(field_map.keys()))
    has_mmk_shape = "revenue_mmk" in field_map
    if not has_default_shape and not has_mmk_shape:
        missing = _REQUIRED_HEADERS - set(field_map.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV missing columns: {', '.join(sorted(missing))}",
        )

    date_key = field_map.get("date")
    amount_key = field_map.get("amount") or field_map.get("revenue_mmk")
    type_key = field_map.get("type")
    description_key = field_map.get("description")
    customer_key = field_map.get("customer_id")
    plan_key = field_map.get("plan")

    created_count = 0
    failed_count = 0
    today = datetime.now(timezone.utc).date()

    for row in reader:
        amount_raw = row.get(amount_key, "") if amount_key else ""
        type_raw = row.get(type_key, "income") if type_key else "income"
        desc_raw = row.get(description_key, "") if description_key else ""
        if not desc_raw.strip():
            customer = (row.get(customer_key, "") if customer_key else "").strip()
            plan = (row.get(plan_key, "") if plan_key else "").strip()
            desc_raw = " · ".join(part for part in (customer, plan) if part) or "Imported income"
        date_raw = row.get(date_key, "") if date_key else ""

        cents = _parse_amount(amount_raw)
        kind = _parse_type(type_raw)
        occurred = _parse_date_optional(date_raw) or today
        description = desc_raw.strip() or None

        if cents is None or kind is None:
            failed_count += 1
            continue

        try:
            if kind == "income":
                inc_cat = resolve_category_id(db, business_id, CategoryKind.income, description, None)
                create_entity(
                    db,
                    Income,
                    {
                        "business_id": business_id,
                        "amount_cents": cents,
                        "occurred_on": occurred,
                        "source": description,
                        "category_id": inc_cat,
                        "notes": None,
                    },
                )
            else:
                exp_cat = resolve_category_id(db, business_id, CategoryKind.expense, description, None)
                create_entity(
                    db,
                    Expense,
                    {
                        "business_id": business_id,
                        "amount_cents": cents,
                        "occurred_on": occurred,
                        "vendor": description,
                        "payment_method": None,
                        "category_id": exp_cat,
                        "is_recurring": False,
                        "notes": None,
                    },
                )
            created_count += 1
        except Exception:  # noqa: BLE001
            db.rollback()
            failed_count += 1

    return CsvImportSummary(created_count=created_count, failed_count=failed_count, warning=None)


@router.delete("/all", response_model=MessageResponse)
def clear_all_transactions(
    business_id: uuid.UUID = Depends(get_current_business_id),
    db: Session = Depends(get_db),
) -> MessageResponse:
    db.execute(delete(Income).where(Income.business_id == business_id))
    db.execute(delete(Expense).where(Expense.business_id == business_id))
    db.commit()
    return MessageResponse(message="All history cleared.")
