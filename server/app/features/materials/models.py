import uuid

from sqlalchemy import ForeignKey, Index, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Ts


class Material(Base):
    __tablename__ = "materials"
    __table_args__ = (
        Index("ix_materials_group_id", "group_id"),
        Index(
            "ix_materials_title_trgm",
            "title",
            postgresql_using="gin",
            postgresql_ops={"title": "gin_trgm_ops"},
        ),
        Index(
            "ix_materials_file_name_trgm",
            "file_name",
            postgresql_using="gin",
            postgresql_ops={"file_name": "gin_trgm_ops"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"))
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(127))
    size_bytes: Mapped[int]
    content: Mapped[bytes] = mapped_column(LargeBinary, deferred=True)
    created_at: Mapped[Ts]
