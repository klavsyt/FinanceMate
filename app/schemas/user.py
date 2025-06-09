from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: str = Field(min_length=1, max_length=100)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    username: str | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: EmailStr | None = None
