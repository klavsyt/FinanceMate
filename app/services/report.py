from sqlalchemy import select, func
from app.db.models.transaction import Transaction
from app.services.curency import convert_to_base


async def get_category_report(
    db, user_id: int, base_currency: str, year: int, month: int = None
):
    query = select(
        Transaction.category_id,
        func.sum(Transaction.amount).label("total"),
        Transaction.currency,
    ).where(Transaction.user_id == user_id)
    if month:
        query = query.where(func.extract("month", Transaction.date) == month)
    query = query.where(func.extract("year", Transaction.date) == year)
    query = query.group_by(Transaction.category_id, Transaction.currency)

    result = await db.execute(query)
    rows = result.fetchall()

    report = {}
    for category_id, total, currency in rows:
        total_in_base = await convert_to_base(total, currency, base_currency, db)
        report.setdefault(category_id, 0)
        report[category_id] += float(total_in_base)
    return report


async def get_monthly_report(db, user_id: int, base_currency: str, year: int):
    from sqlalchemy import extract

    query = select(
        extract("month", Transaction.date).label("month"),
        func.sum(Transaction.amount).label("total"),
        Transaction.currency,
    ).where(Transaction.user_id == user_id)
    query = query.where(extract("year", Transaction.date) == year)
    query = query.group_by("month", Transaction.currency)
    result = await db.execute(query)
    rows = result.fetchall()
    report = {}
    for month, total, currency in rows:
        total_in_base = await convert_to_base(total, currency, base_currency, db)
        report.setdefault(month, 0)
        report[month] += float(total_in_base)
    return report
