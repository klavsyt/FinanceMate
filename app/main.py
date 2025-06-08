from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.user import router as user_router
from app.api.v1.category import router as category_router
from app.api.v1.transaction import router as transaction_router


app = FastAPI()
app.include_router(user_router)
app.include_router(category_router)
app.include_router(transaction_router)
