import uuid
from dataclasses import dataclass

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import conflict, forbidden, not_found
from app.core.utils import changes, ilike_pattern
from app.features.auth import service as auth_service
from app.features.auth.models import User
from app.features.groups import repository as repo
from app.features.groups.models import Group, Membership
from app.features.groups.schemas import (
    GroupCreate,
    GroupOut,
    GroupUpdate,
    MemberOut,
)

NULLABLE = frozenset({"description", "subject"})


@dataclass
class Access:
    group: Group
    role: str | None
    is_admin: bool

    @property
    def is_member(self) -> bool:
        return self.role is not None or self.is_admin

    @property
    def is_mentor(self) -> bool:
        return self.role == "mentor" or self.is_admin


def _out(row) -> GroupOut:
    g, count, role = row
    return GroupOut(
        id=g.id,
        owner_id=g.owner_id,
        title=g.title,
        description=g.description,
        subject=g.subject,
        is_public=g.is_public,
        created_at=g.created_at,
        members_count=count,
        my_role=role,
    )


def _uid(user: User | None) -> uuid.UUID | None:
    return user.id if user else None


def _text_clause(q: str):
    p = ilike_pattern(q)
    return or_(
        Group.title.ilike(p, escape="\\"),
        Group.description.ilike(p, escape="\\"),
        Group.subject.ilike(p, escape="\\"),
    )


async def _list(session, user, clauses, limit, offset) -> tuple[list[GroupOut], int]:
    rows, total = await repo.list_rows(session, _uid(user), clauses, limit, offset)
    return [_out(r) for r in rows], total


async def get_out(session: AsyncSession, user: User | None, group_id: uuid.UUID) -> GroupOut:
    row = await repo.get_row(session, _uid(user), group_id)
    return _out(row)


async def get_access(session: AsyncSession, user: User | None, group_id: uuid.UUID) -> Access:
    """Loads the group and the caller's standing; hides private groups from outsiders."""
    group = await repo.get_group(session, group_id)
    if group is None:
        raise not_found("Group not found")
    membership = await repo.get_membership(session, group_id, user.id) if user else None
    is_admin = bool(user and user.role == "admin")
    if not (group.is_public or membership or is_admin):
        raise not_found("Group not found")
    return Access(group, membership.role if membership else None, is_admin)


async def require_member(session: AsyncSession, user: User, group_id: uuid.UUID) -> Access:
    access = await get_access(session, user, group_id)
    if not access.is_member:
        raise forbidden("Members only")
    return access


async def require_mentor(session: AsyncSession, user: User, group_id: uuid.UUID) -> Access:
    access = await get_access(session, user, group_id)
    if not access.is_mentor:
        raise forbidden("Mentors only")
    return access


async def list_public(session, user, q, subject, limit, offset):
    clauses = [Group.is_public.is_(True)]
    if q:
        clauses.append(_text_clause(q))
    if subject:
        clauses.append(Group.subject == subject)
    return await _list(session, user, clauses, limit, offset)


async def list_mine(session, user: User, limit: int, offset: int):
    return await _list(session, user, [Group.id.in_(repo.member_group_ids(user.id))], limit, offset)


async def search(session: AsyncSession, user: User, q: str, limit: int) -> list[GroupOut]:
    clauses = [_text_clause(q)]
    if user.role != "admin":
        clauses.append(or_(Group.is_public.is_(True), Group.id.in_(repo.member_group_ids(user.id))))
    return (await _list(session, user, clauses, limit, 0))[0]


async def list_all(session, user, q, limit, offset):
    return await _list(session, user, [_text_clause(q)] if q else [], limit, offset)


async def _add_member(session: AsyncSession, group_id, user_id, role: str) -> Membership:
    m = Membership(group_id=group_id, user_id=user_id, role=role)
    session.add(m)
    await session.flush()
    return m


async def create(
    session: AsyncSession, owner: User, data: GroupCreate, *, owner_id: uuid.UUID | None = None
) -> GroupOut:
    group = Group(owner_id=owner_id or owner.id, **data.model_dump())
    session.add(group)
    await session.flush()
    await _add_member(session, group.id, group.owner_id, "mentor")
    await session.commit()
    return await get_out(session, owner, group.id)


