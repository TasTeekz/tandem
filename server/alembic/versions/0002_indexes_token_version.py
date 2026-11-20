"""fk indexes and users.token_version

Revision ID: 0002
Revises: 0001
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

INDEXES = [
    ("ix_groups_owner_id", "groups", "owner_id"),
    ("ix_goals_created_by", "goals", "created_by"),
    ("ix_materials_uploader_id", "materials", "uploader_id"),
    ("ix_messages_author_id", "messages", "author_id"),
    ("ix_goal_progress_user_id", "goal_progress", "user_id"),
    ("ix_notifications_group_id", "notifications", "group_id"),
]


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))
    for name, table, col in INDEXES:
        op.create_index(name, table, [col])


def downgrade() -> None:
    for name, table, _ in INDEXES:
        op.drop_index(name, table_name=table)
    op.drop_column("users", "token_version")
