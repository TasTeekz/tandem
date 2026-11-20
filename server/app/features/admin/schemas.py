import uuid

from pydantic import BaseModel

from app.core.types import Email, FullName, Locale, Password, Role
from app.features.groups.schemas import GroupCreate, GroupUpdate


class StatsOut(BaseModel):
    users: int
    groups: int
    materials: int
    messages: int
    goals: int
    active_users: int


class AdminUserCreate(BaseModel):
    email: Email
    password: Password
    full_name: FullName
    role: Role = "student"
    locale: Locale = "en"
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    email: Email | None = None
    full_name: FullName | None = None
    role: Role | None = None
    locale: Locale | None = None
    is_active: bool | None = None
    password: Password | None = None


class AdminGroupCreate(GroupCreate):
    owner_id: uuid.UUID


class AdminGroupUpdate(GroupUpdate):
    owner_id: uuid.UUID | None = None
