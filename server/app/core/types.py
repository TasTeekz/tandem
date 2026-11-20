from typing import Annotated, Literal

from pydantic import AfterValidator, EmailStr, StringConstraints

Locale = Literal["en", "ru", "kk"]
Role = Literal["student", "admin"]
MemberRole = Literal["mentor", "member"]
NotificationType = Literal["new_message", "new_material", "new_goal", "progress_milestone"]

Email = Annotated[EmailStr, AfterValidator(str.lower)]
Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]
FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
