import uuid

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, OptionalUser, PageParams, SessionDep
from app.core.pagination import Page
from app.features.groups import service
from app.features.groups.schemas import (
    GroupCreate,
    GroupOut,
    GroupUpdate,
    MemberOut,
    MemberRoleUpdate,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=Page[GroupOut])
async def list_groups(
    session: SessionDep,
    user: OptionalUser,
    page: PageParams,
    q: str | None = Query(None, max_length=100),
    subject: str | None = Query(None, max_length=80),
):
    items, total = await service.list_public(session, user, q, subject, page.limit, page.offset)
    return Page(items=items, total=total)


@router.get("/mine", response_model=Page[GroupOut])
async def list_my_groups(session: SessionDep, user: CurrentUser, page: PageParams):
    items, total = await service.list_mine(session, user, page.limit, page.offset)
    return Page(items=items, total=total)


@router.post("", response_model=GroupOut, status_code=201)
async def create_group(data: GroupCreate, session: SessionDep, user: CurrentUser):
    return await service.create(session, user, data)


@router.get("/{group_id}", response_model=GroupOut)
async def get_group(group_id: uuid.UUID, session: SessionDep, user: OptionalUser):
    await service.get_access(session, user, group_id)
    return await service.get_out(session, user, group_id)


@router.patch("/{group_id}", response_model=GroupOut)
async def update_group(
    group_id: uuid.UUID, data: GroupUpdate, session: SessionDep, user: CurrentUser
):
    return await service.update(session, user, group_id, data)


@router.delete("/{group_id}", status_code=204)
async def delete_group(group_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    await service.delete(session, user, group_id)


@router.post("/{group_id}/join", response_model=MemberOut, status_code=201)
async def join_group(group_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    return await service.join(session, user, group_id)


@router.post("/{group_id}/leave", status_code=204)
async def leave_group(group_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    await service.leave(session, user, group_id)


@router.get("/{group_id}/members", response_model=Page[MemberOut])
async def list_members(
    group_id: uuid.UUID, session: SessionDep, user: CurrentUser, page: PageParams
):
    items, total = await service.list_members(session, user, group_id, page.limit, page.offset)
    return Page(items=items, total=total)


@router.patch("/{group_id}/members/{user_id}", response_model=MemberOut)
async def update_member_role(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    data: MemberRoleUpdate,
    session: SessionDep,
    user: CurrentUser,
):
    return await service.set_member_role(session, user, group_id, user_id, data.role)


@router.delete("/{group_id}/members/{user_id}", status_code=204)
async def remove_member(
    group_id: uuid.UUID, user_id: uuid.UUID, session: SessionDep, user: CurrentUser
):
    await service.remove_member(session, user, group_id, user_id)
