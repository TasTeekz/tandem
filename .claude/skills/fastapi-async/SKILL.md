---
name: fastapi-async
description: Conventions for the Tandem backend in server/ — fully async FastAPI, SQLAlchemy 2 async, asyncpg, Alembic, Pydantic v2, layered modules, pytest-asyncio. Use when writing or reviewing anything under server/.
---

# FastAPI async backend rules

- **Fully async.** `async def` endpoints, `AsyncSession`, `asyncpg`. No sync DB calls, no `requests`, no blocking file/CPU work in the event loop (hash passwords with `asyncio.to_thread`).
- **Config:** `pydantic-settings` reads `POSTGRES_URL` (+ others in `.env.example`) from the environment/`.env`. Never print or log secrets. If the URL starts with `postgres://` or `postgresql://`, normalise to `postgresql+asyncpg://` (Render gives the former).
- **Layout (feature modules):** `server/app/{core,db,modules/<feature>/{router,schemas,service,repository,models}.py}`. Router → service → repository; routers never touch the session directly except via `Depends`.
- **Contracts first:** Pydantic v2 schemas for every request/response (`model_config = ConfigDict(from_attributes=True)`), explicit `response_model`, `operation_id` = `snake_case` verb_noun (clean generated client names). Export `server/openapi.json` with `python -m app.export_openapi`.
- **Errors:** raise a small `AppError(code, status)`; handler returns `{ "error": { "code": "group_not_found", "message": "..." } }`. Codes are stable strings the client translates.
- **Auth:** JWT access + refresh (PyJWT), `argon2-cffi` or `bcrypt` hashing, dependency `current_user`, `require_admin`, `require_group_role("mentor")`.
- **DB:** UUID PKs, `timestamptz`, indexes on every FK and search column, `pg_trgm` GIN indexes for search (`ILIKE`/`similarity`). Migrations only through Alembic (async env), never `create_all` in prod.
- **Pagination:** `limit`/`offset` with `{items,total}` envelopes.
- **Tests:** `pytest` + `pytest-asyncio` + `httpx.AsyncClient(ASGITransport)`, real Postgres from `TEST_POSTGRES_URL` (never mocked DB), rollback/truncate between tests.
- **Tooling:** `uv` + `pyproject.toml`, Python 3.12, `ruff` (lint+format), `mypy` or `pyright` optional.
