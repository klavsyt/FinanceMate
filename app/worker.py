from app.core.celery_config import celery_app


celery_app.autodiscover_tasks(["app.tasks.budget"])
