from tests.conftest import API


async def _setup(client, register, make_group):
    owner, bob, out = await register("Owner"), await register("Bob"), await register("Out")
    gid = (await make_group(owner))["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=bob.headers)
    return owner, bob, out, gid


async def _goal(client, owner, gid, title="Chapter 1", **extra):
    r = await client.post(
        f"{API}/groups/{gid}/goals", json={"title": title, **extra}, headers=owner.headers
    )
    assert r.status_code == 201, r.text
    return r.json()


async def test_goal_crud_permissions(client, register, make_group):
    owner, bob, out, gid = await _setup(client, register, make_group)
    r = await client.post(f"{API}/groups/{gid}/goals", json={"title": "x"}, headers=bob.headers)
    assert r.status_code == 403
    g = await _goal(client, owner, gid, due_date="2030-01-31")
    assert g["my_percent"] == 0 and g["due_date"] == "2030-01-31"
    assert (await client.get(f"{API}/goals/{g['id']}", headers=out.headers)).status_code == 403
    assert (await client.get(f"{API}/goals/{g['id']}", headers=bob.headers)).status_code == 200
    r = await client.patch(f"{API}/goals/{g['id']}", json={"title": "New"}, headers=bob.headers)
    assert r.status_code == 403
    r = await client.patch(
        f"{API}/goals/{g['id']}", json={"title": "New", "due_date": None}, headers=owner.headers
    )
    assert r.json()["title"] == "New" and r.json()["due_date"] is None
    assert (await client.get(f"{API}/groups/{gid}/goals", headers=bob.headers)).json()["total"] == 1
    assert (await client.delete(f"{API}/goals/{g['id']}", headers=owner.headers)).status_code == 204
    assert (await client.get(f"{API}/goals/{g['id']}", headers=owner.headers)).status_code == 404


async def test_progress_and_board(client, register, make_group):
    owner, bob, out, gid = await _setup(client, register, make_group)
    g1, g2 = await _goal(client, owner, gid, "One"), await _goal(client, owner, gid, "Two")

    r = await client.put(
        f"{API}/goals/{g1['id']}/progress", json={"percent": 60}, headers=bob.headers
    )
    assert r.status_code == 200 and r.json()["percent"] == 60
    r = await client.put(
        f"{API}/goals/{g1['id']}/progress", json={"percent": 80}, headers=bob.headers
    )
    assert r.json()["percent"] == 80  # upsert
    for bad in (101, -1):
        r = await client.put(
            f"{API}/goals/{g1['id']}/progress", json={"percent": bad}, headers=bob.headers
        )
        assert r.status_code == 422
    r = await client.put(
        f"{API}/goals/{g1['id']}/progress", json={"percent": 5}, headers=out.headers
    )
    assert r.status_code == 403

    goals = (await client.get(f"{API}/groups/{gid}/goals", headers=bob.headers)).json()["items"]
    assert {g["title"]: g["my_percent"] for g in goals} == {"One": 80, "Two": 0}

    board = (await client.get(f"{API}/groups/{gid}/progress", headers=owner.headers)).json()
    assert len(board["goals"]) == 2
    by_name = {m["full_name"]: m for m in board["members"]}
    assert by_name["Bob"]["overall_percent"] == 40  # mean(80, 0)
    assert by_name["Owner"]["overall_percent"] == 0
    assert {p["goal_id"]: p["percent"] for p in by_name["Bob"]["per_goal"]}[g1["id"]] == 80
    assert (
        await client.get(f"{API}/groups/{gid}/progress", headers=out.headers)
    ).status_code == 403
    assert g2["id"]


async def test_board_without_goals(client, register, make_group):
    owner = await register("Owner")
    gid = (await make_group(owner))["id"]
    board = (await client.get(f"{API}/groups/{gid}/progress", headers=owner.headers)).json()
    assert board["goals"] == [] and board["members"][0]["overall_percent"] == 0
