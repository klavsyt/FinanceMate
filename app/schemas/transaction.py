from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date as date_d


class TransactionBase(BaseModel):
    amount: Decimal = Field(
        ...,
        gt=0,
        max_digits=10,
        decimal_places=2,
        description="Сумма транзакции",
        examples=[150.50],
    )
    date: date_d = Field(
        default_factory=date_d.today,
        description="Дата транзакции (YYYY-MM-DD)",
        examples=["2025-06-09"],
    )
    currency: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Валюта (ISO 4217)",
        examples=["RUB"],
    )
    comment: str | None = Field(
        None,
        max_length=255,
        description="Комментарий (опционально)",
        examples=["Обед в кафе"],
    )
    category_id: int = Field(
        ..., gt=0, description="ID категории транзакции", examples=[1]
    )


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
