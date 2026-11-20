import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.core.utils import changes
from app.features.auth.models import User
from app.features.goals import repository as repo
from app.features.goals.models import Goal, GoalProgress
from app.features.goals.schemas import (
    BoardGoal,
    BoardGoalPercent,
    BoardMember,
    GoalCreate,
    GoalOut,
    GoalUpdate,
    ProgressBoardOut,
    ProgressOut,
)
from app.features.groups import service as groups
from app.features.notifications import service as notifications

MILESTONES = (100, 50)  # highest first: a jump 0 -> 100 notifies once, as 100


def _out(row) -> GoalOut:
    g, pct = row
    return GoalOut(
        id=g.id,
        group_id=g.group_id,
        created_by=g.created_by,
        title=g.title,
        description=g.description,
        due_date=g.due_date,
        created_at=g.created_at,
        my_percent=pct,
    )


async def _goal_access(session: AsyncSession, user: User, goal_id: uuid.UUID, mentor: bool = False):
    goal = await repo.get_goal(session, goal_id)
    if goal is None:
        raise not_found("Goal not found")
    if mentor:
        await groups.require_mentor(session, user, goal.group_id)
    else:
        await groups.require_member(session, user, goal.group_id)
    return goal


async def list_goals(session, user: User, group_id, limit, offset):
    await groups.require_member(session, user, group_id)
    rows, total = await repo.list_rows(session, user.id, group_id, limit, offset)
    return [_out(r) for r in rows], total


async def create_goal(
    session: AsyncSession, user: User, group_id: uuid.UUID, data: GoalCreate
) -> GoalOut:
    access = await groups.require_mentor(session, user, group_id)
    goal = Goal(group_id=group_id, created_by=user.id, **data.model_dump())
    session.add(goal)
    await session.flush()
    recipients = await groups.member_ids(session, group_id, exclude=user.id)
    await notifications.notify(
        session, recipients, "new_goal", access.group.title, f"New goal: {goal.title}", group_id
    )
    await session.commit()
    return _out(await repo.get_row(session, user.id, goal.id))


async def get_goal(session: AsyncSession, user: User, goal_id: uuid.UUID) -> GoalOut:
    await _goal_access(session, user, goal_id)
    return _out(await repo.get_row(session, user.id, goal_id))


async def update_goal(
    session: AsyncSession, user: User, goal_id: uuid.UUID, data: GoalUpdate
) -> GoalOut:
    goal = await _goal_access(session, user, goal_id, mentor=True)
    for k, v in changes(data, frozenset({"description", "due_date"})).items():
        setattr(goal, k, v)
    await session.commit()
    return _out(await repo.get_row(session, user.id, goal_id))


async def delete_goal(session: AsyncSession, user: User, goal_id: uuid.UUID) -> None:
    goal = await _goal_access(session, user, goal_id, mentor=True)
    await session.delete(goal)
    await session.commit()


async def set_progress(
    session: AsyncSession, user: User, goal_id: uuid.UUID, percent: int
) -> ProgressOut:
    goal = await _goal_access(session, user, goal_id)
    row = await repo.get_progress(session, goal_id, user.id)
    previous = row.percent if row else 0
    now = datetime.now(UTC)
    if row is None:
        row = GoalProgress(goal_id=goal_id, user_id=user.id, percent=percent, updated_at=now)
        session.add(row)
    else:
        row.percent, row.updated_at = percent, now
    milestone = next((m for m in MILESTONES if previous < m <= percent), None)
    if milestone:
        access = await groups.get_access(session, user, goal.group_id)
        mentors = await groups.member_ids(session, goal.group_id, exclude=user.id, role="mentor")
        await notifications.notify(
            session,
            mentors,
            "progress_milestone",
            access.group.title,
            f"{user.full_name} reached {milestone}% on {goal.title}",
            goal.group_id,
        )
    try:
        await session.commit()
    except IntegrityError:  # concurrent first write for the same (goal, user): last one wins
        await session.rollback()
        row = await repo.get_progress(session, goal_id, user.id)
        row.percent, row.updated_at = percent, now
        await session.commit()
    return ProgressOut(goal_id=goal_id, user_id=user.id, percent=percent, updated_at=now)


async def board(session: AsyncSession, user: User, group_id: uuid.UUID) -> ProgressBoardOut:
    await groups.require_member(session, user, group_id)
    goals = await repo.all_goals(session, group_id)
    members = await groups.all_members(session, group_id)
    values = {
        (p.goal_id, p.user_id): p.percent for p in await repo.group_progress(session, group_id)
    }
    rows = []
    for m in members:
        per_goal = [
            BoardGoalPercent(goal_id=g.id, percent=values.get((g.id, m.user_id), 0)) for g in goals
        ]
        overall = round(sum(p.percent for p in per_goal) / len(per_goal)) if per_goal else 0
        rows.append(
            BoardMember(
                user_id=m.user_id, full_name=m.full_name, overall_percent=overall, per_goal=per_goal
            )
        )
    return ProgressBoardOut(
        goals=[BoardGoal(goal_id=g.id, title=g.title, due_date=g.due_date) for g in goals],
        members=rows,
    )


async def count_goals(session: AsyncSession) -> int:
    return await repo.count_all(session)