async def update(
    session: AsyncSession, user: User, group_id: uuid.UUID, data: GroupUpdate
) -> GroupOut:
    access = await require_mentor(session, user, group_id)
    for k, v in changes(data, NULLABLE).items():
        setattr(access.group, k, v)
    await session.commit()
    return await get_out(session, user, group_id)


async def delete(session: AsyncSession, user: User, group_id: uuid.UUID) -> None:
    access = await get_access(session, user, group_id)
    if not (access.is_admin or access.group.owner_id == user.id):
        raise forbidden("Only the owner can delete the group")
    await session.delete(access.group)
    await session.commit()


async def join(session: AsyncSession, user: User, group_id: uuid.UUID) -> MemberOut:
    access = await get_access(session, user, group_id)
    already = conflict("already_member", "Already a member")
    if access.role:
        raise already
    try:
        m = await _add_member(session, group_id, user.id, "member")
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise already from e
    return MemberOut(
        user_id=user.id, full_name=user.full_name, role="member", joined_at=m.joined_at
    )


async def _guard_last_mentor(session, group_id, membership: Membership) -> None:
    if membership.role == "mentor" and await repo.count_mentors(session, group_id) <= 1:
        raise conflict("last_mentor", "A group must keep at least one mentor")


async def leave(session: AsyncSession, user: User, group_id: uuid.UUID) -> None:
    access = await get_access(session, user, group_id)
    membership = await repo.get_membership(session, group_id, user.id)
    if membership is None:
        raise conflict("not_member", "Not a member of this group")
    await _guard_last_mentor(session, access.group.id, membership)
    await repo.delete_membership(session, membership)
    await session.commit()


async def list_members(session, user: User, group_id, limit, offset):
    await require_member(session, user, group_id)
    total = await repo.count_members(session, group_id)
    rows = await repo.member_rows(session, group_id, limit, offset)
    return [_member_out(m, n) for m, n in rows], total


def _member_out(m: Membership, name: str) -> MemberOut:
    return MemberOut(user_id=m.user_id, full_name=name, role=m.role, joined_at=m.joined_at)


async def _target(session, group_id, user_id) -> Membership:
    m = await repo.get_membership(session, group_id, user_id)
    if m is None:
        raise not_found("Member not found")
    return m


async def set_member_role(
    session: AsyncSession, user: User, group_id: uuid.UUID, user_id: uuid.UUID, role: str
) -> MemberOut:
    await require_mentor(session, user, group_id)
    m = await _target(session, group_id, user_id)
    if role != "mentor":
        await _guard_last_mentor(session, group_id, m)
    m.role = role
    await session.commit()
    target = await auth_service.get_user(session, user_id)
    return _member_out(m, target.full_name)


async def remove_member(
    session: AsyncSession, user: User, group_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    await require_mentor(session, user, group_id)
    m = await _target(session, group_id, user_id)
    await _guard_last_mentor(session, group_id, m)
    await repo.delete_membership(session, m)
    await session.commit()


async def admin_create(session: AsyncSession, admin: User, owner_id: uuid.UUID, data: GroupCreate):
    await auth_service.get_user(session, owner_id)
    return await create(session, admin, data, owner_id=owner_id)


async def admin_update(
    session: AsyncSession, admin: User, group_id: uuid.UUID, data: GroupUpdate, owner_id
) -> GroupOut:
    access = await get_access(session, admin, group_id)
    for k, v in changes(data, NULLABLE).items():
        setattr(access.group, k, v)
    if owner_id and owner_id != access.group.owner_id:
        await auth_service.get_user(session, owner_id)
        access.group.owner_id = owner_id
        m = await repo.get_membership(session, group_id, owner_id)
        if m:
            m.role = "mentor"
        else:
            await _add_member(session, group_id, owner_id, "mentor")
    await session.commit()
    return await get_out(session, admin, group_id)


async def admin_delete(session: AsyncSession, admin: User, group_id: uuid.UUID) -> None:
    await delete(session, admin, group_id)


async def member_ids(session, group_id, *, exclude=None, role=None) -> list[uuid.UUID]:
    return await repo.member_ids(session, group_id, role, exclude)


async def all_members(session: AsyncSession, group_id: uuid.UUID) -> list[MemberOut]:
    return [_member_out(m, n) for m, n in await repo.member_rows(session, group_id)]


async def count_groups(session: AsyncSession) -> int:
    return await repo.count_all(session)
