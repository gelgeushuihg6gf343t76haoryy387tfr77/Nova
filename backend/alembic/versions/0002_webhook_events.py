"""add webhook events table

Revision ID: 0002_webhook_events
Revises: 0001_initial_schema
Create Date: 2026-04-21 00:10:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_webhook_events"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "billing_webhook_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_webhook_provider_event",
        "billing_webhook_events",
        ["provider", "external_event_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("idx_webhook_provider_event", table_name="billing_webhook_events")
    op.drop_table("billing_webhook_events")
