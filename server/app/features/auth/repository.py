import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import ilike_pattern
from app.features.auth.models import User


async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def admin_exists(session: AsyncSession) -> bool:
    return bool(await session.scalar(select(func.count()).where(User.role == "admin")))


async def list_users(
    session: AsyncSession, q: str | None, limit: int, offset: int
) -> tuple[list[User], int]:
    clauses = []
    if q:
        p = ilike_pattern(q)
        clauses.append(or_(User.email.ilike(p, escape="\\"), User.full_name.ilike(p, escape="\\")))
    total = await session.scalar(select(func.count()).select_from(User).where(*clauses))
    rows = await session.scalars(
        select(User)
        .where(*clauses)
        .order_by(User.created_at.desc(), User.id)
        .limit(limit)
        .offset(offset)
    )
    return list(rows), total or 0


async def search_by_name(session: AsyncSession, q: str, limit: int) -> list[User]:
    rows = await session.scalars(
        select(User)
        .where(User.is_active.is_(True), User.full_name.ilike(ilike_pattern(q), escape="\\"))
        .order_by(User.full_name, User.id)
        .limit(limit)
    )
    return list(rows)


async def count(session: AsyncSession, *clauses) -> int:
    return await session.scalar(select(func.count()).select_from(User).where(*clauses)) or 0
