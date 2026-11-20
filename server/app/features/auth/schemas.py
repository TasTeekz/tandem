import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.types import Email, FullName, Locale, Password, Role


class RegisterIn(BaseModel):
    email: Email
    password: Password
    full_name: FullName
    locale: Locale = "en"


class LoginIn(BaseModel):
    email: Email
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: Role
    locale: Locale
    is_active: bool
    created_at: datetime


class PublicUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthOut(TokenOut):
    user: UserOut
