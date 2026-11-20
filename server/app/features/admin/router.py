import uuid

from fastapi import APIRouter, Query

from app.core.deps import AdminUser, PageParams, SessionDep
from app.core.pagination import Page
from app.features.admin import service
from app.features.admin.schemas import (
    AdminGroupCreate,
    AdminGroupUpdate,
    AdminUserCreate,
    AdminUserUpdate,
    StatsOut,
)
from app.features.auth import service as auth_service
from app.features.auth.schemas import UserOut
from app.features.groups import service as groups
from app.features.groups.schemas import GroupCreate, GroupOut, GroupUpdate
from app.features.materials import service as materials
from app.features.materials.schemas import MaterialOut, MaterialUpdate

router = APIRouter(prefix="/admin", tags=["admin"])

Q = Query(None, max_length=100)


@router.get("/stats", response_model=StatsOut)
async def get_stats(session: SessionDep, _: AdminUser):
    return await service.stats(session)


@router.get("/users", response_model=Page[UserOut])
async def list_users(session: SessionDep, _: AdminUser, page: PageParams, q: str | None = Q):
    items, total = await service.list_users(session, q, page.limit, page.offset)
    return Page(items=[UserOut.model_validate(u) for u in items], total=total)


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(data: AdminUserCreate, session: SessionDep, _: AdminUser):
    return await service.create_user(session, data)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, session: SessionDep, _: AdminUser):
    return await auth_service.get_user(session, user_id)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID, data: AdminUserUpdate, session: SessionDep, admin: AdminUser
):
    return await service.update_user(session, admin, user_id, data)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, session: SessionDep, admin: AdminUser):
    await service.delete_user(session, admin, user_id)


@router.get("/groups", response_model=Page[GroupOut])
async def list_all_groups(
    session: SessionDep, admin: AdminUser, page: PageParams, q: str | None = Q
):
    items, total = await groups.list_all(session, admin, q, page.limit, page.offset)
    return Page(items=items, total=total)


@router.post("/groups", response_model=GroupOut, status_code=201)
async def create_admin_group(data: AdminGroupCreate, session: SessionDep, admin: AdminUser):
    base = GroupCreate(**data.model_dump(exclude={"owner_id"}))
    return await groups.admin_create(session, admin, data.owner_id, base)


@router.patch("/groups/{group_id}", response_model=GroupOut)
async def update_admin_group(
    group_id: uuid.UUID, data: AdminGroupUpdate, session: SessionDep, admin: AdminUser
):
    base = GroupUpdate(**data.model_dump(exclude={"owner_id"}, exclude_unset=True))
    return await groups.admin_update(session, admin, group_id, base, data.owner_id)


@router.delete("/groups/{group_id}", status_code=204)
async def delete_admin_group(group_id: uuid.UUID, session: SessionDep, admin: AdminUser):
    await groups.admin_delete(session, admin, group_id)


@router.get("/materials", response_model=Page[MaterialOut])
async def list_all_materials(
    session: SessionDep, _: AdminUser, page: PageParams, q: str | None = Q
):
    items, total = await materials.admin_list(session, q, page.limit, page.offset)
    return Page(items=items, total=total)


@router.patch("/materials/{material_id}", response_model=MaterialOut)
async def update_admin_material(
    material_id: uuid.UUID, data: MaterialUpdate, session: SessionDep, _: AdminUser
):
    return await materials.admin_update(session, material_id, data)


@router.delete("/materials/{material_id}", status_code=204)
async def delete_admin_material(material_id: uuid.UUID, session: SessionDep, _: AdminUser):
    await materials.admin_delete(session, material_id)
