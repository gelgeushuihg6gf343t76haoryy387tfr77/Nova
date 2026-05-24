import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORMModel


class IncomeBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    amount_cents: int = Field(gt=0, le=1_000_000_000)
    original_currency: str = Field(default="USD", min_length=3, max_length=3)
    occurred_on: date
    source: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: uuid.UUID | None = None
    notes: str | None = Field(default=None, max_length=2000)


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    amount_cents: int | None = Field(default=None, gt=0, le=1_000_000_000)
    original_currency: str | None = Field(default=None, min_length=3, max_length=3)
    occurred_on: date | None = None
    source: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: uuid.UUID | None = None
    notes: str | None = Field(default=None, max_length=2000)


class IncomeRead(ORMModel, IncomeBase):
    id: uuid.UUID
    business_id: uuid.UUID
    converted_amount_cents: int | None = None
    conversion_rate: float | None = None
    created_at: datetime
    warning: str | None = None


class ExpenseBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    amount_cents: int = Field(gt=0, le=1_000_000_000)
    original_currency: str = Field(default="USD", min_length=3, max_length=3)
    occurred_on: date
    vendor: str | None = Field(default=None, min_length=1, max_length=255)
    payment_method: str | None = Field(default=None, min_length=1, max_length=100)
    category_id: uuid.UUID | None = None
    is_recurring: bool = False
    notes: str | None = Field(default=None, max_length=2000)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    amount_cents: int | None = Field(default=None, gt=0, le=1_000_000_000)
    original_currency: str | None = Field(default=None, min_length=3, max_length=3)
    occurred_on: date | None = None
    vendor: str | None = Field(default=None, min_length=1, max_length=255)
    payment_method: str | None = Field(default=None, min_length=1, max_length=100)
    category_id: uuid.UUID | None = None
    is_recurring: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)


class ExpenseRead(ORMModel, ExpenseBase):
    id: uuid.UUID
    business_id: uuid.UUID
    converted_amount_cents: int | None = None
    conversion_rate: float | None = None
    created_at: datetime
    warning: str | None = None


class CsvImportSummary(BaseModel):
    created_count: int
    failed_count: int
    warning: str | None = None
