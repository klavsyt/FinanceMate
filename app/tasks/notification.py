from app.db.syncsess import SessionLocal
from app.db.models.notification import Notification
from sqlalchemy import delete, select
from datetime import datetime, timedelta
from celery import shared_task


@shared_task
def delete_old_and_excess_notifications(days: int = 4, max_count: int = 20):
    db = SessionLocal()
    try:
        # 1. Удалить все уведомления старше N дней
        threshold = datetime.utcnow() - timedelta(days=days)
        db.execute(delete(Notification).where(Notification.created_at < threshold))
        db.commit()
        # 2. Для каждого пользователя оставить только max_count последних уведомлений
        users = db.execute(select(Notification.user_id).distinct()).scalars().all()
        for user_id in users:
            notif_ids = (
                db.execute(
                    select(Notification.id)
                    .where(Notification.user_id == user_id)
                    .order_by(Notification.created_at.desc())
                )
                .scalars()
                .all()
            )
            if len(notif_ids) > max_count:
                to_delete = notif_ids[max_count:]
                db.execute(delete(Notification).where(Notification.id.in_(to_delete)))
                db.commit()
        # 3. Удалить уведомления без пользователя (user_id is None)
        db.execute(delete(Notification).where(Notification.user_id == None))
        db.commit()
    finally:
        db.close()
