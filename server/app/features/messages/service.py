import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.features.auth.models import User
from app.features.groups import service as groups
from app.features.messages import repository as repo
from app.features.messages.models import Message
from app.features.messages.schemas import MessageOut
from app.features.notifications import service as notifications


def _out(m: Message, author_name: str) -> MessageOut:
    return MessageOut(
        id=m.id,
        group_id=m.group_id,
        author_id=m.author_id,
        author_name=author_name,
        body=m.body,
        created_at=m.created_at,
    )


async def _cursor(session, group_id, message_id) -> Message | None:
    if message_id is None:
        return None
    msg = await repo.get(session, group_id, message_id)
    if msg is None:
        raise not_found("Message not found")
    return msg


async def list_messages(
    session: AsyncSession,
    user: User,
    group_id: uuid.UUID,
    after: uuid.UUID | None,
    before: uuid.UUID | None,
    limit: int,
) -> list[MessageOut]:
    await groups.require_member(session, user, group_id)
    after_msg = await _cursor(session, group_id, after)
    before_msg = await _cursor(session, group_id, before)
    rows = await repo.window(session, group_id, limit, after_msg, before_msg)
    return [_out(m, n) for m, n in rows]


async def post_message(
    session: AsyncSession, user: User, group_id: uuid.UUID, body: str
) -> MessageOut:
    access = await groups.require_member(session, user, group_id)
    msg = Message(group_id=group_id, author_id=user.id, body=body)
    session.add(msg)
    await session.flush()
    recipients = await groups.member_ids(session, group_id, exclude=user.id)
    await notifications.notify(
        session,
        recipients,
        "new_message",
        access.group.title,
        f"{user.full_name}: {body[:140]}",
        group_id,
        coalesce=True,
    )
    await session.commit()
    return _out(msg, user.full_name)


async def count_messages(session: AsyncSession) -> int:
    return await repo.count_all(session)
