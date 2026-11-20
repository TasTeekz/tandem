import uuid

from fastapi import APIRouter, File, Form, Response, UploadFile

from app.core.deps import CurrentUser, PageParams, SessionDep
from app.core.pagination import Page
from app.features.materials import service
from app.features.materials.schemas import MaterialOut

router = APIRouter(tags=["materials"])


@router.get("/groups/{group_id}/materials", response_model=Page[MaterialOut])
async def list_materials(
    group_id: uuid.UUID, session: SessionDep, user: CurrentUser, page: PageParams
):
    items, total = await service.list_materials(session, user, group_id, page.limit, page.offset)
    return Page(items=items, total=total)


@router.post("/groups/{group_id}/materials", response_model=MaterialOut, status_code=201)
async def upload_material(
    group_id: uuid.UUID,
    session: SessionDep,
    user: CurrentUser,
    file: UploadFile | None = File(None),
    title: str | None = Form(None),
):
    return await service.upload(session, user, group_id, file, title)


@router.get(
    "/materials/{material_id}/download",
    response_class=Response,
    responses={200: {"content": {"application/octet-stream": {}}, "description": "File bytes"}},
)
async def download_material(material_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    return await service.download(session, user, material_id)


@router.delete("/materials/{material_id}", status_code=204)
async def delete_material(material_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    await service.delete(session, user, material_id)
