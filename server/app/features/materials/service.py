import mimetypes
import uuid
from urllib.parse import quote

from fastapi import Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError, forbidden, not_found
from app.core.utils import changes
from app.features.auth.models import User
from app.features.groups import service as groups
from app.features.materials import repository as repo
from app.features.materials.models import Material
from app.features.materials.schemas import MaterialOut, MaterialUpdate
from app.features.notifications import service as notifications


def _out(m: Material, uploader_name: str) -> MaterialOut:
    return MaterialOut(
        id=m.id,
        group_id=m.group_id,
        uploader_id=m.uploader_id,
        uploader_name=uploader_name,
        title=m.title,
        file_name=m.file_name,
        mime_type=m.mime_type,
        size_bytes=m.size_bytes,
        created_at=m.created_at,
    )


async def list_materials(session, user: User, group_id, limit, offset):
    await groups.require_member(session, user, group_id)
    rows, total = await repo.list_rows(session, [Material.group_id == group_id], limit, offset)
    return [_out(m, n) for m, n in rows], total


async def upload(
    session: AsyncSession,
    user: User,
    group_id: uuid.UUID,
    file: UploadFile | None,
    title: str | None,
) -> MaterialOut:
    access = await groups.require_member(session, user, group_id)
    if file is None:
        raise AppError("unsupported_media", 415, "Send multipart/form-data with a `file` part")
    limit = get_settings().max_upload_bytes
    content = await file.read(limit + 1)  # never buffer more than limit+1 bytes
    if len(content) > limit:
        raise AppError("file_too_large", 413, f"File exceeds {limit // (1024 * 1024)} MB")
    if not content:
        raise AppError("unsupported_media", 415, "Empty file")
    file_name = (file.filename or "file").replace("\\", "/").rsplit("/", 1)[-1][:255] or "file"
    mime = file.content_type or mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    material = Material(
        group_id=group_id,
        uploader_id=user.id,
        title=(title or "").strip()[:200] or file_name[:200],
        file_name=file_name,
        mime_type=mime[:127],
        size_bytes=len(content),
        content=content,
    )
    session.add(material)
    await session.flush()
    recipients = await groups.member_ids(session, group_id, exclude=user.id)
    await notifications.notify(
        session,
        recipients,
        "new_material",
        access.group.title,
        f"{user.full_name} uploaded {material.title}",
        group_id,
    )
    await session.commit()
    return _out(material, user.full_name)


async def _load(session: AsyncSession, material_id: uuid.UUID) -> Material:
    material = await repo.get(session, material_id)
    if material is None:
        raise not_found("Material not found")
    return material


async def download(session: AsyncSession, user: User, material_id: uuid.UUID) -> Response:
    material = await _load(session, material_id)
    await groups.require_member(session, user, material.group_id)
    full = await repo.get_with_content(session, material_id)
    ascii_name = full.file_name.encode("ascii", "replace").decode().replace('"', "'")
    disposition = f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(full.file_name)}"
    return Response(
        content=full.content,
        media_type=full.mime_type,
        headers={"Content-Disposition": disposition},
    )


async def delete(session: AsyncSession, user: User, material_id: uuid.UUID) -> None:
    material = await _load(session, material_id)
    access = await groups.get_access(session, user, material.group_id)
    if not (material.uploader_id == user.id or access.is_mentor):
        raise forbidden("Only the uploader or a mentor can delete this material")
    await session.delete(material)
    await session.commit()


async def search(session: AsyncSession, user: User, q: str, limit: int) -> list[MaterialOut]:
    clauses = [repo.text_clause(q)]
    if user.role != "admin":
        clauses.append(repo.in_groups_of(user.id))
    rows, _ = await repo.list_rows(session, clauses, limit, 0)
    return [_out(m, n) for m, n in rows]


async def admin_list(session, q, limit, offset):
    rows, total = await repo.list_rows(session, [repo.text_clause(q)] if q else [], limit, offset)
    return [_out(m, n) for m, n in rows], total


async def admin_update(session: AsyncSession, material_id: uuid.UUID, data: MaterialUpdate):
    material = await _load(session, material_id)
    for k, v in changes(data).items():
        setattr(material, k, v)
    await session.commit()
    return _out(*(await repo.get_row(session, material_id)))


async def admin_delete(session: AsyncSession, material_id: uuid.UUID) -> None:
    await session.delete(await _load(session, material_id))
    await session.commit()


async def count_materials(session: AsyncSession) -> int:
    return await repo.count_all(session)
