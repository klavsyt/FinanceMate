from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date as date_d


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    date: date_d = Field(default_factory=date_d.today)
    currency: str = Field(..., min_length=3, max_length=3)
    comment: str | None = Field(None, max_length=255)
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
