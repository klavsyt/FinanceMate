from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate
from app.crud.transaction import (
    create_transaction,
    get_transaction,
    update_transaction,
    delete_transaction,
)
from app.db.session import get_async_session
from app.crud.user import get_current_user
from app.db.models.user import User


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionOut)
async def create_transaction_endpoint(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    return await create_transaction(db, transaction, user.id)


@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    transaction = await get_transaction(db, transaction_id, user)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionOut)
async def update_transaction_endpoint(
    transaction_id: int,
    transaction: TransactionUpdate,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    updated_transaction = await update_transaction(db, transaction_id, transaction)
    if not updated_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated_transaction


@router.delete("/{transaction_id}", response_model=TransactionOut)
async def delete_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    deleted_transaction = await delete_transaction(db, transaction_id)
    if not deleted_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return deleted_transaction
