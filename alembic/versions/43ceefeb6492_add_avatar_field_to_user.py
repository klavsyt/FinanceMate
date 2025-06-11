"""add avatar field to user

Revision ID: 43ceefeb6492
Revises: e10ef60c1a98
Create Date: 2025-06-10 14:59:36.224809

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "43ceefeb6492"
down_revision: Union[str, None] = "4a2d87c171df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass  # avatar column already exists


def downgrade() -> None:
    """Downgrade schema."""
    pass  # do not drop avatar column, as it may be used
