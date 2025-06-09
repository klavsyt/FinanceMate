from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.db.models.user import User
from app.tasks.budget import check_budget_limit


async def create_transaction(
    db: AsyncSession, transaction: TransactionCreate, user_id: int
) -> Transaction:
    new_transaction = Transaction(**transaction.model_dump(), user_id=user_id)
    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    check_budget_limit.delay(user_id, transaction.category_id)
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

    check_budget_limit.delay(
        existing_transaction.user_id, existing_transaction.category_id
    )

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

    await db.delete(existing_transaction)
    await db.commit()
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
