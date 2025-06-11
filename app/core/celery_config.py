from celery import Celery
from celery.schedules import crontab


celery_app = Celery(
    "financemate",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

celery_app.conf.task_routes = {
    "app.tasks.budget": {"queue": "budgets"},
    "app.tasks.exchangerate": {"queue": "exchangerates"},
}


celery_app.conf.beat_schedule = {
    "update_exchange_rates": {
        "task": "app.tasks.exchangerate.update_exchange_rates",
        "schedule": crontab(minute=0, hour="*"),
    },
    "delete_old_and_excess_notifications": {
        "task": "app.tasks.notification.delete_old_and_excess_notifications",
        "schedule": crontab(minute=30, hour=2),  # каждый день в 2:30 ночи
        "args": (4, 20),  # 4 дня, максимум 20 уведомлений на пользователя
    },
}
