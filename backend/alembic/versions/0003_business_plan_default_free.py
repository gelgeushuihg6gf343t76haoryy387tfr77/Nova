"""add business plan field

Revision ID: 0003_business_plan_default_free
Revises: 0002_webhook_events
Create Date: 2026-05-02 20:05:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_business_plan_default_free"
down_revision = "0002_webhook_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "businesses",
        sa.Column(
            "plan",
            sa.Enum("free", "starter", "pro", name="plan_tier", create_type=False),
            nullable=False,
            server_default="free",
        ),
    )


def downgrade() -> None:
    op.drop_column("businesses", "plan")
