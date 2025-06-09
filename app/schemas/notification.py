# app/schemas/notification.py
from pydantic import BaseModel, Field
from datetime import datetime


class NotificationBase(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Текст уведомления",
        examples=["Превышен лимит по бюджету!"],
    )


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    id: int = Field(..., description="ID уведомления", examples=[1])
    is_read: bool = Field(..., description="Прочитано ли уведомление", examples=[False])
    created_at: datetime = Field(
        ..., description="Дата и время создания", examples=["2025-06-09T12:00:00"]
    )

    class Config:
        from_attributes = True
