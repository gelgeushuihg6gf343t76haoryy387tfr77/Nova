"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-21 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("provider_customer_id", sa.String(length=255), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=True),
        sa.Column("subscription_status", sa.String(length=50), nullable=False),
        sa.Column("plan", sa.Enum("free", "starter", "pro", name="plan_tier"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("provider_customer_id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "businesses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("country_code", sa.String(length=2), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_businesses_owner_user_id"), "businesses", ["owner_user_id"], unique=False)

    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.Enum("income", "expense", name="category_kind"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "kind", "name", name="uq_category_kind_name"),
    )
    op.create_index(op.f("ix_categories_business_id"), "categories", ["business_id"], unique=False)

    op.create_table(
        "income",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_income_business_id"), "income", ["business_id"], unique=False)
    op.create_index(op.f("ix_income_occurred_on"), "income", ["occurred_on"], unique=False)
    op.create_index("idx_income_business_date", "income", ["business_id", "occurred_on"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=False),
        sa.Column("vendor", sa.String(length=255), nullable=True),
        sa.Column("payment_method", sa.String(length=100), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_business_id"), "expenses", ["business_id"], unique=False)
    op.create_index(op.f("ix_expenses_occurred_on"), "expenses", ["occurred_on"], unique=False)
    op.create_index("idx_expenses_business_date", "expenses", ["business_id", "occurred_on"], unique=False)

    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_number", sa.String(length=100), nullable=False),
        sa.Column("client_name", sa.String(length=255), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("issued_on", sa.Date(), nullable=False),
        sa.Column("due_on", sa.Date(), nullable=False),
        sa.Column("paid_on", sa.Date(), nullable=True),
        sa.Column("status", sa.Enum("draft", "sent", "paid", "overdue", name="invoice_status"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "invoice_number", name="uq_business_invoice_number"),
    )
    op.create_index(op.f("ix_invoices_business_id"), "invoices", ["business_id"], unique=False)
    op.create_index(op.f("ix_invoices_due_on"), "invoices", ["due_on"], unique=False)
    op.create_index("idx_invoices_business_status_due", "invoices", ["business_id", "status", "due_on"], unique=False)

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("vendor", sa.String(length=255), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("billing_cycle", sa.Enum("monthly", "yearly", name="billing_cycle"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("next_billing_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subscriptions_business_id"), "subscriptions", ["business_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_next_billing_date"), "subscriptions", ["next_billing_date"], unique=False)
    op.create_index("idx_subscriptions_business_next", "subscriptions", ["business_id", "next_billing_date"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_subscriptions_business_next", table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_next_billing_date"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_business_id"), table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index("idx_invoices_business_status_due", table_name="invoices")
    op.drop_index(op.f("ix_invoices_due_on"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_business_id"), table_name="invoices")
    op.drop_table("invoices")

    op.drop_index("idx_expenses_business_date", table_name="expenses")
    op.drop_index(op.f("ix_expenses_occurred_on"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_business_id"), table_name="expenses")
    op.drop_table("expenses")

    op.drop_index("idx_income_business_date", table_name="income")
    op.drop_index(op.f("ix_income_occurred_on"), table_name="income")
    op.drop_index(op.f("ix_income_business_id"), table_name="income")
    op.drop_table("income")

    op.drop_index(op.f("ix_categories_business_id"), table_name="categories")
    op.drop_table("categories")

    op.drop_index(op.f("ix_businesses_owner_user_id"), table_name="businesses")
    op.drop_table("businesses")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    sa.Enum(name="billing_cycle").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="invoice_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="category_kind").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="plan_tier").drop(op.get_bind(), checkfirst=True)
