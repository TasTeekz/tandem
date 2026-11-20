import uuid

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, SessionDep
from app.core.pagination import Page
from app.features.messages import service
from app.features.messages.schemas import MessageCreate, MessageOut

router = APIRouter(prefix="/groups/{group_id}/messages", tags=["messages"])


@router.get("", response_model=Page[MessageOut])
async def list_messages(
    group_id: uuid.UUID,
    session: SessionDep,
    user: CurrentUser,
    after: uuid.UUID | None = None,
    before: uuid.UUID | None = None,
    limit: int = Query(50, ge=1, le=100),
):
    items = await service.list_messages(session, user, group_id, after, before, limit)
    return Page(items=items, total=len(items))


@router.post("", response_model=MessageOut, status_code=201)
async def create_message(
    group_id: uuid.UUID, data: MessageCreate, session: SessionDep, user: CurrentUser
):
    return await service.post_message(session, user, group_id, data.body)
