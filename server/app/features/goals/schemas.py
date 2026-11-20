import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class GoalCreate(BaseModel):
    title: Title
    description: str | None = None
    due_date: date | None = None


class GoalUpdate(BaseModel):
    title: Title | None = None
    description: str | None = None
    due_date: date | None = None


class GoalOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    created_by: uuid.UUID
    title: str
    description: str | None
    due_date: date | None
    created_at: datetime
    my_percent: int


class ProgressSet(BaseModel):
    percent: int = Field(ge=0, le=100)


class ProgressOut(BaseModel):
    goal_id: uuid.UUID
    user_id: uuid.UUID
    percent: int
    updated_at: datetime


class BoardGoal(BaseModel):
    goal_id: uuid.UUID
    title: str
    due_date: date | None


class BoardGoalPercent(BaseModel):
    goal_id: uuid.UUID
    percent: int


class BoardMember(BaseModel):
    user_id: uuid.UUID
    full_name: str
    overall_percent: int
    per_goal: list[BoardGoalPercent]


class ProgressBoardOut(BaseModel):
    goals: list[BoardGoal]
    members: list[BoardMember]
