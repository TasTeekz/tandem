"""Idempotent demo data. Usage: python -m app.seed_demo (all demo users share DEMO_PASSWORD)."""

import asyncio
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import get_engine, get_sessionmaker
from app.features.auth.models import User
from app.features.goals.models import Goal, GoalProgress
from app.features.groups.models import Group, Membership
from app.features.materials.models import Material
from app.features.messages.models import Message
from app.features.notifications.models import Notification

DEMO_PASSWORD = "demo12345"

# key, email, full name, locale
USERS = [
    ("aigerim", "aigerim@tandem.app", "Aigerim Nurlanova", "kk"),
    ("yerzhan", "yerzhan@tandem.app", "Ержан Касымов", "kk"),
    ("dmitry", "dmitry@tandem.app", "Дмитрий Соколов", "ru"),
    ("alex", "alex@tandem.app", "Alex Johnson", "en"),
    ("aidana", "aidana@tandem.app", "Айдана Сатпаева", "kk"),
    ("maria", "maria@tandem.app", "Мария Иванова", "ru"),
]

# key, owner, title, description, subject, public, [(member, role)]
GROUPS = [
    (
        "calc",
        "aigerim",
        "Calculus Crew",
        "Weekly problem-solving sessions for Calculus I and II.",
        "Mathematics",
        True,
        [("alex", "member"), ("dmitry", "member"), ("maria", "member")],
    ),
    (
        "algo",
        "yerzhan",
        "Алгоритмдер мен деректер құрылымдары",
        "Алгоритмдерді бірге талдап, есептер шығарамыз.",
        "Computer Science",
        True,
        [("aigerim", "member"), ("aidana", "member"), ("alex", "mentor")],
    ),
    (
        "db",
        "dmitry",
        "Базы данных: подготовка к экзамену",
        "Разбираем SQL, нормальные формы и транзакции перед экзаменом.",
        "Databases",
        True,
        [("maria", "mentor"), ("aidana", "member"), ("yerzhan", "member")],
    ),
    (
        "ielts",
        "alex",
        "IELTS Squad",
        "Private speaking and writing practice for IELTS 7+.",
        "English",
        False,
        [("maria", "member"), ("aidana", "member")],
    ),
]

PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)

# group, uploader, title, file name, mime, content
MATERIALS = [
    (
        "calc",
        "aigerim",
        "Limits cheat sheet",
        "limits.txt",
        "text/plain",
        b"Limits\n- lim sin(x)/x = 1\n- lim (1+1/n)^n = e\n",
    ),
    ("calc", "alex", "Integration techniques", "integration.pdf", "application/pdf", PDF),
    (
        "algo",
        "yerzhan",
        "Сұрыптау алгоритмдері",
        "sorting.txt",
        "text/plain",
        "Quick sort: O(n log n) орташа, O(n^2) ең нашар жағдайда.\n".encode(),
    ),
    (
        "algo",
        "alex",
        "Graph traversal notes",
        "graphs.md",
        "text/markdown",
        b"# BFS vs DFS\nBFS uses a queue, DFS uses a stack.\n",
    ),
    (
        "db",
        "dmitry",
        "Нормальные формы",
        "normal-forms.txt",
        "text/plain",
        "1НФ, 2НФ, 3НФ, НФБК: краткая шпаргалка.\n".encode(),
    ),
    ("db", "maria", "SQL practice set", "sql-practice.pdf", "application/pdf", PDF),
    (
        "ielts",
        "alex",
        "Speaking part 2 topics",
        "speaking.txt",
        "text/plain",
        b"Describe a book that influenced you.\nDescribe a place you want to visit.\n",
    ),
]

# group, author, body (oldest first)
MESSAGES = [
    ("calc", "aigerim", "Welcome to Calculus Crew! First session is Thursday at 18:00."),
    ("calc", "alex", "Can we start with limits? The epsilon-delta definition confuses me."),
    ("calc", "aigerim", "Sure. I uploaded a cheat sheet to Materials."),
    ("calc", "maria", "Thanks! Is problem 14 from the sheet really 1/2?"),
    ("calc", "dmitry", "Yes, use the series expansion of cos(x)."),
    ("algo", "yerzhan", "Сәлем! Бұл аптада сұрыптау алгоритмдерін қарастырамыз."),
    ("algo", "aidana", "Quick sort-тың ең нашар жағдайын кім түсіндіре алады?"),
    ("algo", "alex", "Pivot is always the smallest or largest element: O(n^2)."),
    ("algo", "aigerim", "Рахмет, түсінікті болды!"),
    ("db", "dmitry", "Всем привет! Сегодня разбираем нормальные формы."),
    ("db", "maria", "Кто может объяснить разницу между 3НФ и НФБК?"),
    ("db", "yerzhan", "В НФБК каждая детерминанта является потенциальным ключом."),
    ("db", "aidana", "Спасибо, теперь понятно. Выложите примеры транзакций?"),
    ("ielts", "alex", "Let's practise speaking part 2 tomorrow at 20:00."),
    ("ielts", "maria", "Sounds good. I will prepare the topic about travelling."),
    ("ielts", "aidana", "Can we also review the writing task 2 structure?"),
]

