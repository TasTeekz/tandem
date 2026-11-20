import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Ts


def _trgm(table: str, *cols: str) -> list[Index]:
    return [
        Index(
            f"ix_{table}_{c}_trgm",
            c,
            postgresql_using="gin",
            postgresql_ops={c: "gin_trgm_ops"},
        )
        for c in cols
    ]


class Group(Base):
    __tablename__ = "groups"
    __table_args__ = (*_trgm("groups", "title", "description", "subject"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    subject: Mapped[str | None] = mapped_column(String(80))
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Ts]


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint("group_id", "user_id"),
        CheckConstraint("role in ('mentor','member')", name="role"),
        Index("ix_memberships_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16), default="member")
    joined_at: Mapped[Ts]
