from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


# URL к БД (синхронный драйвер!)
DATABASE_URL = settings.sync_database_url
# Синхронный движок
engine = create_engine(DATABASE_URL)

# Сессия
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
