from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.db.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.db.models.user import User


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

    category = Category(**category_in.model_dump(), user_id=user.id)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def get_user_categories(db: AsyncSession, user: User) -> list[Category]:
    result = await db.execute(select(Category).where(Category.user_id == user.id))
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
    return True
