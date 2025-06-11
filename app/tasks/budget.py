from app.db.syncsess import SessionLocal
from app.db.models.notification import Notification
from app.db.models.transaction import Transaction
from app.db.models.budget import Budget
from sqlalchemy import func, select
from celery import shared_task


from app.core.celery_config import celery_app


def convert_to_base_sync(amount, from_currency, base_currency, db):
    if from_currency == base_currency:
        return amount
    from app.db.models.exchangerate import ExchangeRate
    from decimal import Decimal

    # Если одна из валют USD — используем напрямую
    if from_currency == "USD":
        # USD -> base_currency
        rate = db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == base_currency)
        ).scalar_one_or_none()
        if rate is None:
            raise ValueError(f"Нет курса для {base_currency}")
        return amount * Decimal(str(rate))
    elif base_currency == "USD":
        rate = db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == from_currency)
        ).scalar_one_or_none()
        if rate is None:
            raise ValueError(f"Нет курса для {from_currency}")
        return amount / Decimal(str(rate))
    else:
        rate_from = db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == from_currency)
        ).scalar_one_or_none()
        if rate_from is None:
            raise ValueError(f"Нет курса для {from_currency}")
        rate_to = db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == base_currency)
        ).scalar_one_or_none()
        if rate_to is None:
            raise ValueError(f"Нет курса для {base_currency}")
        usd_amount = amount / Decimal(str(rate_from))
        return usd_amount * Decimal(str(rate_to))


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

        # 2. Считаем сумму всех трат по категории (с учётом валюты)
        from decimal import Decimal

        txs = db.execute(
            select(Transaction.amount, Transaction.currency).where(
                Transaction.user_id == user_id, Transaction.category_id == category_id
            )
        ).all()
        total_spent = Decimal("0")
        for amount, tx_currency in txs:
            if tx_currency != budget.currency:
                converted = convert_to_base_sync(
                    Decimal(str(amount)), tx_currency, budget.currency, db
                )
                total_spent += converted
            else:
                total_spent += Decimal(str(amount))
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
