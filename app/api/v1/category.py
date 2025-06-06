from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.crud.category import (
    create_category,
    get_user_categories,
    update_category,
    delete_category,
)
from app.db.session import get_async_session
from app.crud.user import get_current_user
from app.db.models.user import User


router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "/",
    response_model=CategoryRead,
)
async def create_category_endpoint(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new category.
    """

    return await create_category(db, category_in, current_user)


@router.get("/", response_model=list[CategoryRead])
async def get_user_categories_endpoint(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all categories for the current user.
    """
    return await get_user_categories(db, current_user)


@router.put("/{category_id}/", response_model=CategoryRead)
async def update_category_endpoint(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update a category by ID.
    """
    updated_category = await update_category(db, category_id, category_in, current_user)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return updated_category


@router.delete("/{category_id}/", response_model=dict)
async def delete_category_endpoint(
    category_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a category by ID.
    """
    success = await delete_category(db, category_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return {"detail": "Категория успешно удалена"}
