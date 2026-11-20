# Tandem server

FastAPI + async SQLAlchemy/asyncpg + Alembic. Contract: `../docs/API.md`, layout: `../docs/adr/0001-backend-structure.md`.

```bash
uv sync                                   # Python 3.12 venv + deps
export POSTGRES_URL=postgresql+asyncpg://user:pass@localhost:5432/tandem JWT_SECRET=change-me
uv run alembic upgrade head               # migrations (pg_trgm indexes when the extension exists)
uv run python -m app.seed_demo            # optional, idempotent demo data (password demo12345)
uv run uvicorn app.main:app --reload      # http://localhost:8000/docs
```

Other variables: see `../.env.example` (`ADMIN_EMAIL`/`ADMIN_PASSWORD` seed an admin on startup).

```bash
export TEST_POSTGRES_URL=postgresql+asyncpg://user:pass@localhost:5432/tandem_test   # reset on every run
uv run ruff check . && uv run ruff format --check . && uv run pytest
uv run python -m app.export_openapi       # rewrites openapi.json
```
