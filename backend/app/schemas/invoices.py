import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import InvoiceStatus
from app.schemas.common import ORMModel


class InvoiceBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    invoice_number: str = Field(min_length=1, max_length=100)
    client_name: str = Field(min_length=1, max_length=255)
    amount_cents: int = Field(gt=0, le=1_000_000_000)
    issued_on: date
    due_on: date
    status: InvoiceStatus = InvoiceStatus.draft

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_on < self.issued_on:
            raise ValueError("due_on cannot be earlier than issued_on")
        return self


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    invoice_number: str | None = Field(default=None, min_length=1, max_length=100)
    client_name: str | None = Field(default=None, min_length=1, max_length=255)
    amount_cents: int | None = Field(default=None, gt=0, le=1_000_000_000)
    issued_on: date | None = None
    due_on: date | None = None
    paid_on: date | None = None
    status: InvoiceStatus | None = None


class InvoiceStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: InvoiceStatus


class InvoiceRead(ORMModel, InvoiceBase):
    id: uuid.UUID
    business_id: uuid.UUID
    paid_on: date | None = None
    created_at: datetime
    warning: str | None = None
