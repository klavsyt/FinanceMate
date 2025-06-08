from celery import Celery


celery_app = Celery(
    "financemate",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

celery_app.conf.task_routes = {
    "app.services.task.budget": {"queue": "budgets"},
}
