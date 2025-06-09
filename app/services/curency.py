from decimal import Decimal
from sqlalchemy import select


async def convert_to_base(amount: Decimal, from_currency: str, base_currency: str, db):
    if from_currency == base_currency:
        return amount
    from app.db.models.exchangerate import ExchangeRate

    # Если одна из валют USD — используем напрямую
    if from_currency == "USD":
        # USD -> base_currency
        result = await db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == base_currency)
        )
        rate = result.scalar()
        if rate is None:
            raise ValueError(f"Нет курса для {base_currency}")
        return amount * rate
    elif base_currency == "USD":
        # from_currency -> USD
        result = await db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == from_currency)
        )
        rate = result.scalar()
        if rate is None:
            raise ValueError(f"Нет курса для {from_currency}")
        return amount / rate
    else:
        # from_currency -> USD -> base_currency
        result_from = await db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == from_currency)
        )
        rate_from = result_from.scalar()
        if rate_from is None:
            raise ValueError(f"Нет курса для {from_currency}")
        result_to = await db.execute(
            select(ExchangeRate.rate).where(ExchangeRate.currency == base_currency)
        )
        rate_to = result_to.scalar()
        if rate_to is None:
            raise ValueError(f"Нет курса для {base_currency}")
        usd_amount = amount / rate_from
        return usd_amount * rate_to
