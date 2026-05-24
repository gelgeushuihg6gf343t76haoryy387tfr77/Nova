from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid", str_strip_whitespace=True)


class APIError(BaseModel):
    error: str
    detail: str


class MessageResponse(BaseModel):
    message: str


class DateRange(BaseModel):
    start_date: date | None = None
    end_date: date | None = None


class Timestamped(ORMModel):
    created_at: datetime
