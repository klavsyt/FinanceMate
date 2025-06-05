from fastapi import Depends, HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

from app.db.session import get_async_session
from app.db.models.user import User
from app.core.security import hash_password, verify_password,create_access_token, decode_access_token
from app.schemas.user import UserCreate,UserRead, Token, TokenData


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

async def create_user(
    user_in:UserCreate,
    db: AsyncSession
):
    result= await db.execute(select(User).where(User.email == user_in.email))
    user= result.scalar_one_or_none()
    if user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Email уже зарегистрирован")
    
    result = await db.execute(select(User).where(User.username == user_in.username))
    user = result.scalar_one_or_none()
    if user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username уже зарегистрирован")
    
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

    
async def login_user(
    user_in: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_session)
):
    result = await db.execute(select(User).where(User.email == user_in.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверные учетные данные")
    
    access_token = create_access_token(data={"sub": user.email})

    return {'access_token': access_token, 'token_type': 'bearer'}

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось авторизовать пользователя",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user
