# app/api/routes/notifications.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.schemas.notification import NotificationOut
from app.crud.notification import get_user_notifications
from app.crud.user import get_current_user  # зависимость авторизации

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    session: AsyncSession = Depends(get_async_session), user=Depends(get_current_user)
):
    return await get_user_notifications(session, user.id)
