from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging
from decimal import Decimal

from app.db.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.db.models.user import User
from app.tasks.budget import check_budget_limit as check_budget_limit_task
from app.db.models.budget import Budget
from app.services.curency import convert_to_base

logger = logging.getLogger("financemate")


async def create_transaction(
    db: AsyncSession, transaction: TransactionCreate, user_id: int
) -> Transaction:
    # Получаем бюджет по user_id и category_id
    budget = await db.execute(
        select(Budget).where(
            Budget.user_id == user_id, Budget.category_id == transaction.category_id
        )
    )
    budget = budget.scalar_one_or_none()
    amount = Decimal(str(transaction.amount))
    currency = transaction.currency
    # Если есть бюджет и валюты не совпадают — конвертируем
    if budget and budget.currency != currency:
        amount = await convert_to_base(amount, currency, budget.currency, db)
        currency = budget.currency
    new_transaction = Transaction(
        amount=amount,
        currency=currency,
        date=transaction.date,
        comment=transaction.comment,
        category_id=transaction.category_id,
        user_id=user_id,
    )
    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)
    logger.info(
        f"User {user_id} created transaction {new_transaction.id} (amount {new_transaction.amount}, category {new_transaction.category_id}, date {new_transaction.date})"
    )
    # Корректный вызов Celery-задачи (работает и при запуске без воркера)
    task = check_budget_limit_task
    if hasattr(task, "delay") and callable(getattr(task, "delay", None)):
        task.delay(user_id, transaction.category_id)
    else:
        task(user_id, transaction.category_id)
    return new_transaction


async def update_transaction(
    db: AsyncSession, transaction_id: int, transaction: TransactionUpdate
) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    existing_transaction = result.scalar_one_or_none()

    if not existing_transaction:
        return None

    for key, value in transaction.model_dump().items():
        setattr(existing_transaction, key, value)

    await db.commit()
    await db.refresh(existing_transaction)
    logger.info(
        f"User {existing_transaction.user_id} updated transaction {existing_transaction.id} (amount {existing_transaction.amount}, category {existing_transaction.category_id}, date {existing_transaction.date})"
    )
    # Корректный вызов Celery-задачи (работает и при запуске без воркера)
    task = check_budget_limit_task
    if hasattr(task, "delay") and callable(getattr(task, "delay", None)):
        task.delay(existing_transaction.user_id, existing_transaction.category_id)
    else:
        task(existing_transaction.user_id, existing_transaction.category_id)

    return existing_transaction


async def delete_transaction(
    db: AsyncSession, transaction_id: int
) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    existing_transaction = result.scalar_one_or_none()

    if not existing_transaction:
        return None

    user_id = existing_transaction.user_id
    await db.delete(existing_transaction)
    await db.commit()
    logger.info(f"User {user_id} deleted transaction {transaction_id}")
    return existing_transaction


async def get_transaction(
    db: AsyncSession, transaction_id: int, user: User
) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id, Transaction.user_id == user.id
        )
    )
    return result.scalar_one_or_none()


async def get_transactions_filtered(
    db,
    user_id: int,
    date_from=None,
    date_to=None,
    category_id=None,
    min_amount=None,
    max_amount=None,
    currency=None,
    limit=20,
    offset=0,
):
    query = select(Transaction).where(Transaction.user_id == user_id)
    if date_from:
        query = query.where(Transaction.date >= date_from)
    if date_to:
        query = query.where(Transaction.date <= date_to)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if min_amount:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount:
        query = query.where(Transaction.amount <= max_amount)
    if currency:
        query = query.where(Transaction.currency == currency)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()
