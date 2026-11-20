import uuid

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import forbidden
from app.core.utils import changes
from app.features.admin.schemas import AdminUserCreate, AdminUserUpdate, StatsOut
from app.features.auth import repository as users_repo
from app.features.auth import service as auth_service
from app.features.auth.models import User
from app.features.goals import service as goals
from app.features.groups import service as groups
from app.features.materials import service as materials
from app.features.messages import service as messages


async def stats(session: AsyncSession) -> StatsOut:
    return StatsOut(
        users=await users_repo.count(session),
        groups=await groups.count_groups(session),
        materials=await materials.count_materials(session),
        messages=await messages.count_messages(session),
        goals=await goals.count_goals(session),
        active_users=await users_repo.count(session, User.is_active.is_(True)),
    )


async def list_users(session, q, limit, offset):
    return await users_repo.list_users(session, q, limit, offset)


async def create_user(session: AsyncSession, data: AdminUserCreate) -> User:
    return await auth_service.create_user(session, **data.model_dump())


async def update_user(
    session: AsyncSession, admin: User, user_id: uuid.UUID, data: AdminUserUpdate
) -> User:
    user = await auth_service.get_user(session, user_id)
    fields = changes(data)
    if user.id == admin.id and (
        fields.get("role", "admin") != "admin" or fields.get("is_active", True) is False
    ):
        raise forbidden("You cannot demote or deactivate yourself")
    return await auth_service.update_user(session, user, fields)


async def delete_user(session: AsyncSession, admin: User, user_id: uuid.UUID) -> None:
    user = await auth_service.get_user(session, user_id)
    if user.id == admin.id:
        raise forbidden("You cannot delete yourself")
    await session.execute(delete(User).where(User.id == user.id))  # FK cascades do the rest
    await session.commit()
