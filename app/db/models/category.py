from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, func, Enum as SQLAlchemyEnum, ForeignKey
from enum import Enum
from sqlalchemy.schema import UniqueConstraint

from app.db.base import Base


class CategoryType(str, Enum):
    income = "income"
    expense = "expense"


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("name", "user_id", name="uix_category_name_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(nullable=False)

    type: Mapped[SQLAlchemyEnum] = mapped_column(
        SQLAlchemyEnum(CategoryType), nullable=False
    )
    parent_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    icon: Mapped[str] = mapped_column(nullable=True)
    color: Mapped[str] = mapped_column(nullable=True)

    parent = relationship("Category", remote_side=[id], backref="subcategories")
