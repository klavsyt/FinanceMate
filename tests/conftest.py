import os

os.environ["REDIS_URL"] = "redis://localhost:6379/0"
from dotenv import load_dotenv

load_dotenv(".env.test", override=True)

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5433/finance_db_test",
)
os.environ["SYNC_DATABASE_URL"] = os.getenv(
    "TEST_SYNC_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5433/finance_db_test",
)

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base
from app.db.session import async_session
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    async with async_session() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client():
    async with LifespanManager(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://localhost",  # Используем localhost вместо test
        ) as ac:
            yield ac


@pytest_asyncio.fixture
async def auth_headers(client):
    email = "test@example.com"
    password = "12345678"
    username = "testuser"
    resp = await client.post(
        "/api/v1/user/register/",
        json={"email": email, "password": password, "username": username},
    )
    if resp.status_code not in (200, 201, 400):
        print("REGISTER FAIL:", resp.status_code, resp.text)
    resp = await client.post(
        "/api/v1/user/login/",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, f"LOGIN FAIL: {resp.status_code} {resp.text}"
    data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}
