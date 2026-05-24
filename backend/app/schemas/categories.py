import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models import CategoryKind
from app.schemas.common import ORMModel


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    kind: CategoryKind


class CategoryRead(ORMModel):
    id: uuid.UUID
    business_id: uuid.UUID
    kind: CategoryKind
    name: str
