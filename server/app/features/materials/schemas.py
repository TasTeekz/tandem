import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints


class MaterialOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    uploader_id: uuid.UUID
    uploader_name: str
    title: str
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime


class MaterialUpdate(BaseModel):
    title: (
        Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
        | None
    ) = None
