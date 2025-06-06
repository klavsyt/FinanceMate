from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, func, Enum as SQLAlchemyEnum, ForeignKey, Numeric
from enum import Enum

from app.db.base import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    currency: Mapped[int] = mapped_column(primary_key=True, nullable=False)
    rate: Mapped[Numeric] = mapped_column(
        Numeric(precision=10, scale=6), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
