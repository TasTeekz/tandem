# Tandem live demo script (180-minute exam)

Slides: `docs/Tandem-presentation.pptx`. Screenshots below were taken from the running app with demo data (the shared dev database also holds a few QA rows, so your own seed will look cleaner).

Time plan: 20 min setup, 15 min slides, 70 min demo walk-through, 15 min buffer, 60 min questions. Adjust freely; the exam is long, so no step needs to be rushed.

## 0. Setup from scratch (20 min)

Prerequisites: Python 3.12+, [uv](https://docs.astral.sh/uv/), Node 20+, a PostgreSQL database you can reach.

```bash
# 0. Database: create an empty database named tandem
createdb tandem

# 1. Environment: copy the template once, then edit the values
cp .env.example .env
#   POSTGRES_URL=postgresql+asyncpg://USER:PASSWORD@localhost:5432/tandem   (asyncpg driver is required)
#   JWT_SECRET=<random string, 32+ characters>
#   CORS_ORIGINS=http://localhost:5173
#   ADMIN_EMAIL / ADMIN_PASSWORD = the admin account you want (created on first server start)

# 2. Server
cd server
uv sync
uv run alembic upgrade head          # creates all 9 tables
uv run python -m app.seed_demo       # demo users, groups, messages, materials, goals (idempotent)
uv run uvicorn app.main:app --port 8000
#   http://localhost:8000/docs  (Swagger),  http://localhost:8000/health -> {"status":"ok"}

# 3. Client (second terminal)
cd client
cp .env.example .env                 # VITE_API_URL=http://localhost:8000
npm ci
npm run dev                          # http://localhost:5173
```

If the variables are not in a `.env` file, export `POSTGRES_URL`, `JWT_SECRET`, `CORS_ORIGINS` in the shell before starting uvicorn.

Logins (all demo users share the password `demo12345`):

| Who | Email | Locale | Role in the demo |
|---|---|---|---|
| Alex Johnson | alex@tandem.app | en | member of Calculus Crew, mentor of IELTS Squad |
| Aigerim Nurlanova | aigerim@tandem.app | kk | mentor of Calculus Crew |
| Ержан Касымов | yerzhan@tandem.app | kk | owner of the Kazakh algorithms group |
| Дмитрий Соколов | dmitry@tandem.app | ru | owner of the Russian databases group |
| Айдана Сатпаева, Мария Иванова | aidana@tandem.app, maria@tandem.app | kk, ru | members |
| **Admin** | the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your own `.env` | - | platform admin |

Open two browser profiles (or one normal and one private window): one for Alex, one for Aigerim, so chat and notifications can be shown live.

## 1. Opening and slides (15 min)

Present the deck in order: topic, aim, objectives, competitive analysis, SWOT, use cases, ER, architecture, feature map. Say that the demo follows the feature map.

![Landing page](screenshots/01-landing.png)

## 2. Functionality demo (more than 5 functionalities, 10 pts)

### Step 1. Registration and login (5 min)
1. On the landing page open Create account. Register a new student (name, email, password of 8+ characters).
   ![Register](screenshots/03-register.png)
2. Expected: you land logged in on the groups page. Log out from the avatar menu, then sign in at Sign in with `alex@tandem.app` / `demo12345`.
   ![Login](screenshots/02-login.png)
3. Show a wrong password: an error message appears, no crash. Show that a 7-character password is rejected on register.

### Step 2. Groups, roles (8 min)
1. Groups page shows My groups and Discover open groups.
   ![Groups](screenshots/04-groups.png)
2. Create a group (New group): title, subject, public. Expected: it appears under My groups, you are its mentor.
3. As the other user, find it under Discover and press Join. Expected: it moves to My groups with role Member.

### Step 3. Group chat (7 min)
1. Open Calculus Crew, tab Chat. Send a message as Alex.
2. In the second window (Aigerim) the message appears within about 3 seconds (client polling).
   ![Chat](screenshots/05-group-chat.png)

### Step 4. Materials (7 min)
1. Tab Materials: drop a small file (under 10 MB). Expected: it is listed with size and uploader; download returns the same bytes.
2. Try a file over 10 MB: expected an error (`file_too_large`, HTTP 413).
   ![Materials](screenshots/06-group-materials.png)

### Step 5. Goals and progress (8 min)
1. As mentor (Aigerim) open Goals and progress, create a goal with a due date.
2. As Alex, move the progress slider of that goal to 60 percent. Expected: Alex's ring in Team progress updates; Aigerim gets a notification at 50 and 100 percent.
   ![Goals](screenshots/07-group-goals.png)

### Step 6. Members and roles (4 min)
Tab Members: a mentor can change roles and remove members; a plain member cannot. Leaving as the only mentor is rejected (`last_mentor`).
![Members](screenshots/08-group-members.png)

### Step 7. Notifications (4 min)
The bell shows an unread badge after chat, material and goal events from another user. Open it, click an item (goes to the group), press Mark all as read; the badge disappears.
![Notifications](screenshots/10-notifications.png)

### Step 8. Profile (3 min)
Change the full name and the language, save. Expected: the header and all texts update; after a reload the language is kept (stored in the profile).
![Profile](screenshots/11-profile.png)

## 3. Multilanguage (5 pts, 5 min)

1. Header globe icon: choose RU. Expected: navigation, buttons, group tabs, empty states and form labels are Russian.
   ![Russian](screenshots/12-lang-ru.png)
2. Choose KK: everything is Kazakh. Then EN again.
   ![Kazakh](screenshots/13-lang-kk.png)
3. Point out: user content (group titles, messages) is not translated, only the interface; dates follow the locale; the choice survives reload and is saved to the profile when logged in.
4. Bonus: dark theme toggle (moon icon).
   ![Dark](screenshots/14-dark-theme.png)

## 4. Search (5 pts, 5 min)

1. Open Search, type `al`. Expected: three sections, Groups (Calculus Crew), Materials (a matching file), People (matching users), each with a count.
   ![Search](screenshots/09-search.png)
2. Show case-insensitivity (`AL`), a query with no hits (empty state), and that a private group of someone else never appears (results are limited to what the caller may see).

## 5. Admin panel (5 pts, 10 min)

1. Log out, log in with the admin account. The header now shows Admin. The dashboard has six counters and tabs Users, Groups, Materials.
   ![Admin dashboard](screenshots/15-admin-dashboard.png)
2. Users: search, New user, Edit (name, email, role, language, active, optional password), Delete.
   ![Edit modal](screenshots/18-admin-edit-modal.png)
3. Groups and Materials tabs: same table pattern with create, edit, delete.
   ![Admin groups](screenshots/16-admin-groups.png)
   ![Admin materials](screenshots/17-admin-materials.png)
4. Role guard: sign in as `alex@tandem.app` and open `/admin`. Expected: the No access page, and no Admin link in the header.
   ![Forbidden](screenshots/19-forbidden.png)
5. Server-side guard: in Swagger or curl, call `GET /api/v1/admin/stats` with Alex's token; expected 403 `forbidden`.
6. Safety rule: as admin, try to deactivate or delete your own account; expected rejection.

## 6. Responsive view (2 min)
Resize the window to phone width: the layout stacks and the header stays usable.
![Mobile](screenshots/20-mobile.png)

## 7. Likely examiner questions

1. **Why FastAPI and async?** I/O bound app (DB, file bytes); async SQLAlchemy with asyncpg keeps one process serving many waiting requests; Pydantic gives validation and OpenAPI for free.
2. **Why PostgreSQL, and why files inside it?** Relational data with real constraints. Files are capped at 10 MB, so `bytea` keeps one backup, one transaction and a simple deploy; for larger files I would move to object storage.
3. **How is the ER model normalised?** Memberships resolve users-groups many-to-many; goal_progress resolves goals-users. No repeating groups, every non-key column depends on its table key (3NF). Unique constraints on (group_id, user_id) and (goal_id, user_id).
4. **How does authentication work?** Password hashed with bcrypt; login returns a short-lived access JWT (30 min) and a refresh JWT (14 days); the client refreshes automatically. A `token_version` on the user revokes all tokens after a password change or deactivation.
5. **How are roles enforced?** Two levels: `users.role` (student or admin) and `memberships.role` (mentor or member). Server dependencies check them on every endpoint; the client route guard is only a convenience.
6. **What stops SQL injection and XSS?** SQLAlchemy parameterised queries; React escapes output; Pydantic validates all input; search uses bound parameters.
7. **Why polling instead of WebSockets?** Simpler, stateless, works on a free Render instance. Cost is up to 3 s delay; listed as a weakness in the SWOT, and WebSockets or SSE are the next step.
8. **How does search work?** Case-insensitive substring match over groups, materials and users, with pg_trgm indexes when the extension exists; results are filtered by visibility so private data never leaks.
9. **Why React with Feature-Sliced Design and no UI library?** FSD gives one-way imports (app, pages, widgets, features, entities, shared) checked by a linter; a small own UI kit keeps the bundle light and the brand consistent.
10. **How do you keep client and server in sync?** The server exports `openapi.json`; the client types are generated from it, so a contract change breaks the type check instead of production.
11. **How is multilanguage done?** react-i18next with en, ru, kk dictionaries; a test checks that all three have the same keys; locale is saved in localStorage and in the user profile.
12. **How would it scale?** Stateless API behind a load balancer, read replicas, object storage for files, a message broker for notifications and sockets.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Server exits with a validation error about `JWT_SECRET` | The secret must be at least 32 characters. |
| `alembic upgrade head` cannot connect | Check `POSTGRES_URL` uses `postgresql+asyncpg://`, the database exists and Postgres is running. |
| Browser shows CORS errors or the app cannot load data | `CORS_ORIGINS` must equal the client origin exactly (`http://localhost:5173`); restart uvicorn after changing it. |
| Client calls the wrong host | Set `VITE_API_URL` in `client/.env` and restart `npm run dev`. |
| Admin login fails | The admin is created on first server start from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; set both in `.env` and restart the server. |
| Seed says nothing happened | It is idempotent and skips when `aigerim@tandem.app` exists; drop and recreate the database for a clean start. |
| Port already in use | Stop the old process or run uvicorn with `--port 8001` and update `VITE_API_URL` and `CORS_ORIGINS`. |
| Chat message does not appear in the other window | Wait 3 s; confirm both users are members of the same group. |
| Upload fails | File larger than 10 MB, or the request was not multipart. |
| Need a blank slate | `uv run alembic downgrade base && uv run alembic upgrade head && uv run python -m app.seed_demo`. |
