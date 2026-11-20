import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.features.notifications import repository as repo
from app.features.notifications.models import Notification


async def notify(
    session: AsyncSession,
    user_ids: list[uuid.UUID],
    type_: str,
    title: str,
    body: str,
    group_id: uuid.UUID | None,
    *,
    coalesce: bool = False,
) -> None:
    """Adds notifications to the session; the caller commits. Never call with the actor."""
    if coalesce and user_ids:
        skip = await repo.users_with_unread(session, user_ids, type_, group_id)
        user_ids = [u for u in user_ids if u not in skip]
    session.add_all(
        Notification(user_id=u, type=type_, title=title, body=body, group_id=group_id)
        for u in user_ids
    )


async def list_notifications(session, user_id, unread_only, limit, offset):
    return await repo.list_for(session, user_id, unread_only, limit, offset)


async def unread_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    return await repo.unread_count(session, user_id)


async def mark_read(
    session: AsyncSession, user_id: uuid.UUID, notification_id: uuid.UUID
) -> Notification:
    n = await repo.get_owned(session, user_id, notification_id)
    if n is None:
        raise not_found("Notification not found")
    n.is_read = True
    await session.commit()
    return n


async def mark_all_read(session: AsyncSession, user_id: uuid.UUID) -> int:
    updated = await repo.mark_all_read(session, user_id)
    await session.commit()
    return updated
