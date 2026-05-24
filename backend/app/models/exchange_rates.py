from datetime import date, datetime
import uuid

from sqlalchemy import Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    __table_args__ = (
        UniqueConstraint("from_currency", "to_currency", "rate_date", name="uq_rate_currency_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    to_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    rate: Mapped[float] = mapped_column(Float, nullable=False)
    rate_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
