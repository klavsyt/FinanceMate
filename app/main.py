from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError as FastAPIValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from decimal import Decimal
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
import os
import sentry_sdk
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.user import router as user_router
from app.api.v1.category import router as category_router
from app.api.v1.transaction import router as transaction_router
from app.api.v1.budget import router as budget_router
from app.api.v1.notification import router as notification_router
from app.api.v1.report import router as report_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("financemate")


ENV = os.getenv("ENV", "production").lower()
IS_PROD = ENV == "production"


sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", None),
    send_default_pii=True,
    traces_sample_rate=1.0,
    profile_session_sample_rate=1.0,
    profile_lifecycle="trace",
    environment=os.getenv("SENTRY_ENV", ENV),
)

app = FastAPI(
    title="FinanceMate API",
    description="API для финансового ассистента. Поддерживает бюджеты, транзакции, категории, уведомления, отчёты. Все методы требуют авторизации через Bearer-токен.",
    version="1.0.0",
    contact={"name": "FinanceMate Team", "email": "support@financemate.com"},
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
)

Instrumentator().instrument(app).expose(app)

if IS_PROD:
    allowed_origins = (
        os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
    )
else:
    allowed_origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    user_router,
    prefix="/api/v1/user",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)
app.include_router(
    category_router,
    prefix="/api/v1/category",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)
app.include_router(
    budget_router,
    prefix="/api/v1/budget",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)
app.include_router(
    transaction_router,
    prefix="/api/v1/transaction",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)
app.include_router(
    notification_router,
    prefix="/api/v1/notification",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)
app.include_router(
    report_router,
    prefix="/api/v1/report",
    dependencies=[Depends(RateLimiter(times=100, seconds=60))],
)


@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = await redis.from_url(
        redis_url, encoding="utf8", decode_responses=True
    )
    await FastAPILimiter.init(redis_client)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.status_code},
    )


def safe_jsonable(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, ValueError):
        return str(obj)
    if isinstance(obj, dict):
        return {k: safe_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [safe_jsonable(v) for v in obj]
    return obj


@app.exception_handler(FastAPIValidationError)
async def validation_exception_handler(request: Request, exc: FastAPIValidationError):
    logger.info(f"Validation error: {exc.errors()}")
    errors = safe_jsonable(exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": errors, "code": 422},
    )


@app.get(
    "/health", tags=["infra"], dependencies=[Depends(RateLimiter(times=5, seconds=5))]
)
def healthcheck():
    """Healthcheck endpoint for monitoring and load balancers."""
    return {"status": "ok"}
