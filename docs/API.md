# Tandem API contract

Base path `/api/v1`; plus `GET /health` (public, `{"status":"ok"}`). Schema names are Pydantic classes and become OpenAPI components; client types are generated from `server/openapi.json`.

## Conventions
- JSON, UTF-8, ids are UUID strings, timestamps ISO-8601 UTC. Auth: `Authorization: Bearer <access JWT>`.
- Auth levels: `public` (none), `user` (any active logged-in user), `member` (user who is a member of the group), `mentor` (mentor of that group), `admin` (`users.role=admin`). Admin passes every `member`/`mentor` check.
- List envelope: `{"items":[...],"total":N}`. Pagination query params: `limit` (1-100, default 20), `offset` (>=0, default 0). Lists that are not paginated say so.
- Error envelope (all non-2xx, incl. validation): `{"error":{"code":"<stable_code>","message":"<human text>"}}`. Validation errors may add `"details":[{"field","message"}]` inside `error`.
- Locale values: `en|ru|kk`. Role values: `student|admin`; membership role: `mentor|member`.
- Visibility: private groups are visible (card, members, messages, materials, goals) only to members and admins. Public groups: anyone (incl. guests) may read the group card (`GET /groups`, `GET /groups/{id}`); members list, messages, materials and goals need membership.

## Error codes (stable)
| code | HTTP | meaning |
|---|---|---|
| validation_error | 422 | body/query invalid |
| invalid_credentials | 401 | wrong email/password |
| not_authenticated | 401 | missing/invalid/expired access token |
| invalid_refresh_token | 401 | refresh token invalid/expired/revoked (password change or admin deactivation bumps `users.token_version`, revoking all earlier access/refresh tokens) |
| account_disabled | 403 | `is_active=false` |
| forbidden | 403 | role/membership insufficient |
| not_found | 404 | resource missing or not visible to caller |
| email_taken | 409 | register/admin create with existing email |
| already_member | 409 | join when already a member |
| not_member | 409 | leave when not a member |
| last_mentor | 409 | sole mentor cannot leave, be removed or be demoted |
| file_too_large | 413 | upload > 10 MB (10 485 760 bytes) |
| unsupported_media | 415 | not multipart / empty file |
| internal_error | 500 | unexpected |

## Auth
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /auth/register | public | RegisterIn {email, password(8-128), full_name(1-100), locale?=en} | 201 AuthOut {user: UserOut, access_token, refresh_token, token_type:"bearer"} | email_taken, validation_error |
| POST | /auth/login | public | LoginIn {email, password} | AuthOut | invalid_credentials, account_disabled |
| POST | /auth/refresh | public | RefreshIn {refresh_token} | TokenOut {access_token, refresh_token, token_type} (stateless JWT; returns a new pair) | invalid_refresh_token, account_disabled |
| GET | /auth/me | user | - | UserOut | not_authenticated |

UserOut {id, email, full_name, role, locale, is_active, created_at}. Access TTL 30 min, refresh 14 days.

## Profile
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /profile | user | - | UserOut | not_authenticated |
| PATCH | /profile | user | ProfileUpdate {full_name?, locale?, password?(8-128)} | UserOut | validation_error |

PublicUserOut {id, full_name} is used wherever other users are shown (search, members).

## Groups
GroupOut {id, owner_id, title, description, subject, is_public, created_at, members_count, my_role: "mentor"|"member"|null}.
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /groups | public | query: q?, subject?, limit, offset (only `is_public=true`) | List[GroupOut] | validation_error |
| GET | /groups/mine | user | limit, offset | List[GroupOut] (my memberships) | not_authenticated |
| POST | /groups | user | GroupCreate {title(1-120), description?, subject?, is_public?=true} | 201 GroupOut (creator becomes mentor) | validation_error |
| GET | /groups/{id} | public (public group) / member (private) | - | GroupOut | not_found |
| PATCH | /groups/{id} | mentor | GroupUpdate {title?, description?, subject?, is_public?} | GroupOut | forbidden, not_found |
| DELETE | /groups/{id} | owner / admin | - | 204 | forbidden, not_found |
| POST | /groups/{id}/join | user | - | 201 MemberOut (role member; private group: not_found) | already_member, not_found |
| POST | /groups/{id}/leave | member | - | 204 | not_member, last_mentor |
| GET | /groups/{id}/members | member | limit, offset | List[MemberOut {user_id, full_name, role, joined_at}] | forbidden, not_found |
| PATCH | /groups/{id}/members/{user_id} | mentor | MemberRoleUpdate {role} | MemberOut | forbidden, last_mentor, not_found |
| DELETE | /groups/{id}/members/{user_id} | mentor | - | 204 | forbidden, last_mentor, not_found |

