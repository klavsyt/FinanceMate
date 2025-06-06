from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, func, Enum as SQLAlchemyEnum, ForeignKey
from enum import Enum

from app.db.base import Base


class CategoryType(str, Enum):
    income = "income"
    expense = "expense"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    type: Mapped[SQLAlchemyEnum] = mapped_column(
        SQLAlchemyEnum(CategoryType), nullable=False
    )
    parent_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    parent = relationship("Category", remote_side=[id], backref="subcategories")
