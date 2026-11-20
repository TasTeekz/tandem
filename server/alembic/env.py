import asyncio

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

import app.db.registry  # noqa: F401  (registers all models)
from alembic import context
from app.core.config import get_settings
from app.db.base import Base

target_metadata = Base.metadata


def _configure(**kw) -> None:
    context.configure(target_metadata=target_metadata, compare_type=True, **kw)


def run_migrations_offline() -> None:
    _configure(url=get_settings().postgres_url, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def _run(connection: Connection) -> None:
    _configure(connection=connection)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(get_settings().postgres_url, poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(_run)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
