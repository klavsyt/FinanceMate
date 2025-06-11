from pydantic import BaseModel, Field, validator
from enum import Enum
from typing import Optional


class CategoryType(str, Enum):
    income = "income"
    expense = "expense"


class CaregoryBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Название категории",
        examples=["Еда"],
    )
    type: CategoryType = Field(
        ...,
        description="Тип категории: income (доход) или expense (расход)",
        examples=["expense"],
    )
    parent_id: Optional[int] = Field(
        None, description="ID родительской категории (опционально)", examples=[2]
    )
    icon: Optional[str] = Field(None, description="Иконка категории (bi-*)")
    color: Optional[str] = Field(None, description="Цвет категории (hex или css)")

    @validator("parent_id")
    def parent_id_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("parent_id должен быть положительным")
        return v


class CategoryCreate(CaregoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[CategoryType] = None
    parent_id: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None

    @validator("parent_id")
    def parent_id_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("parent_id должен быть положительным")
        return v


class CategoryRead(CaregoryBase):
    id: int

    class Config:
        from_attributes = True
