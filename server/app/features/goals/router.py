import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser, PageParams, SessionDep
from app.core.pagination import Page
from app.features.goals import service
from app.features.goals.schemas import (
    GoalCreate,
    GoalOut,
    GoalUpdate,
    ProgressBoardOut,
    ProgressOut,
    ProgressSet,
)

router = APIRouter(tags=["goals"])


@router.get("/groups/{group_id}/goals", response_model=Page[GoalOut])
async def list_goals(group_id: uuid.UUID, session: SessionDep, user: CurrentUser, page: PageParams):
    items, total = await service.list_goals(session, user, group_id, page.limit, page.offset)
    return Page(items=items, total=total)


@router.post("/groups/{group_id}/goals", response_model=GoalOut, status_code=201)
async def create_goal(
    group_id: uuid.UUID, data: GoalCreate, session: SessionDep, user: CurrentUser
):
    return await service.create_goal(session, user, group_id, data)


@router.get("/groups/{group_id}/progress", response_model=ProgressBoardOut)
async def get_progress_board(group_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    return await service.board(session, user, group_id)


@router.get("/goals/{goal_id}", response_model=GoalOut)
async def get_goal(goal_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    return await service.get_goal(session, user, goal_id)


@router.patch("/goals/{goal_id}", response_model=GoalOut)
async def update_goal(goal_id: uuid.UUID, data: GoalUpdate, session: SessionDep, user: CurrentUser):
    return await service.update_goal(session, user, goal_id, data)


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(goal_id: uuid.UUID, session: SessionDep, user: CurrentUser):
    await service.delete_goal(session, user, goal_id)


@router.put("/goals/{goal_id}/progress", response_model=ProgressOut)
async def set_goal_progress(
    goal_id: uuid.UUID, data: ProgressSet, session: SessionDep, user: CurrentUser
):
    return await service.set_progress(session, user, goal_id, data.percent)
