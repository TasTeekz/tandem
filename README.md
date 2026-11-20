# Tandem

Tandem is a web platform where students form study groups, share materials, chat,
set shared goals and track each member's progress. UI in English, Russian and Kazakh.

## Layout

- `server/` FastAPI + SQLAlchemy + Alembic, Postgres, managed with uv
- `client/` React + Vite (Feature-Sliced Design)
- `docs/` project spec (`PROJECT.md`) and exam notes
- `render.yaml` Render Blueprint for both services

## Run locally

Copy `.env.example` to `.env` and fill it in. `POSTGRES_URL` must use the async
driver: `postgresql+asyncpg://user:pass@localhost:5432/tandem`.

Server (Python 3.12, [uv](https://docs.astral.sh/uv/)):

```
cd server
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Client (Node 20+):

```
cd client
npm ci
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` for the client and keep
`CORS_ORIGINS=http://localhost:5173` for the server.

## Deploy on Render

1. Create a Postgres database on Render (or any host) and copy its URL, changing the
   scheme to `postgresql+asyncpg://`.
2. In the Render dashboard choose **New > Blueprint**, select this repo, and fill in
   the prompted secrets: `POSTGRES_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`,
   `VITE_API_URL`. `JWT_SECRET` is generated automatically.
3. After the first deploy, note both public URLs, then set:
   - `CORS_ORIGINS` on `tandem-api` to the site URL, e.g. `https://tandem-web.onrender.com`
   - `VITE_API_URL` on `tandem-web` to the API URL, e.g. `https://tandem-api.onrender.com`
     (include `https://`, no trailing slash), then redeploy the site because Vite
     inlines it at build time.
4. Migrations run on each API start; the admin user is seeded on first start.

Free instances sleep after inactivity, so the first request can take about a minute.
