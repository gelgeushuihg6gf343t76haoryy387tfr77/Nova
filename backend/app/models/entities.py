from datetime import date, datetime
from enum import Enum
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum as SAEnum, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlanTier(str, Enum):
    free = "free"
    starter = "starter"
    pro = "pro"


class InvoiceStatus(str, Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"


class BillingCycle(str, Enum):
    monthly = "monthly"
    yearly = "yearly"


class CategoryKind(str, Enum):
    income = "income"
    expense = "expense"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    provider_customer_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    provider: Mapped[str | None] = mapped_column(String(50))
    subscription_status: Mapped[str] = mapped_column(String(50), default="inactive", nullable=False)
    plan: Mapped[PlanTier] = mapped_column(SAEnum(PlanTier, name="plan_tier"), default=PlanTier.free, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    businesses: Mapped[list["Business"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False)
    plan: Mapped[PlanTier] = mapped_column(SAEnum(PlanTier, name="plan_tier"), default=PlanTier.free, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    owner: Mapped[User] = relationship(back_populates="businesses")
    categories: Mapped[list["Category"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    income_items: Mapped[list["Income"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    expense_items: Mapped[list["Expense"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("business_id", "kind", "name", name="uq_category_kind_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[CategoryKind] = mapped_column(SAEnum(CategoryKind, name="category_kind"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="categories")


class Income(Base):
    __tablename__ = "income"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    original_currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    converted_amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conversion_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="income_items")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    original_currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    converted_amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conversion_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    vendor: Mapped[str | None] = mapped_column(String(255))
    payment_method: Mapped[str | None] = mapped_column(String(100))
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="expense_items")


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (UniqueConstraint("business_id", "invoice_number", name="uq_business_invoice_number"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    issued_on: Mapped[date] = mapped_column(Date, nullable=False)
    due_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    paid_on: Mapped[date | None] = mapped_column(Date)
    status: Mapped[InvoiceStatus] = mapped_column(SAEnum(InvoiceStatus, name="invoice_status"), default=InvoiceStatus.draft, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="invoices")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    billing_cycle: Mapped[BillingCycle] = mapped_column(SAEnum(BillingCycle, name="billing_cycle"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_billing_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="subscriptions")


class BillingWebhookEvent(Base):
    __tablename__ = "billing_webhook_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    external_event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


Index("idx_income_business_date", Income.business_id, Income.occurred_on)
Index("idx_expenses_business_date", Expense.business_id, Expense.occurred_on)
Index("idx_invoices_business_status_due", Invoice.business_id, Invoice.status, Invoice.due_on)
Index("idx_subscriptions_business_next", Subscription.business_id, Subscription.next_billing_date)
Index("idx_webhook_provider_event", BillingWebhookEvent.provider, BillingWebhookEvent.external_event_id, unique=True)
