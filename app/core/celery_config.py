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
}
