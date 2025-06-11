from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from app.db.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate

logger = logging.getLogger("financemate")


async def create_budget(db: AsyncSession, budget: BudgetCreate, user_id: int):
    new_budget = Budget(
        category_id=budget.category_id,
        limit=budget.limit,
        period=budget.period,
        currency=budget.currency,
        user_id=user_id,
    )
    db.add(new_budget)
    await db.commit()
    await db.refresh(new_budget)
    logger.info(
        "User %s created budget %s (category %s, limit %s, period %s, currency %s)",
        user_id,
        new_budget.id,
        new_budget.category_id,
        new_budget.limit,
        new_budget.period,
        new_budget.currency,
    )
    return new_budget


async def get_budget_by_user(
    db: AsyncSession, user_id: int, limit: int = 20, offset: int = 0
):
    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def update_budget(
    db: AsyncSession, budget_id: int, budget_update: BudgetUpdate, user_id: int
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        return None

    for key, value in budget_update.dict().items():
        setattr(budget, key, value)

    await db.flush()
    await db.commit()
    await db.refresh(budget)
    logger.info(
        "User %s updated budget %s (category %s, limit %s, period %s, currency %s)",
        user_id,
        budget.id,
        budget.category_id,
        budget.limit,
        budget.period,
        budget.currency,
    )
    return budget


async def delete_budget(db: AsyncSession, budget_id: int, user_id: int):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        logger.warning(
            f"delete_budget: NOT FOUND budget_id={budget_id}, user_id={user_id}"
        )
        return None

    await db.delete(budget)
    await db.commit()
    logger.warning(f"delete_budget: DELETED budget_id={budget_id}, user_id={user_id}")
    return budget
