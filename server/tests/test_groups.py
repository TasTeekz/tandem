from tests.conftest import API


async def test_create_and_public_visibility(client, register, make_group):
    owner = await register("Owner")
    g = await make_group(owner, "Public One", description="calc", subject="Math")
    assert g["my_role"] == "mentor" and g["members_count"] == 1 and g["owner_id"] == owner.id
    private = await make_group(owner, "Secret", is_public=False)

    guest = await client.get(f"{API}/groups")
    titles = [i["title"] for i in guest.json()["items"]]
    assert titles == ["Public One"] and guest.json()["total"] == 1
    assert guest.json()["items"][0]["my_role"] is None
    assert (await client.get(f"{API}/groups/{g['id']}")).status_code == 200
    hidden = await client.get(f"{API}/groups/{private['id']}")
    assert hidden.status_code == 404 and hidden.json()["error"]["code"] == "not_found"
    assert (
        await client.get(f"{API}/groups/{private['id']}", headers=owner.headers)
    ).status_code == 200
    mine = await client.get(f"{API}/groups/mine", headers=owner.headers)
    assert mine.json()["total"] == 2
    assert (await client.get(f"{API}/groups?q=cal")).json()["total"] == 1
    assert (await client.get(f"{API}/groups?subject=Physics")).json()["total"] == 0


async def test_join_leave_and_conflicts(client, register, make_group):
    owner, bob = await register("Owner"), await register("Bob")
    g = await make_group(owner)
    r = await client.post(f"{API}/groups/{g['id']}/join", headers=bob.headers)
    assert r.status_code == 201 and r.json()["role"] == "member"
    again = await client.post(f"{API}/groups/{g['id']}/join", headers=bob.headers)
    assert again.status_code == 409 and again.json()["error"]["code"] == "already_member"
    assert (await client.get(f"{API}/groups/{g['id']}", headers=bob.headers)).json()[
        "members_count"
    ] == 2

    assert (
        await client.post(f"{API}/groups/{g['id']}/leave", headers=bob.headers)
    ).status_code == 204
    again = await client.post(f"{API}/groups/{g['id']}/leave", headers=bob.headers)
    assert again.status_code == 409 and again.json()["error"]["code"] == "not_member"
    sole = await client.post(f"{API}/groups/{g['id']}/leave", headers=owner.headers)
    assert sole.status_code == 409 and sole.json()["error"]["code"] == "last_mentor"


async def test_private_group_join_is_not_found(client, register, make_group):
    owner, bob = await register("Owner"), await register("Bob")
    g = await make_group(owner, is_public=False)
    r = await client.post(f"{API}/groups/{g['id']}/join", headers=bob.headers)
    assert r.status_code == 404


async def test_member_vs_nonmember_vs_mentor(client, register, make_group):
    owner, member, outsider = (
        await register("Owner"),
        await register("Member"),
        await register("Out"),
    )
    g = await make_group(owner)
    gid = g["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=member.headers)

    # members list: member ok, outsider (public group) forbidden, guest 401
    assert (await client.get(f"{API}/groups/{gid}/members", headers=member.headers)).json()[
        "total"
    ] == 2
    r = await client.get(f"{API}/groups/{gid}/members", headers=outsider.headers)
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"
    assert (await client.get(f"{API}/groups/{gid}/members")).status_code == 401

    # mentor-only edit
    patch = {"title": "Renamed"}
    assert (
        await client.patch(f"{API}/groups/{gid}", json=patch, headers=member.headers)
    ).status_code == 403
    assert (
        await client.patch(f"{API}/groups/{gid}", json=patch, headers=outsider.headers)
    ).status_code == 403
    r = await client.patch(f"{API}/groups/{gid}", json=patch, headers=owner.headers)
    assert r.status_code == 200 and r.json()["title"] == "Renamed"

    # delete: owner only
    assert (await client.delete(f"{API}/groups/{gid}", headers=member.headers)).status_code == 403
    assert (await client.delete(f"{API}/groups/{gid}", headers=owner.headers)).status_code == 204
    assert (await client.get(f"{API}/groups/{gid}")).status_code == 404


async def test_member_role_management(client, register, make_group):
    owner, bob = await register("Owner"), await register("Bob")
    gid = (await make_group(owner))["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=bob.headers)
    # cannot demote the only mentor
    r = await client.patch(
        f"{API}/groups/{gid}/members/{owner.id}", json={"role": "member"}, headers=owner.headers
    )
    assert r.status_code == 409 and r.json()["error"]["code"] == "last_mentor"
    # promote bob, then the owner can step down
    r = await client.patch(
        f"{API}/groups/{gid}/members/{bob.id}", json={"role": "mentor"}, headers=owner.headers
    )
    assert r.status_code == 200 and r.json()["role"] == "mentor"
    r = await client.patch(
        f"{API}/groups/{gid}/members/{owner.id}", json={"role": "member"}, headers=bob.headers
    )
    assert r.status_code == 200
    # now bob is the sole mentor and cannot be removed
    r = await client.delete(f"{API}/groups/{gid}/members/{bob.id}", headers=bob.headers)
    assert r.status_code == 409
    # bob removes the former owner
    assert (
        await client.delete(f"{API}/groups/{gid}/members/{owner.id}", headers=bob.headers)
    ).status_code == 204
    r = await client.delete(f"{API}/groups/{gid}/members/{owner.id}", headers=bob.headers)
    assert r.status_code == 404


async def test_admin_passes_member_and_mentor_checks(client, register, make_group, admin):
    owner = await register("Owner")
    gid = (await make_group(owner, is_public=False))["id"]
    assert (await client.get(f"{API}/groups/{gid}", headers=admin.headers)).status_code == 200
    assert (
        await client.get(f"{API}/groups/{gid}/members", headers=admin.headers)
    ).status_code == 200
    r = await client.patch(f"{API}/groups/{gid}", json={"subject": "CS"}, headers=admin.headers)
    assert r.status_code == 200 and r.json()["subject"] == "CS"
    assert (await client.delete(f"{API}/groups/{gid}", headers=admin.headers)).status_code == 204
