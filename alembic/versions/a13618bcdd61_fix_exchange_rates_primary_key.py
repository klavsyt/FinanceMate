"""fix exchange_rates primary key

Revision ID: a13618bcdd61
Revises: 99d62aae396b
Create Date: 2025-06-09 22:30:11.367646

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a13618bcdd61"
down_revision: Union[str, None] = "99d62aae396b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Старый PK уже удалён вручную, пропускаем drop_constraint
    op.alter_column(
        "exchange_rates",
        "id",
        existing_type=sa.Integer(),
        autoincrement=True,
        nullable=False,
    )
    op.create_primary_key("exchange_rates_pkey", "exchange_rates", ["id"])
    # Уникальный индекс на currency уже существует, пропускаем создание


def downgrade() -> None:
    op.drop_constraint("exchange_rates_currency_key", "exchange_rates", type_="unique")
    op.drop_constraint("exchange_rates_pkey", "exchange_rates", type_="primary")
    op.create_primary_key("exchange_rates_pkey", "exchange_rates", ["currency"])
