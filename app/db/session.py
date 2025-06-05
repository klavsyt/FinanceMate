from sqlalchemy.ext.asyncio import AsyncSession,create_async_engine,async_sessionmaker
from app.core.config import settings

engine= create_async_engine(settings.database_url,echo=True)
async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
)
async def get_async_session():
    async with async_session() as session:
        yield session