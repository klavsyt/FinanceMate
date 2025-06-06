from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class CategoryType(str, Enum):
    income = "income"
    expense = "expense"


class CaregoryBase(BaseModel):
    name: str
    type: CategoryType
    parent_id: Optional[int] = None


class CategoryCreate(CaregoryBase):
    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType


class CategoryUpdate(CaregoryBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[CategoryType] = None
    parent_id: Optional[int] = None


class CategoryRead(CaregoryBase):
    id: int
    name: str
    type: CategoryType
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True
