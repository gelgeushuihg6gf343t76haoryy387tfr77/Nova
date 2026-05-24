import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PaymentInboundEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event_type: Literal["payment_success", "subscription_payment"]
    event_id: str = Field(min_length=1, max_length=255)
    business_id: uuid.UUID
    amount_cents: int = Field(gt=0, le=1_000_000_000)
    description: str | None = Field(default=None, max_length=500)
    event_timestamp: datetime | None = None
