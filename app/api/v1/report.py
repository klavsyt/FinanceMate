from fastapi import APIRouter, Depends, Query
from datetime import date
from app.db.session import get_async_session
from app.crud.user import get_current_user
from app.services.report import get_category_report, get_monthly_report

router = APIRouter(tags=["reports"])


@router.get("/category-summary/")
async def category_summary(
    base_currency: str = Query("RUB"),
    year: int = Query(...),
    month: int = Query(None),
    db=Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    return await get_category_report(
        db=db,
        user_id=current_user.id,
        base_currency=base_currency,
        year=year,
        month=month,
    )


@router.get("/monthly-summary/")
async def monthly_summary(
    base_currency: str = Query("RUB"),
    year: int = Query(...),
    db=Depends(get_async_session),
    current_user=Depends(get_current_user),
):

    return await get_monthly_report(
        db=db,
        user_id=current_user.id,
        base_currency=base_currency,
        year=year,
    )
