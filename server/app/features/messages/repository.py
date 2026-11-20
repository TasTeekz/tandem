import uuid

from sqlalchemy import func, select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.auth.models import User
from app.features.messages.models import Message


async def get(session: AsyncSession, group_id: uuid.UUID, message_id: uuid.UUID) -> Message | None:
    return await session.scalar(
        select(Message).where(Message.id == message_id, Message.group_id == group_id)
    )


async def window(
    session: AsyncSession,
    group_id: uuid.UUID,
    limit: int,
    after: Message | None,
    before: Message | None,
) -> list[tuple[Message, str]]:
    """Messages ordered by (created_at, id); returned ascending."""
    key = tuple_(Message.created_at, Message.id)
    stmt = (
        select(Message, User.full_name)
        .join(User, User.id == Message.author_id)
        .where(Message.group_id == group_id)
    )
    if after is not None:
        stmt = stmt.where(key > (after.created_at, after.id)).order_by(
            Message.created_at, Message.id
        )
    else:
        if before is not None:
            stmt = stmt.where(key < (before.created_at, before.id))
        stmt = stmt.order_by(Message.created_at.desc(), Message.id.desc())
    rows = [(m, n) for m, n in (await session.execute(stmt.limit(limit))).all()]
    return rows if after is not None else rows[::-1]


async def count_all(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Message)) or 0
