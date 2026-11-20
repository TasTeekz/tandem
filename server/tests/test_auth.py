from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import get_settings
from tests.conftest import API


async def test_health_and_error_envelope(client):
    assert (await client.get("/health")).json() == {"status": "ok"}
    r = await client.get(f"{API}/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_register_login_me(client, register):
    acc = await register("Aigerim", "a@example.com", locale="kk")
    assert acc.user["locale"] == "kk" and acc.user["role"] == "student"
    assert "password" not in str(acc.user)
    r = await client.post(
        f"{API}/auth/login", json={"email": "A@Example.com", "password": "password123"}
    )
    assert r.status_code == 200 and r.json()["token_type"] == "bearer"
    me = await client.get(f"{API}/auth/me", headers=acc.headers)
    assert me.json()["email"] == "a@example.com"


async def test_register_validation_and_duplicate(client, register):
    await register("Bob", "bob@example.com")
    dup = await client.post(
        f"{API}/auth/register",
        json={"email": "bob@example.com", "password": "password123", "full_name": "Bob"},
    )
    assert dup.status_code == 409 and dup.json()["error"]["code"] == "email_taken"
    bad = await client.post(
        f"{API}/auth/register", json={"email": "nope", "password": "short", "full_name": ""}
    )
    err = bad.json()["error"]
    assert bad.status_code == 422 and err["code"] == "validation_error"
    assert {d["field"] for d in err["details"]} == {"email", "password", "full_name"}


async def test_login_failures(client, register, admin):
    acc = await register("Carl", "carl@example.com")
    r = await client.post(
        f"{API}/auth/login", json={"email": "carl@example.com", "password": "wrong-pass"}
    )
    assert r.status_code == 401 and r.json()["error"]["code"] == "invalid_credentials"
    await client.patch(
        f"{API}/admin/users/{acc.id}", json={"is_active": False}, headers=admin.headers
    )
    r = await client.post(
        f"{API}/auth/login", json={"email": "carl@example.com", "password": "password123"}
    )
    assert r.status_code == 403 and r.json()["error"]["code"] == "account_disabled"
    r = await client.get(f"{API}/auth/me", headers=acc.headers)
    assert r.json()["error"]["code"] == "account_disabled"


async def test_refresh(client, register):
    acc = await register("Dana")
    r = await client.post(f"{API}/auth/refresh", json={"refresh_token": acc.refresh})
    assert r.status_code == 200
    new = r.json()
    assert (
        await client.get(
            f"{API}/auth/me", headers={"Authorization": f"Bearer {new['access_token']}"}
        )
    ).status_code == 200
    # an access token is not a refresh token, and garbage is rejected
    for bad in (acc.access, "garbage"):
        r = await client.post(f"{API}/auth/refresh", json={"refresh_token": bad})
        assert r.status_code == 401 and r.json()["error"]["code"] == "invalid_refresh_token"
    # a refresh token is not an access token
    r = await client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {acc.refresh}"})
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_expired_access_token(client, register):
    acc = await register("Eve")
    expired = jwt.encode(
        {"sub": acc.id, "type": "access", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        get_settings().jwt_secret,
        algorithm="HS256",
    )
    r = await client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


async def test_profile_update(client, register):
    acc = await register("Fay", "fay@example.com")
    r = await client.patch(
        f"{API}/profile",
        json={"full_name": "Фая Иванова", "locale": "ru", "password": "newpassword1"},
        headers=acc.headers,
    )
    assert r.status_code == 200 and r.json()["locale"] == "ru"
    login = await client.post(
        f"{API}/auth/login", json={"email": "fay@example.com", "password": "newpassword1"}
    )
    assert login.status_code == 200
    r = await client.patch(f"{API}/profile", json={"locale": "xx"}, headers=acc.headers)
    assert r.status_code == 422
