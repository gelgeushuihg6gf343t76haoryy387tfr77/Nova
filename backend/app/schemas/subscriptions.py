import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import BillingCycle
from app.schemas.common import ORMModel


class SubscriptionBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    vendor: str = Field(min_length=1, max_length=255)
    amount_cents: int = Field(gt=0, le=1_000_000_000)
    billing_cycle: BillingCycle
    start_date: date
    next_billing_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.next_billing_date < self.start_date:
            raise ValueError("next_billing_date cannot be earlier than start_date")
        return self


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    vendor: str | None = Field(default=None, min_length=1, max_length=255)
    amount_cents: int | None = Field(default=None, gt=0, le=1_000_000_000)
    billing_cycle: BillingCycle | None = None
    start_date: date | None = None
    next_billing_date: date | None = None
    is_active: bool | None = None


class SubscriptionRead(ORMModel, SubscriptionBase):
    id: uuid.UUID
    business_id: uuid.UUID
    is_active: bool
    created_at: datetime
    warning: str | None = None
