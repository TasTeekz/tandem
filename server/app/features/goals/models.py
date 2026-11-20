import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Ts


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (Index("ix_goals_group_id", "group_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"))
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None]
    created_at: Mapped[Ts]


class GoalProgress(Base):
    __tablename__ = "goal_progress"
    __table_args__ = (
        UniqueConstraint("goal_id", "user_id"),
        CheckConstraint("percent between 0 and 100", name="percent"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    percent: Mapped[int]
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
