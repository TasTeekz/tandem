import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser, PageParams, SessionDep
from app.core.pagination import Page
from app.features.notifications import service
from app.features.notifications.schemas import NotificationOut, ReadAllOut, UnreadCountOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationOut])
async def list_notifications(
    session: SessionDep, user: CurrentUser, page: PageParams, unread_only: bool = False
):
    items, total = await service.list_notifications(
        session, user.id, unread_only, page.limit, page.offset
    )
    return Page(items=[NotificationOut.model_validate(n) for n in items], total=total)


@router.get("/unread-count", response_model=UnreadCountOut)
async def get_unread_count(session: SessionDep, user: CurrentUser):
    return UnreadCountOut(count=await service.unread_count(session, user.id))


@router.post("/read-all", response_model=ReadAllOut)
async def read_all_notifications(session: SessionDep, user: CurrentUser):
    return ReadAllOut(updated=await service.mark_all_read(session, user.id))


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def read_notification(notification_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    return await service.mark_read(session, user.id, notification_id)
