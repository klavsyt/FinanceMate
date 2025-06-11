import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/finance_db"
    )
    sync_database_url: str = os.getenv(
        "SYNC_DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@db:5432/finance_db",
    )
    secret_key: Optional[str] = os.getenv("SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Проверка наличия секретного ключа в production
if os.getenv("ENV", "production").lower() == "production" and not settings.secret_key:
    raise RuntimeError("SECRET_KEY must be set in production environment!")