# group, creator, title, description, days until due, {user: percent}
GOALS = [
    (
        "calc",
        "aigerim",
        "Finish limits problem set",
        "Problems 1-20 from the cheat sheet.",
        7,
        {"aigerim": 100, "alex": 60, "dmitry": 30, "maria": 50},
    ),
    (
        "calc",
        "aigerim",
        "Midterm mock exam",
        "Solve last year's midterm under time.",
        21,
        {"aigerim": 40, "alex": 10},
    ),
    (
        "algo",
        "yerzhan",
        "Реализовать 5 сортировок",
        "Пузырёк, вставки, слияние, быстрая, куча.",
        10,
        {"yerzhan": 80, "aigerim": 50, "aidana": 20, "alex": 100},
    ),
    (
        "db",
        "dmitry",
        "Решить 30 SQL-задач",
        "Подборка задач по JOIN и агрегатам.",
        14,
        {"dmitry": 70, "maria": 100, "aidana": 40, "yerzhan": 10},
    ),
    (
        "ielts",
        "alex",
        "Mock speaking test",
        "Record and review two full speaking tests.",
        5,
        {"alex": 100, "maria": 50, "aidana": 25},
    ),
]

# recipient, type, group, title, body, read
NOTIFICATIONS = [
    (
        "alex",
        "new_message",
        "calc",
        "Calculus Crew",
        "Dmitry: Yes, use the series expansion of cos(x).",
    ),
    (
        "alex",
        "new_material",
        "algo",
        "Алгоритмдер мен деректер құрылымдары",
        "Ержан Касымов uploaded Сұрыптау алгоритмдері",
    ),
    ("alex", "new_goal", "calc", "Calculus Crew", "New goal: Midterm mock exam"),
    (
        "aigerim",
        "progress_milestone",
        "calc",
        "Calculus Crew",
        "Maria reached 50% on Finish limits problem set",
    ),
    (
        "aigerim",
        "new_message",
        "algo",
        "Алгоритмдер мен деректер құрылымдары",
        "Айдана Сатпаева: Quick sort-тың ең нашар жағдайын кім түсіндіре алады?",
    ),
    (
        "maria",
        "new_goal",
        "db",
        "Базы данных: подготовка к экзамену",
        "New goal: Решить 30 SQL-задач",
    ),
    (
        "maria",
        "new_message",
        "ielts",
        "IELTS Squad",
        "Alex Johnson: Let's practise speaking part 2 tomorrow at 20:00.",
    ),
    (
        "yerzhan",
        "progress_milestone",
        "algo",
        "Алгоритмдер мен деректер құрылымдары",
        "Alex Johnson reached 100% on Реализовать 5 сортировок",
    ),
    (
        "dmitry",
        "new_material",
        "db",
        "Базы данных: подготовка к экзамену",
        "Maria uploaded SQL practice set",
    ),
]


async def seed() -> bool:
    now = datetime.now(UTC)
    async with get_sessionmaker()() as s:
        if await s.scalar(select(User.id).where(User.email == USERS[0][1])):
            return False
        pw_hash = await hash_password(DEMO_PASSWORD)
        users = {
            k: User(email=e, password_hash=pw_hash, full_name=n, locale=loc)
            for k, e, n, loc in USERS
        }
        s.add_all(users.values())
        await s.flush()

        groups: dict[str, Group] = {}
        for key, owner, title, desc, subject, public, members in GROUPS:
            g = Group(
                owner_id=users[owner].id,
                title=title,
                description=desc,
                subject=subject,
                is_public=public,
                created_at=now - timedelta(days=30),
            )
            s.add(g)
            await s.flush()
            groups[key] = g
            s.add(
                Membership(
                    group_id=g.id, user_id=users[owner].id, role="mentor", joined_at=g.created_at
                )
            )
            for i, (member, role) in enumerate(members):
                s.add(
                    Membership(
                        group_id=g.id,
                        user_id=users[member].id,
                        role=role,
                        joined_at=now - timedelta(days=28 - i),
                    )
                )

        for i, (group, uploader, title, file_name, mime, content) in enumerate(MATERIALS):
            s.add(
                Material(
                    group_id=groups[group].id,
                    uploader_id=users[uploader].id,
                    title=title,
                    file_name=file_name,
                    mime_type=mime,
                    size_bytes=len(content),
                    content=content,
                    created_at=now - timedelta(days=20 - i),
                )
            )

        for i, (group, author, body) in enumerate(MESSAGES):
            s.add(
                Message(
                    group_id=groups[group].id,
                    author_id=users[author].id,
                    body=body,
                    created_at=now - timedelta(hours=len(MESSAGES) - i),
                )
            )

        for group, creator, title, desc, days, progress in GOALS:
            goal = Goal(
                group_id=groups[group].id,
                created_by=users[creator].id,
                title=title,
                description=desc,
                due_date=date.today() + timedelta(days=days),
                created_at=now - timedelta(days=10),
            )
            s.add(goal)
            await s.flush()
            for user, percent in progress.items():
                s.add(
                    GoalProgress(
                        goal_id=goal.id,
                        user_id=users[user].id,
                        percent=percent,
                        updated_at=now - timedelta(days=1),
                    )
                )

        for i, (user, type_, group, title, body) in enumerate(NOTIFICATIONS):
            s.add(
                Notification(
                    user_id=users[user].id,
                    type=type_,
                    group_id=groups[group].id,
                    title=title,
                    body=body,
                    is_read=i % 4 == 3,
                    created_at=now - timedelta(minutes=15 * (i + 1)),
                )
            )
        await s.commit()
        return True


async def main() -> None:
    created = await seed()
    await get_engine().dispose()
    print(
        f"seeded demo data; log in as alex@tandem.app / {DEMO_PASSWORD}"
        if created
        else "demo data already present, nothing to do"
    )


if __name__ == "__main__":
    asyncio.run(main())
