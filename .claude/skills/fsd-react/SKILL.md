---
name: fsd-react
description: Feature-Sliced Design rules for the Tandem React client in client/ plus the architecture check (steiger + import boundaries). Use when creating, moving or reviewing anything under client/src.
---

# FSD for client/

Layers (top may import only from below, never sideways inside a layer, never upward):
`app → pages → widgets → features → entities → shared`

```
client/src/
  app/        providers, router, i18n init, global styles entry
  pages/      one slice per route (login, groups, group-detail, search, profile, notifications, admin, ...)
  widgets/    composed blocks (header, sidebar, group-chat, goal-board, admin-table)
  features/   user actions (auth-login, group-join, material-upload, progress-update, language-switch)
  entities/   business objects (user, group, material, message, goal, notification): model, api, ui
  shared/     ui (own UI kit), api (generated client + fetch wrapper), lib, config, i18n, assets
```
- Each slice exposes a **public API** in `index.ts`; import only from it (`@/entities/group`, never `@/entities/group/ui/Card`).
- Segments inside a slice: `ui`, `model`, `api`, `lib`, `config`.
- Path alias `@/` → `src/`.
- **Constant check:** `npm run lint:fsd` runs `steiger` (official FSD linter) and `eslint-plugin-boundaries`/import restrictions. It runs in `.githooks/pre-commit` and in CI. A red check blocks the commit — fix the structure, do not disable rules.
- API types come from `server/openapi.json` via `openapi-typescript`; no hand-written duplicates of backend types.
- Server state: TanStack Query. Local UI state: React state/Zustand only when shared across a slice.
- i18n keys live in `shared/i18n/locales/{en,ru,kk}.json`; no hard-coded user-facing strings.
