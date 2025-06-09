from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from app.schemas.budget import *
from app.crud.budget import *
from app.services.budget import *
from app.db.session import get_async_session
from app.crud.user import get_current_user
from app.db.models.user import User

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("/", response_model=BudgetOut)
async def create_budget_endpoint(
    budget_in: BudgetCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new budget.
    """
    return await create_budget(db, budget_in, current_user.id)


@router.get("/", response_model=list[BudgetOut])
async def get_user_budgets_endpoint(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all budgets for the current user.
    """
    return await get_budget_by_user(db, current_user.id)


@router.put("/{budget_id}/", response_model=BudgetOut)
async def update_budget_endpoint(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update a budget by ID.
    """
    updated_budget = await update_budget(db, budget_id, budget_in, current_user.id)
    if not updated_budget:
        raise HTTPException(status_code=404, detail="Бюджет не найден")
    return updated_budget


@router.delete("/{budget_id}/", response_model=BudgetOut)
async def delete_budget_endpoint(
    budget_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a budget by ID.
    """
    deleted_budget = await delete_budget(db, budget_id, current_user.id)
    if not deleted_budget:
        raise HTTPException(status_code=404, detail="Бюджет не найден")
    return deleted_budget


@router.get("/analytics/", response_model=list[BudgetAnalyticsOut])
async def get_user_budget_analytics_endpoint(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get budget analytics for the current user.
    """
    return await get_user_budget_analytics(db, current_user.id)
