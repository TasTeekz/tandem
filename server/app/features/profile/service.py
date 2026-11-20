from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import changes
from app.features.auth import service as auth_service
from app.features.auth.models import User
from app.features.profile.schemas import ProfileUpdate


async def update_profile(session: AsyncSession, user: User, data: ProfileUpdate) -> User:
    return await auth_service.update_user(session, user, changes(data))
