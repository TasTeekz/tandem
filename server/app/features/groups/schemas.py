import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.core.types import MemberRole

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Subject = Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)]


class GroupCreate(BaseModel):
    title: Title
    description: str | None = None
    subject: Subject | None = None
    is_public: bool = True


class GroupUpdate(BaseModel):
    title: Title | None = None
    description: str | None = None
    subject: Subject | None = None
    is_public: bool | None = None


class GroupOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    subject: str | None
    is_public: bool
    created_at: datetime
    members_count: int
    my_role: MemberRole | None


class MemberOut(BaseModel):
    user_id: uuid.UUID
    full_name: str
    role: MemberRole
    joined_at: datetime


class MemberRoleUpdate(BaseModel):
    role: MemberRole
