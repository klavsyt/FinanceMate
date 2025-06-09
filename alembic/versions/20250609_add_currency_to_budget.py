"""add currency to budget

Revision ID: 20250609_add_currency_to_budget
Revises: a13618bcdd61
Create Date: 2025-06-09
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250609_add_currency_to_budget"
down_revision = "a13618bcdd61"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "budgets",
        sa.Column(
            "currency", sa.String(length=3), nullable=False, server_default="RUB"
        ),
    )


def downgrade():
    op.drop_column("budgets", "currency")
