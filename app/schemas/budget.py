from typing import Annotated
from pydantic import BaseModel, Field, constr
from enum import Enum
from decimal import Decimal


class BudgetType(str, Enum):
    monthly = "monthly"
    yearly = "yearly"


currency_type = Annotated[
    str,
    Field(
        min_length=3,
        max_length=3,
        description="Валюта бюджета (ISO 4217)",
        example="RUB",
    ),
]


class BudgetBase(BaseModel):
    category_id: int = Field(..., gt=0, description="ID категории бюджета")
    limit: Decimal = Field(
        ...,
        gt=0,
        lt=10000000,
        max_digits=10,
        decimal_places=2,
        description="Лимит бюджета (в валюте)",
    )
    period: BudgetType = Field(..., description="Период бюджета: monthly или yearly")
    currency: constr(min_length=3, max_length=3) = "RUB"


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int

    class Config:
        from_attributes = True


class BudgetAnalyticsOut(BaseModel):
    budget_id: int
    category_id: int
    period: str
    limit: float
    spent: float
    remaining: float
    is_exceeded: bool
