from celery import shared_task
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from decimal import Decimal

from app.db.session import get_async_session
from app.db.session import async_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.exchangerate import ExchangeRate


API_URL = "https://open.er-api.com/v6/latest"
CURRENCIES = {"BYN", "USD", "RUB", "EUR"}


@shared_task
def update_exchange_rates():
    response = httpx.get(API_URL)
    response.raise_for_status()
    data = response.json()
    rates = data.get("rates", {})

    # Гарантируем, что BYN, USD, RUB, EUR всегда есть
    rates["BYN"] = rates.get("BYN", 1.0)
    rates["USD"] = rates.get("USD", 3.2)
    rates["RUB"] = rates.get("RUB", 0.034)
    rates["EUR"] = rates.get("EUR", 3.5)

    import asyncio

    async def update_db():
        async with async_session() as session:
            async with session.begin():
                for currency, rate in rates.items():
                    if currency not in CURRENCIES:
                        continue
                    existing = await session.execute(
                        select(ExchangeRate).where(ExchangeRate.currency == currency)
                    )
                    existing_rate = existing.scalars().first()
                    if existing_rate:
                        # Обновляем rate через setattr, чтобы избежать ошибок типов
                        setattr(existing_rate, "rate", Decimal(str(rate)))
                    else:
                        obj = ExchangeRate(currency=currency, rate=Decimal(str(rate)))
                        session.add(obj)
            await session.commit()

    asyncio.run(update_db())