## Messages (polling chat)
MessageOut {id, group_id, author_id, author_name, body, created_at}.
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /groups/{id}/messages | member | query: `after` (message id; strictly newer, ascending), `before` (message id; older, for history), `limit` (1-100, default 50). Neither: latest `limit`, ascending. | List[MessageOut]; `total` = number of items returned | forbidden, not_found |
| POST | /groups/{id}/messages | member | MessageCreate {body(1-4000)} | 201 MessageOut | forbidden, validation_error |

Client polls every 3 s with `after=<last id>`. Ordering is by `(created_at, id)`.

## Materials
MaterialOut {id, group_id, uploader_id, uploader_name, title, file_name, mime_type, size_bytes, created_at} (never includes content).
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /groups/{id}/materials | member | limit, offset | List[MaterialOut] | forbidden, not_found |
| POST | /groups/{id}/materials | member | multipart/form-data: `file` (<=10 MB), `title?` (default: file name) | 201 MaterialOut | file_too_large, unsupported_media, forbidden |
| GET | /materials/{id}/download | member | - | file bytes, `Content-Type`=mime_type, `Content-Disposition: attachment` with RFC 5987 `filename*` | forbidden, not_found |
| DELETE | /materials/{id} | uploader / mentor of group / admin | - | 204 | forbidden, not_found |

## Goals and progress
GoalOut {id, group_id, created_by, title, description, due_date, created_at, my_percent}.
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /groups/{id}/goals | member | limit, offset | List[GoalOut] | forbidden |
| POST | /groups/{id}/goals | mentor | GoalCreate {title(1-120), description?, due_date?} | 201 GoalOut | forbidden, validation_error |
| GET | /goals/{id} | member | - | GoalOut | not_found |
| PATCH | /goals/{id} | mentor | GoalUpdate {title?, description?, due_date?} | GoalOut | forbidden, not_found |
| DELETE | /goals/{id} | mentor | - | 204 (cascades progress) | forbidden, not_found |
| PUT | /goals/{id}/progress | member | ProgressSet {percent 0-100} (upsert for caller) | ProgressOut {goal_id, user_id, percent, updated_at} | forbidden, validation_error |
| GET | /groups/{id}/progress | member | - (not paginated) | ProgressBoardOut {goals:[{goal_id,title,due_date}], members:[{user_id,full_name,overall_percent,per_goal:[{goal_id,percent}]}]}; missing progress = 0; overall = mean over goals (0 if no goals) | forbidden |

## Notifications
NotificationOut {id, type, title, body, group_id|null, is_read, created_at}. `type`: `new_message|new_material|new_goal|progress_milestone`.
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /notifications | user | limit, offset, `unread_only?` | List[NotificationOut] (newest first) | not_authenticated |
| GET | /notifications/unread-count | user | - | {count} | not_authenticated |
| POST | /notifications/{id}/read | user | - | NotificationOut | not_found |
| POST | /notifications/read-all | user | - | {updated} | not_authenticated |

Triggers (created server-side, never for the actor): new_message -> other members (coalesced: skipped if the recipient already has an unread new_message for that group); new_material -> other members; new_goal -> other members; progress_milestone -> the group's mentors when a member's percent on a goal first reaches 50 or 100.

## Search
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | /search | user | `q` (1-100), `limit?` per section (1-20, default 5) | SearchOut {groups:[GroupOut], materials:[MaterialOut], users:[PublicUserOut]} | validation_error |

Case-insensitive substring match. groups: title/description/subject of public groups plus the caller's private groups. materials: title/file_name in groups the caller is a member of. users: full_name of active users. Admin sees all groups and materials.

## Admin (all `admin`)
| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | /admin/stats | - | StatsOut {users, groups, materials, messages, goals, active_users} | forbidden |
| GET | /admin/users | limit, offset, q? | List[UserOut] | forbidden |
| POST | /admin/users | AdminUserCreate {email, password, full_name, role?, locale?, is_active?} | 201 UserOut | email_taken |
| GET | /admin/users/{id} | - | UserOut | not_found |
| PATCH | /admin/users/{id} | AdminUserUpdate {email?, full_name?, role?, locale?, is_active?, password?} | UserOut | email_taken, forbidden (cannot demote/deactivate self) |
| DELETE | /admin/users/{id} | - | 204 | forbidden (self), not_found |
| GET | /admin/groups | limit, offset, q? | List[GroupOut] (all) | forbidden |
| POST | /admin/groups | AdminGroupCreate {owner_id, title, description?, subject?, is_public?} | 201 GroupOut | not_found |
| PATCH | /admin/groups/{id} | GroupUpdate + owner_id? | GroupOut | not_found |
| DELETE | /admin/groups/{id} | - | 204 | not_found |
| GET | /admin/materials | limit, offset, q? | List[MaterialOut] (all) | forbidden |
| PATCH | /admin/materials/{id} | {title?} | MaterialOut | not_found |
| DELETE | /admin/materials/{id} | - | 204 | not_found |

Admin creates materials through the normal upload endpoint (admin passes membership checks). Deleting a user cascades their memberships, messages, progress and notifications; groups they own are deleted too.
