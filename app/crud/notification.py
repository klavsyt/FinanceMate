# app/crud/notification.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    message: str,
):
    notif = Notification(user_id=user_id, message=message)
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_user_notifications(db: AsyncSession, user_id: int):
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
