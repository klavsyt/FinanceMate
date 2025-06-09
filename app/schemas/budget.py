from pydantic import BaseModel, Field
from enum import Enum
from decimal import Decimal


class BudgetType(str, Enum):
    monthly = "monthly"
    yearly = "yearly"


class BudgetBase(BaseModel):
    category_id: int
    limit: Decimal = Field(max_digits=10, decimal_places=2)
    period: BudgetType


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
