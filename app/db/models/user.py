from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy import DateTime,func


from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[str] = mapped_column(default="user", nullable=False)  
    date_registered: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    transactions = relationship('Transaction', back_populates='user')
    budgets = relationship('Budget', back_populates='user')