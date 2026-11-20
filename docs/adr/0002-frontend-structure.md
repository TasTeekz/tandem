# ADR 0002: Frontend structure

Status: accepted

## Decision
`client/src` uses Feature-Sliced Design. Layers import only downward: `app > pages > widgets > features > entities > shared`.

```
client/src/
  app/       providers (router, query, i18n, auth), route guards, styles/tokens
  pages/     login, register, groups (browse), group (tabs: chat, materials, goals, members),
             my-groups, profile, notifications, search, admin, not-found
  widgets/   header (nav, search box, locale switcher, bell), group-chat, materials-panel,
             goals-board, progress-board, members-list, admin-table
  features/  auth-login, auth-register, group-create, group-join-leave, message-send,
             material-upload, goal-edit, progress-set, notification-read, search-query,
             locale-switch, profile-edit, admin-crud
  entities/  user, group, member, message, material, goal, notification
             (each: api/ hooks, model/ types, ui/ cards)
  shared/    api (fetch client, generated types from openapi.json, error mapping),
             ui (own kit), i18n (en/ru/kk json), lib (hooks, format), config, assets (logo)
```
Slice layout: `ui/`, `model/`, `api/`, `lib/`, `index.ts`.

Public API rule: a slice is imported only through its `index.ts`. No deep imports into another slice, no imports between slices of the same layer. `npm run lint:fsd` enforces it.

## Why
Slices map to API sections, parallelise work, and keep the UI kit and API client in one place.

## Consequences
- Server state through TanStack Query hooks in `entities/*/api` and `features/*/model`; chat polls with `after`.
- Auth and admin guards live in `app`.
- All strings use i18n keys from `shared/i18n`; API types are generated, never hand-written.
- Cross-entity composition happens in widgets or pages, not in entities.

## Token storage tradeoff
Access and refresh JWTs live in `localStorage` so a session survives reloads without a server-side cookie flow; any XSS could read them.
Mitigations: React escapes output, no `dangerouslySetInnerHTML`, short access TTL (30 min), post-login redirects restricted to same-origin paths.
Moving to httpOnly cookies would need backend changes (cookie auth plus CSRF protection), so it is deferred.
