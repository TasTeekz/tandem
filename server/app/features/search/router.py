from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, SessionDep
from app.features.search import service
from app.features.search.schemas import SearchOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchOut)
async def search_all(
    session: SessionDep,
    user: CurrentUser,
    q: str = Query(min_length=1, max_length=100),
    limit: int = Query(5, ge=1, le=20),
):
    return await service.search(session, user, q.strip() or q, limit)
