from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, func, Enum as SQLAlchemyEnum, ForeignKey, Numeric
from enum import Enum

from app.db.base import Base


class BudgetType(str, Enum):
    monthly = "monthly"
    yearly = "yearly"


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), nullable=False
    )
    limit: Mapped[Numeric] = mapped_column(
        Numeric(precision=10, scale=2), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    period: Mapped[BudgetType] = mapped_column(
        SQLAlchemyEnum(BudgetType), nullable=False
    )
    currency: Mapped[str] = mapped_column(nullable=False, default="RUB")

    user = relationship("User", back_populates="budgets")
    category = relationship("Category")
