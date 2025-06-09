from app.db.syncsess import SessionLocal
from app.db.models.notification import Notification
from app.db.models.transaction import Transaction
from app.db.models.budget import Budget
from sqlalchemy import func, select
from celery import shared_task


from app.core.celery_config import celery_app


@shared_task
def check_budget_limit(user_id: int, category_id: int):
    db = SessionLocal()
    try:
        # 1. Получаем лимит из бюджета
        budget = db.execute(
            select(Budget).where(
                Budget.user_id == user_id, Budget.category_id == category_id
            )
        ).scalar_one_or_none()

        if not budget:
            return

        # 2. Считаем сумму всех трат по категории
        total_spent = db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == user_id, Transaction.category_id == category_id
            )
        ).scalar()
        from decimal import Decimal

        if total_spent is None:
            total_spent = Decimal("0")
        else:
            total_spent = Decimal(str(total_spent))

        limit = Decimal(str(budget.limit))
        currency = budget.currency
        # Явно подгружаем категорию, если не подгружена
        category_name = None
        if budget.category and getattr(budget.category, "name", None):
            category_name = budget.category.name
        else:
            from app.db.models.category import Category

            cat = db.execute(
                select(Category.name).where(Category.id == budget.category_id)
            ).scalar_one_or_none()
            category_name = cat if cat else category_id
        # 3. Если превысил — создаём уведомление
        if total_spent > limit:
            message = f"Превышен лимит по категории '{category_name}': потрачено {total_spent:.2f} {currency}, лимит {limit:.2f} {currency}"
            notification = Notification(user_id=user_id, message=message)
            db.add(notification)
            db.commit()
    finally:
        db.close()
