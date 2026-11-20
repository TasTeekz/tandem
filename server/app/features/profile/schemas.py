from pydantic import BaseModel

from app.core.types import FullName, Locale, Password


class ProfileUpdate(BaseModel):
    full_name: FullName | None = None
    locale: Locale | None = None
    password: Password | None = None
