# ADR 0001: Backend structure

Status: accepted

## Decision
`server/` is a layered, feature-first FastAPI app, fully async.

```
server/
  app/
    main.py            # create_app(), router mounting, exception handlers, /health
    export_openapi.py  # writes server/openapi.json
    core/              # config.py (env), security.py (JWT, hashing), errors.py (AppError + codes),
                       # deps.py (current_user, require_admin, group role checks), pagination.py
    db/                # base.py (DeclarativeBase), session.py (async engine, get_session)
    features/
      auth/ profile/ groups/ messages/ materials/ goals/ notifications/ search/ admin/
        router.py      # HTTP only: parse, call service, return schema
        schemas.py     # Pydantic v2 in/out models (names match docs/API.md)
        service.py     # business rules, permissions, notification triggers
        repository.py  # SQLAlchemy queries only
        models.py      # ORM tables (absent for search/admin, which own no tables)
  alembic/             # env.py (async), versions/
  tests/               # pytest + httpx AsyncClient, one file per feature
  openapi.json  pyproject.toml  alembic.ini
```
Rules: router -> service -> repository -> models. A feature uses another feature only through its `service`. Errors are raised as `AppError(code, status, message)` and rendered into the envelope by one handler. One session per request; the service commits.

## Why
Modules map one to one to the API sections, so agents work in parallel without conflicts. Thin routers keep rules testable.

## Consequences
- search and admin orchestrate other features' services; they own no tables.
- Every schema change needs an Alembic revision; `python -m app.export_openapi` must leave no diff.
- Some boilerplate for tiny modules, accepted for uniformity.
