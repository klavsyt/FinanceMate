from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError as FastAPIValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from decimal import Decimal

from app.api.v1.user import router as user_router
from app.api.v1.category import router as category_router
from app.api.v1.transaction import router as transaction_router
from app.api.v1.budget import router as budget_router
from app.api.v1.notification import router as notification_router
from app.api.v1.report import router as report_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("financemate")

app = FastAPI(
    title="FinanceMate API",
    description="API для финансового ассистента. Поддерживает бюджеты, транзакции, категории, уведомления, отчёты. Все методы требуют авторизации через Bearer-токен.",
    version="1.0.0",
    contact={"name": "FinanceMate Team", "email": "support@financemate.com"},
    docs_url="/docs",
    redoc_url="/redoc",
)
# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router, prefix="/api/v1/user")
app.include_router(category_router, prefix="/api/v1/category")
app.include_router(budget_router, prefix="/api/v1/budget")
app.include_router(transaction_router, prefix="/api/v1/transaction")
app.include_router(notification_router, prefix="/api/v1/notification")
app.include_router(report_router, prefix="/api/v1/report")


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
