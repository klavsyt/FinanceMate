from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate
from app.crud.transaction import (
    create_transaction,
    get_transaction,
    update_transaction,
    delete_transaction,
    get_transactions_filtered,
)
from app.db.session import get_async_session
from app.crud.user import get_current_user
from app.db.models.user import User


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionOut)
async def create_transaction_endpoint(
    transaction_in: TransactionCreate,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    transaction = await create_transaction(db, transaction_in, user.id)
    if transaction is None:
        raise HTTPException(status_code=400, detail="Ошибка при создании транзакции")
    return transaction


@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    transaction = await get_transaction(db, transaction_id, user)
    if not transaction:
        raise HTTPException(status_code=404, detail="Ошибка при создании транзакции")
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
        raise HTTPException(status_code=404, detail="Ошибка при создании транзакции")
    return updated_transaction


@router.delete("/{transaction_id}", response_model=TransactionOut)
async def delete_transaction_endpoint(
    transaction_id: int,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
):
    deleted_transaction = await delete_transaction(db, transaction_id)
    if not deleted_transaction:
        raise HTTPException(status_code=404, detail="Ошибка при создании транзакции")
    return deleted_transaction


@router.get("/", response_model=List[TransactionOut])
async def get_transactions(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    currency: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    return await get_transactions_filtered(
        db=db,
        user_id=current_user.id,
        date_from=date_from,
        date_to=date_to,
        category_id=category_id,
        min_amount=min_amount,
        max_amount=max_amount,
        currency=currency,
        limit=limit,
        offset=offset,
    )
