import logging
import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import free_plan_soft_warning, get_current_business_id, get_current_user
from app.db.deps import get_db
from app.models import Invoice, InvoiceStatus
from app.schemas.common import MessageResponse
from app.schemas.invoices import InvoiceCreate, InvoiceRead, InvoiceStatusUpdate, InvoiceUpdate
from app.services.crud_service import create_entity, delete_entity, get_owned_entity, list_entities, update_entity

router = APIRouter()
logger = logging.getLogger("business_clarity")


@router.get("", response_model=list[InvoiceRead])
def list_invoices(business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    rows = list_entities(db, select(Invoice).where(Invoice.business_id == business_id).order_by(Invoice.created_at.desc()))
    return [InvoiceRead.model_validate(row) for row in rows]


@router.post("", response_model=InvoiceRead)
def create_invoice(
    payload: InvoiceCreate,
    business_id=Depends(get_current_business_id),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = create_entity(db, Invoice, {**payload.model_dump(), "business_id": business_id})
    logger.info("invoice_created id=%s business_id=%s", item.id, business_id)
    warning = free_plan_soft_warning(db, current_user, business_id)
    return InvoiceRead(**InvoiceRead.model_validate(item).model_dump(exclude={"warning"}), warning=warning)


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(invoice_id: uuid.UUID, payload: InvoiceUpdate, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Invoice, invoice_id, business_id)
    item = update_entity(db, item, payload.model_dump(exclude_unset=True))
    logger.info("invoice_updated id=%s business_id=%s", invoice_id, business_id)
    return InvoiceRead.model_validate(item)


@router.patch("/{invoice_id}/status", response_model=InvoiceRead)
def update_status(invoice_id: uuid.UUID, payload: InvoiceStatusUpdate, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Invoice, invoice_id, business_id)
    updates = {"status": payload.status}
    if payload.status == InvoiceStatus.paid:
        updates["paid_on"] = date.today()
    item = update_entity(db, item, updates)
    logger.info("invoice_status id=%s business_id=%s status=%s", invoice_id, business_id, payload.status)
    return InvoiceRead.model_validate(item)


@router.delete("/{invoice_id}", response_model=MessageResponse)
def delete_invoice(invoice_id: uuid.UUID, business_id=Depends(get_current_business_id), db: Session = Depends(get_db)):
    item = get_owned_entity(db, Invoice, invoice_id, business_id)
    logger.info("invoice_deleted id=%s business_id=%s", invoice_id, business_id)
    return delete_entity(db, item)
