"""create users table

Revision ID: c3583db888b0
Revises: cf315accd753
Create Date: 2025-06-09 11:28:06.662139

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3583db888b0"
down_revision: Union[str, None] = "cf315accd753"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Используем batch mode для поддержки SQLite
    bind = op.get_bind()
    with op.batch_alter_table("exchange_rates") as batch_op:
        batch_op.add_column(sa.Column("id", sa.Integer(), nullable=False))
        if bind.dialect.name != "sqlite":
            batch_op.alter_column(
                "currency",
                existing_type=sa.INTEGER(),
                type_=sa.String(length=3),
                existing_nullable=False,
            )
        batch_op.create_unique_constraint("exchange_rates_currency_key", ["currency"])


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    with op.batch_alter_table("exchange_rates") as batch_op:
        batch_op.drop_constraint("exchange_rates_currency_key", type_="unique")
        if bind.dialect.name != "sqlite":
            batch_op.alter_column(
                "currency",
                existing_type=sa.String(length=3),
                type_=sa.INTEGER(),
                existing_nullable=False,
            )
        batch_op.drop_column("id")
