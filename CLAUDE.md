# Tandem — project rules

Read `docs/PROJECT.md` and `docs/EXAM.md` first. Layout: `server/` (FastAPI), `client/` (React, FSD), `docs/`, `render.yaml`.

## Secrets
Never read, edit, print or copy `.env` (blocked in `.claude/settings.json`). Document variables in `.env.example`. Dev/test DB URLs are passed through process env (`POSTGRES_URL`, `TEST_POSTGRES_URL`) by the orchestrator.

## Git flow
- `main` is always working. Never commit on it directly except the initial scaffold.
- One branch per task: `feat/<area>-<topic>`, `fix/...`, `chore/...`, `docs/...`, cut from the current `main`.
- Small commits, conventional style (`feat(server): add goals module`). **No co-author trailers, no "Generated with" lines.**
- Finish a branch: checks green → reviewer OK → `git checkout main && git merge --no-ff <branch>` → push `main` and the branch if a remote exists (none configured yet; do not invent one).

## Delegation
Orchestrator order: architect → backend (contracts first) → qa on backend → ui-designer (kit, logo) → frontend → qa/reviewer → devops → presenter. An agent that lacks the Agent tool reports what the next agent must do. Every agent ends with a short handoff report.

## Checks before merge
- server: `ruff check`, `ruff format --check`, `pytest`, `python -m app.export_openapi` leaves no diff.
- client: `npm run lint:fsd`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Contract drift: regenerate client types after any OpenAPI change.
