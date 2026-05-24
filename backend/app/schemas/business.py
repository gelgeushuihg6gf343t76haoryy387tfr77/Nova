import uuid

from pydantic import BaseModel

from app.models import PlanTier
from app.schemas.common import Timestamped


class BusinessCreate(BaseModel):
    name: str
    country_code: str = "US"
    currency_code: str = "USD"


class BusinessRead(Timestamped):
    id: uuid.UUID
    name: str
    country_code: str
    currency_code: str
    plan: PlanTier
