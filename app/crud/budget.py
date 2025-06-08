from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate


async def create_budget(db: AsyncSession, budget: BudgetCreate, user_id: int):
    new_budget = Budget(
        category_id=budget.category_id,
        limit=budget.limit,
        period=budget.period,
        user_id=user_id,
    )
    db.add(new_budget)
    await db.commit()
    await db.refresh(new_budget)
    return new_budget


async def get_budget_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(Budget).where(Budget.user_id == user_id))
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

    await db.commit()
    await db.refresh(budget)
    return budget


async def delete_budget(db: AsyncSession, budget_id: int, user_id: int):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        return None

    await db.delete(budget)
    await db.commit()
    return budget
