from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.budget import Budget
from app.db.models.transaction import Transaction
from decimal import Decimal


async def get_user_budget_analytics(db: AsyncSession, user_id: int):
    stmt = select(Budget).where(Budget.user_id == user_id)
    result = await db.execute(stmt)
    budgets = result.scalars().all()

    analytics = []

    for budget in budgets:
        spent_stmt = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
        )
        spent_result = await db.execute(spent_stmt)
        spent = spent_result.scalar() or Decimal("0.00")

        analytics.append(
            {
                "budget_id": budget.id,
                "category_id": budget.category_id,
                "period": budget.period.value,
                "limit": float(budget.limit),
                "spent": float(spent),
                "remaining": float(budget.limit - spent),
                "is_exceeded": spent > budget.limit,
            }
        )

    return analytics
