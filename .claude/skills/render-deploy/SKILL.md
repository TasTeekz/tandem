---
name: render-deploy
description: Deploying Tandem to Render with one root render.yaml Blueprint (FastAPI web service + static React site). Use when touching render.yaml, build/start commands, env vars or health checks.
---

# Render Blueprint rules

- One `render.yaml` in the repo root with two services:
  - `type: web`, `runtime: python`, `rootDir: server`, build `pip install uv && uv sync --frozen --no-dev` (or `pip install -r requirements.txt`), start `uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`, `healthCheckPath: /health`, `PYTHON_VERSION: 3.12.x`.
  - `type: web`, `runtime: static`, `rootDir: client`, build `npm ci && npm run build`, `staticPublishPath: dist`, SPA rewrite `/* → /index.html`, `VITE_API_URL` set from the API service URL.
- Secrets: `POSTGRES_URL`, `JWT_SECRET`, `ADMIN_PASSWORD` are `sync: false` (user fills them in the dashboard); `JWT_SECRET` may use `generateValue: true`. Never put real values in the repo.
- `CORS_ORIGINS` points to the static site URL; the client calls the API by `VITE_API_URL`.
- Render ephemeral disk: no local file storage — uploads live in Postgres.
- Run migrations on every deploy before the server starts (or `preDeployCommand` on paid plans). Validate the file with `render blueprints validate` if the CLI is available, otherwise check against the Blueprint spec.
