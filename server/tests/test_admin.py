from tests.conftest import API


async def test_admin_only(client, register):
    user = await register("User")
    for path in ("/admin/stats", "/admin/users", "/admin/groups", "/admin/materials"):
        r = await client.get(f"{API}{path}", headers=user.headers)
        assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"
        assert (await client.get(f"{API}{path}")).status_code == 401


async def test_user_crud(client, register, admin):
    h = admin.headers
    r = await client.post(
        f"{API}/admin/users",
        json={
            "email": "new@example.com",
            "password": "password123",
            "full_name": "New",
            "role": "admin",
        },
        headers=h,
    )
    assert r.status_code == 201 and r.json()["role"] == "admin"
    uid = r.json()["id"]
    dup = await client.post(
        f"{API}/admin/users",
        json={"email": "new@example.com", "password": "password123", "full_name": "N"},
        headers=h,
    )
    assert dup.status_code == 409 and dup.json()["error"]["code"] == "email_taken"

    assert (await client.get(f"{API}/admin/users/{uid}", headers=h)).json()[
        "email"
    ] == "new@example.com"
    r = await client.patch(
        f"{API}/admin/users/{uid}",
        json={"full_name": "Renamed", "role": "student", "locale": "kk"},
        headers=h,
    )
    assert r.json()["role"] == "student" and r.json()["locale"] == "kk"
    r = await client.patch(
        f"{API}/admin/users/{uid}", json={"email": admin.user["email"]}, headers=h
    )
    assert r.status_code == 409

    listing = await client.get(f"{API}/admin/users", params={"q": "renam"}, headers=h)
    assert listing.json()["total"] == 1

    # self-protection
    for body in ({"role": "student"}, {"is_active": False}):
        r = await client.patch(f"{API}/admin/users/{admin.id}", json=body, headers=h)
        assert r.status_code == 403
    assert (await client.delete(f"{API}/admin/users/{admin.id}", headers=h)).status_code == 403

    assert (await client.delete(f"{API}/admin/users/{uid}", headers=h)).status_code == 204
    assert (await client.get(f"{API}/admin/users/{uid}", headers=h)).status_code == 404
    assert (await client.delete(f"{API}/admin/users/{uid}", headers=h)).status_code == 404


async def test_delete_user_cascades(client, register, make_group, admin):
    owner, member = await register("Owner"), await register("Member")
    gid = (await make_group(owner))["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=member.headers)
    await client.post(f"{API}/groups/{gid}/messages", json={"body": "hi"}, headers=member.headers)
    assert (
        await client.delete(f"{API}/admin/users/{owner.id}", headers=admin.headers)
    ).status_code == 204
    assert (await client.get(f"{API}/groups/{gid}")).status_code == 404  # owned group gone
    stats = (await client.get(f"{API}/admin/stats", headers=admin.headers)).json()
    assert stats["groups"] == 0 and stats["messages"] == 0 and stats["users"] == 2


async def test_group_and_material_crud_and_stats(client, register, make_group, admin):
    h = admin.headers
    owner, other = await register("Owner"), await register("Other")
    r = await client.post(
        f"{API}/admin/groups",
        json={"owner_id": owner.id, "title": "By Admin", "subject": "CS"},
        headers=h,
    )
    assert r.status_code == 201 and r.json()["my_role"] is None and r.json()["members_count"] == 1
    gid = r.json()["id"]
    missing = await client.post(
        f"{API}/admin/groups",
        json={"owner_id": "00000000-0000-0000-0000-000000000000", "title": "x"},
        headers=h,
    )
    assert missing.status_code == 404

    r = await client.patch(
        f"{API}/admin/groups/{gid}", json={"title": "T2", "owner_id": other.id}, headers=h
    )
    assert r.json()["title"] == "T2" and r.json()["owner_id"] == other.id
    assert (await client.get(f"{API}/groups/mine", headers=other.headers)).json()["total"] == 1
    assert (await client.get(f"{API}/admin/groups", params={"q": "t2"}, headers=h)).json()[
        "total"
    ] == 1

    up = await client.post(
        f"{API}/groups/{gid}/materials", files={"file": ("f.txt", b"abc", "text/plain")}, headers=h
    )
    assert up.status_code == 201
    mid = up.json()["id"]
    r = await client.patch(f"{API}/admin/materials/{mid}", json={"title": "Edited"}, headers=h)
    assert r.json()["title"] == "Edited"
    assert (await client.get(f"{API}/admin/materials", headers=h)).json()["total"] == 1

    stats = (await client.get(f"{API}/admin/stats", headers=h)).json()
    assert stats == {
        "users": 3,
        "groups": 1,
        "materials": 1,
        "messages": 0,
        "goals": 0,
        "active_users": 3,
    }

    assert (await client.delete(f"{API}/admin/materials/{mid}", headers=h)).status_code == 204
    assert (await client.delete(f"{API}/admin/materials/{mid}", headers=h)).status_code == 404
    assert (await client.delete(f"{API}/admin/groups/{gid}", headers=h)).status_code == 204
    assert (await client.delete(f"{API}/admin/groups/{gid}", headers=h)).status_code == 404
