"""add username, is_verified, lockout, password_reset_tokens, exchange_rates

Revision ID: 0004_add_auth_fields
Revises: 0003_business_plan_default_free
Create Date: 2026-05-30 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_add_auth_fields"
down_revision = "0003_business_plan_default_free"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ")

    op.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL,
            token_type VARCHAR(10) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_email ON password_reset_tokens (email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token ON password_reset_tokens (token)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id UUID PRIMARY KEY,
            base_currency VARCHAR(3) NOT NULL,
            target_currency VARCHAR(3) NOT NULL,
            rate DOUBLE PRECISION NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            UNIQUE(base_currency, target_currency)
        )
    """)

    try:
        op.create_unique_constraint("uq_users_username", "users", ["username"])
    except Exception:
        pass


def downgrade() -> None:
    op.drop_table("exchange_rates")
    op.drop_index("ix_password_reset_tokens_token", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_email", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_attempts")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "username")
