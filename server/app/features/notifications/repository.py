import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.notifications.models import Notification


async def list_for(
    session: AsyncSession, user_id: uuid.UUID, unread_only: bool, limit: int, offset: int
) -> tuple[list[Notification], int]:
    clauses = [Notification.user_id == user_id]
    if unread_only:
        clauses.append(Notification.is_read.is_(False))
    total = await session.scalar(select(func.count()).select_from(Notification).where(*clauses))
    rows = await session.scalars(
        select(Notification)
        .where(*clauses)
        .order_by(Notification.created_at.desc(), Notification.id)
        .limit(limit)
        .offset(offset)
    )
    return list(rows), total or 0


async def unread_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    return (
        await session.scalar(
            select(func.count()).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        or 0
    )


async def get_owned(
    session: AsyncSession, user_id: uuid.UUID, notification_id: uuid.UUID
) -> Notification | None:
    return await session.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )


async def mark_all_read(session: AsyncSession, user_id: uuid.UUID) -> int:
    result = await session.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    return result.rowcount or 0


async def users_with_unread(
    session: AsyncSession, user_ids: list[uuid.UUID], type_: str, group_id: uuid.UUID | None
) -> set[uuid.UUID]:
    rows = await session.scalars(
        select(Notification.user_id).where(
            Notification.user_id.in_(user_ids),
            Notification.type == type_,
            Notification.group_id == group_id,
            Notification.is_read.is_(False),
        )
    )
    return set(rows)
