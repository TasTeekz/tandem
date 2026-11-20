import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.types import NotificationType


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    group_id: uuid.UUID | None
    is_read: bool
    created_at: datetime


class UnreadCountOut(BaseModel):
    count: int


class ReadAllOut(BaseModel):
    updated: int
