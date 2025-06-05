from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.user import router as user_router


app= FastAPI()
app.include_router(user_router)


