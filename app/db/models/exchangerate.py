from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    DateTime,
    func,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Numeric,
    String,
)
from datetime import datetime
from enum import Enum

from app.db.base import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id: Mapped[int] = mapped_column(
        primary_key=True, nullable=False, autoincrement=True
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, unique=True)
    rate: Mapped[Numeric] = mapped_column(
        Numeric(precision=20, scale=6), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
