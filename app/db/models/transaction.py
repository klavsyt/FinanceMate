from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, func, Numeric, ForeignKey, Text


from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    amount: Mapped[Numeric] = mapped_column(
        Numeric(precision=10, scale=2), nullable=False
    )
    date: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    currency: Mapped[str] = mapped_column(nullable=False)
    comment: Mapped[Text] = mapped_column(Text, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="transactions")
    category = relationship("Category")
