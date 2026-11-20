from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_authenticated
from app.core.pagination import Pagination
from app.db.session import get_session
from app.features.auth import service as auth_service
from app.features.auth.models import User

_bearer = HTTPBearer(auto_error=False)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]
PageParams = Annotated[Pagination, Depends()]


async def optional_user(creds: Credentials, session: SessionDep) -> User | None:
    if creds is None:
        return None
    return await auth_service.user_from_access_token(session, creds.credentials)


async def current_user(user: Annotated[User | None, Depends(optional_user)]) -> User:
    if user is None:
        raise not_authenticated()
    return user


async def admin_user(user: Annotated[User, Depends(current_user)]) -> User:
    return auth_service.require_admin(user)


OptionalUser = Annotated[User | None, Depends(optional_user)]
CurrentUser = Annotated[User, Depends(current_user)]
AdminUser = Annotated[User, Depends(admin_user)]
