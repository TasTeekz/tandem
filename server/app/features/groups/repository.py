import uuid

from sqlalchemy import String, cast, delete, func, null, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.auth.models import User
from app.features.groups.models import Group, Membership


def _select_with_meta(uid: uuid.UUID | None):
    count = (
        select(func.count(Membership.id))
        .where(Membership.group_id == Group.id)
        .correlate(Group)
        .scalar_subquery()
    )
    if uid is None:
        role = cast(null(), String(16))
    else:
        role = (
            select(Membership.role)
            .where(Membership.group_id == Group.id, Membership.user_id == uid)
            .correlate(Group)
            .scalar_subquery()
        )
    return select(Group, count.label("members_count"), role.label("my_role"))


async def get_row(session: AsyncSession, uid: uuid.UUID | None, group_id: uuid.UUID):
    return (await session.execute(_select_with_meta(uid).where(Group.id == group_id))).first()


async def list_rows(
    session: AsyncSession, uid: uuid.UUID | None, clauses: list, limit: int, offset: int
):
    total = await session.scalar(select(func.count()).select_from(Group).where(*clauses))
    stmt = (
        _select_with_meta(uid)
        .where(*clauses)
        .order_by(Group.created_at.desc(), Group.id)
        .limit(limit)
        .offset(offset)
    )
    return (await session.execute(stmt)).all(), total or 0


def member_group_ids(uid: uuid.UUID):
    return select(Membership.group_id).where(Membership.user_id == uid)


async def get_group(session: AsyncSession, group_id: uuid.UUID) -> Group | None:
    return await session.get(Group, group_id)


async def get_membership(
    session: AsyncSession, group_id: uuid.UUID, user_id: uuid.UUID
) -> Membership | None:
    return await session.scalar(
        select(Membership).where(Membership.group_id == group_id, Membership.user_id == user_id)
    )


async def count_mentors(session: AsyncSession, group_id: uuid.UUID) -> int:
    return (
        await session.scalar(
            select(func.count()).where(Membership.group_id == group_id, Membership.role == "mentor")
        )
        or 0
    )


async def member_rows(
    session: AsyncSession, group_id: uuid.UUID, limit: int | None = None, offset: int = 0
) -> list[tuple[Membership, str]]:
    stmt = (
        select(Membership, User.full_name)
        .join(User, User.id == Membership.user_id)
        .where(Membership.group_id == group_id)
        .order_by(Membership.joined_at, Membership.id)
        .offset(offset)
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    return [(m, n) for m, n in (await session.execute(stmt)).all()]


async def count_members(session: AsyncSession, group_id: uuid.UUID) -> int:
    return await session.scalar(select(func.count()).where(Membership.group_id == group_id)) or 0


async def member_ids(
    session: AsyncSession, group_id: uuid.UUID, role: str | None, exclude: uuid.UUID | None
) -> list[uuid.UUID]:
    stmt = select(Membership.user_id).where(Membership.group_id == group_id)
    if role:
        stmt = stmt.where(Membership.role == role)
    if exclude:
        stmt = stmt.where(Membership.user_id != exclude)
    return list(await session.scalars(stmt))


async def delete_membership(session: AsyncSession, membership: Membership) -> None:
    await session.execute(delete(Membership).where(Membership.id == membership.id))


async def count_all(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Group)) or 0
