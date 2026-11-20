import os
import subprocess
import sys
import uuid
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

# Must run before the app is imported: tests always use the dedicated test database.
os.environ["POSTGRES_URL"] = os.environ["TEST_POSTGRES_URL"]
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ["BCRYPT_ROUNDS"] = "4"
os.environ["ADMIN_EMAIL"] = ""
os.environ["ADMIN_PASSWORD"] = ""

from app.core.security import hash_password  # noqa: E402
from app.db.session import get_engine, get_sessionmaker  # noqa: E402
from app.features.auth.models import User  # noqa: E402
from app.main import create_app  # noqa: E402

SERVER_DIR = Path(__file__).resolve().parents[1]
API = "/api/v1"


@pytest.fixture(scope="session", autouse=True)
def migrated_db():
    for args in (["downgrade", "base"], ["upgrade", "head"]):
        subprocess.run([sys.executable, "-m", "alembic", *args], cwd=SERVER_DIR, check=True)


@pytest.fixture(autouse=True)
async def clean_db(migrated_db):
    async with get_engine().begin() as conn:
        await conn.execute(text("TRUNCATE users CASCADE"))


@pytest.fixture
async def client():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


class Account:
    def __init__(self, user: dict, access: str, refresh: str, password: str):
        self.user, self.access, self.refresh, self.password = user, access, refresh, password
        self.id = user["id"]
        self.headers = {"Authorization": f"Bearer {access}"}


@pytest.fixture
def register(client):
    async def _register(
        name: str = "Alice", email: str | None = None, locale: str = "en"
    ) -> Account:
        email = email or f"{name.split()[0].lower()}-{uuid.uuid4().hex[:6]}@example.com"
        body = {"email": email, "password": "password123", "full_name": name, "locale": locale}
        r = await client.post(f"{API}/auth/register", json=body)
        assert r.status_code == 201, r.text
        d = r.json()
        return Account(d["user"], d["access_token"], d["refresh_token"], "password123")

    return _register


@pytest.fixture
async def admin(client) -> Account:
    async with get_sessionmaker()() as s:
        s.add(
            User(
                email="root@example.com",
                password_hash=await hash_password("adminpass1"),
                full_name="Root Admin",
                role="admin",
            )
        )
        await s.commit()
    r = await client.post(
        f"{API}/auth/login", json={"email": "root@example.com", "password": "adminpass1"}
    )
    d = r.json()
    return Account(d["user"], d["access_token"], d["refresh_token"], "adminpass1")


@pytest.fixture
def make_group(client):
    async def _make(owner: Account, title: str = "Study Group", is_public: bool = True, **extra):
        r = await client.post(
            f"{API}/groups",
            json={"title": title, "is_public": is_public, **extra},
            headers=owner.headers,
        )
        assert r.status_code == 201, r.text
        return r.json()

    return _make
