import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.goals.models import Goal, GoalProgress


def _with_my_percent(uid: uuid.UUID):
    pct = (
        select(func.coalesce(func.max(GoalProgress.percent), 0))
        .where(GoalProgress.goal_id == Goal.id, GoalProgress.user_id == uid)
        .correlate(Goal)
        .scalar_subquery()
    )
    return select(Goal, pct.label("my_percent"))


async def get_row(session: AsyncSession, uid: uuid.UUID, goal_id: uuid.UUID):
    return (await session.execute(_with_my_percent(uid).where(Goal.id == goal_id))).first()


async def list_rows(
    session: AsyncSession, uid: uuid.UUID, group_id: uuid.UUID, limit: int, offset: int
):
    total = await session.scalar(select(func.count()).where(Goal.group_id == group_id))
    stmt = (
        _with_my_percent(uid)
        .where(Goal.group_id == group_id)
        .order_by(Goal.due_date.asc().nulls_last(), Goal.created_at, Goal.id)
        .limit(limit)
        .offset(offset)
    )
    return (await session.execute(stmt)).all(), total or 0


async def all_goals(session: AsyncSession, group_id: uuid.UUID) -> list[Goal]:
    rows = await session.scalars(
        select(Goal)
        .where(Goal.group_id == group_id)
        .order_by(Goal.due_date.asc().nulls_last(), Goal.created_at, Goal.id)
    )
    return list(rows)


async def get_goal(session: AsyncSession, goal_id: uuid.UUID) -> Goal | None:
    return await session.get(Goal, goal_id)


async def get_progress(
    session: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID
) -> GoalProgress | None:
    return await session.scalar(
        select(GoalProgress).where(GoalProgress.goal_id == goal_id, GoalProgress.user_id == user_id)
    )


async def group_progress(session: AsyncSession, group_id: uuid.UUID) -> list[GoalProgress]:
    rows = await session.scalars(
        select(GoalProgress)
        .join(Goal, Goal.id == GoalProgress.goal_id)
        .where(Goal.group_id == group_id)
    )
    return list(rows)


async def count_all(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Goal)) or 0
