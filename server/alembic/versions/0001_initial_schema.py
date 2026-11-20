"""initial schema

Revision ID: 0001
Revises: 
Create Date: 2026-11-20 12:19:06.302067
"""
from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


TRGM_INDEXES = [('ix_users_full_name_trgm', 'users', 'full_name'), ('ix_groups_description_trgm', 'groups', 'description'), ('ix_groups_subject_trgm', 'groups', 'subject'), ('ix_groups_title_trgm', 'groups', 'title'), ('ix_materials_file_name_trgm', 'materials', 'file_name'), ('ix_materials_title_trgm', 'materials', 'title')]


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=100), nullable=False),
    sa.Column('full_name', sa.String(length=100), nullable=False),
    sa.Column('role', sa.String(length=16), nullable=False),
    sa.Column('locale', sa.String(length=4), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("locale in ('en','ru','kk')", name=op.f('ck_users_locale')),
    sa.CheckConstraint("role in ('student','admin')", name=op.f('ck_users_role')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    sa.UniqueConstraint('email', name=op.f('uq_users_email'))
    )
    op.create_table('groups',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('owner_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('subject', sa.String(length=80), nullable=True),
    sa.Column('is_public', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name=op.f('fk_groups_owner_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_groups'))
    )
    op.create_table('goals',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('created_by', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_goals_created_by_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_goals_group_id_groups'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_goals'))
    )
    op.create_index('ix_goals_group_id', 'goals', ['group_id'], unique=False)
    op.create_table('materials',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('uploader_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('file_name', sa.String(length=255), nullable=False),
    sa.Column('mime_type', sa.String(length=127), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('content', sa.LargeBinary(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_materials_group_id_groups'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], name=op.f('fk_materials_uploader_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_materials'))
    )
    op.create_index('ix_materials_group_id', 'materials', ['group_id'], unique=False)
    op.create_table('memberships',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('role', sa.String(length=16), nullable=False),
    sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("role in ('mentor','member')", name=op.f('ck_memberships_role')),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_memberships_group_id_groups'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_memberships_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_memberships')),
    sa.UniqueConstraint('group_id', 'user_id', name=op.f('uq_memberships_group_id'))
    )
    op.create_index('ix_memberships_user_id', 'memberships', ['user_id'], unique=False)
    op.create_table('messages',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('author_id', sa.Uuid(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_messages_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_messages_group_id_groups'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_messages'))
    )
    op.create_index('ix_messages_group_created', 'messages', ['group_id', 'created_at', 'id'], unique=False)
    op.create_table('notifications',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=True),
    sa.Column('type', sa.String(length=32), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("type in ('new_message','new_material','new_goal','progress_milestone')", name=op.f('ck_notifications_type')),
    sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_notifications_group_id_groups'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_notifications_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_notifications'))
    )
    op.create_index('ix_notifications_user_read_created', 'notifications', ['user_id', 'is_read', 'created_at'], unique=False)
    op.create_table('goal_progress',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('goal_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('percent', sa.Integer(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('percent between 0 and 100', name=op.f('ck_goal_progress_percent')),
    sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], name=op.f('fk_goal_progress_goal_id_goals'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_goal_progress_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_goal_progress')),
    sa.UniqueConstraint('goal_id', 'user_id', name=op.f('uq_goal_progress_goal_id'))
    )

    # pg_trgm is a contrib module: a Postgres without it still works (ILIKE does a seq scan).
    has_trgm = op.get_bind().scalar(
        sa.text("select exists(select 1 from pg_available_extensions where name = 'pg_trgm')")
    )
    if has_trgm:
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        for name, table, column in TRGM_INDEXES:
            op.create_index(
                name, table, [column], postgresql_using='gin', postgresql_ops={column: 'gin_trgm_ops'}
            )


def downgrade() -> None:
    op.drop_table('goal_progress')
    op.drop_index('ix_notifications_user_read_created', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('ix_messages_group_created', table_name='messages')
    op.drop_table('messages')
    op.drop_index('ix_memberships_user_id', table_name='memberships')
    op.drop_table('memberships')
    op.drop_index('ix_materials_group_id', table_name='materials')
    op.drop_table('materials')
    op.drop_index('ix_goals_group_id', table_name='goals')
    op.drop_table('goals')
    op.drop_table('groups')
    op.drop_table('users')
