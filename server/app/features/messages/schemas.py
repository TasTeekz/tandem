import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints


class MessageCreate(BaseModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class MessageOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime
