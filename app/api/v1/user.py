from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.core.security import create_access_token, decode_access_token
from app.core.config import settings
from app.db.session import get_async_session
from app.schemas.user import UserCreate, UserRead, Token, TokenData
from app.crud.user import create_user, login_user, get_current_user
from app.db.models.user import User

router = APIRouter(tags=["user"])


@router.post("/register/", response_model=UserRead)
async def register_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_async_session)
):
    """
    Register a new user.
    """
    return await create_user(user_in, db)


@router.post("/login/", response_model=Token)
async def login(
    user_in: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Login a user and return an access token.
    """
    return await login_user(user_in, db)


@router.get("/me/", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Get the current logged-in user.
    """
    return UserRead.from_orm(current_user)


@router.post("/refresh/", response_model=Token)
async def refresh_access_token(refresh_token: str = Body(..., embed=True)):
    """
    Получить новый access_token по refresh_token.
    """
    try:
        payload = decode_access_token(refresh_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        access_token = create_access_token(data={"sub": email})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
