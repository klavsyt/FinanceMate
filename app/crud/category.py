from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
import logging

from app.db.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.db.models.user import User

logger = logging.getLogger("financemate")


async def create_category(
    db: AsyncSession, category_in: CategoryCreate, user: User
) -> Category:
    result = await db.execute(
        select(Category).where(
            Category.name == category_in.name, Category.user_id == user.id
        )
    )
    existing_category = result.scalar_one_or_none()
    if existing_category is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Категория с таким именем уже существует",
        )

    if category_in.parent_id is not None:
        parent_result = await db.execute(
            select(Category).where(
                Category.id == category_in.parent_id, Category.user_id == user.id
            )
        )
        parent_category = parent_result.scalar_one_or_none()
        if not parent_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Родительская категория не найдена",
            )

        if not parent_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Родительская категория не найдена",
            )
        category_in.parent_id = parent_category.id
    category = Category(**category_in.model_dump(), user_id=user.id)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    logger.info(
        f"User {user.id} created category {category.id} (name: {category.name}, type: {category.type}, parent_id: {category.parent_id})"
    )
    return category


async def get_user_categories(
    db: AsyncSession, user: User, limit: int = 20, offset: int = 0
) -> list[Category]:
    result = await db.execute(
        select(Category).where(Category.user_id == user.id).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def update_category(
    db: AsyncSession, category_id: int, category_in: CategoryUpdate, user: User
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        return None

    for key, value in category_in.model_dump().items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    logger.info(
        f"User {user.id} updated category {category.id} (name: {category.name}, type: {category.type}, parent_id: {category.parent_id})"
    )
    return category


async def delete_category(db: AsyncSession, category_id: int, user: User) -> bool:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user.id)
    )
    category = result.scalar_one_or_none()

    if not category:
        return False

    await db.delete(category)
    await db.commit()
    logger.info(f"User {user.id} deleted category {category_id}")
    return True
