import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import undefer

from app.core.utils import ilike_pattern
from app.features.auth.models import User
from app.features.groups.models import Membership
from app.features.materials.models import Material

_WITH_UPLOADER = select(Material, User.full_name).join(User, User.id == Material.uploader_id)


async def get(session: AsyncSession, material_id: uuid.UUID) -> Material | None:
    return await session.get(Material, material_id)


async def get_with_content(session: AsyncSession, material_id: uuid.UUID) -> Material | None:
    return await session.scalar(
        select(Material).where(Material.id == material_id).options(undefer(Material.content))
    )


async def get_row(session: AsyncSession, material_id: uuid.UUID):
    return (await session.execute(_WITH_UPLOADER.where(Material.id == material_id))).first()


async def list_rows(
    session: AsyncSession, clauses: list, limit: int, offset: int
) -> tuple[list[tuple[Material, str]], int]:
    total = await session.scalar(select(func.count()).select_from(Material).where(*clauses))
    stmt = (
        _WITH_UPLOADER.where(*clauses)
        .order_by(Material.created_at.desc(), Material.id)
        .limit(limit)
        .offset(offset)
    )
    return [(m, n) for m, n in (await session.execute(stmt)).all()], total or 0


def text_clause(q: str):
    p = ilike_pattern(q)
    return or_(Material.title.ilike(p, escape="\\"), Material.file_name.ilike(p, escape="\\"))


def in_groups_of(user_id: uuid.UUID):
    return Material.group_id.in_(select(Membership.group_id).where(Membership.user_id == user_id))


async def count_all(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Material)) or 0
