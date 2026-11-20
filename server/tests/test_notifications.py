from tests.conftest import API


async def _setup(client, register, make_group):
    owner, bob, carl = await register("Owner"), await register("Bob"), await register("Carl")
    gid = (await make_group(owner, "Algebra"))["id"]
    for u in (bob, carl):
        await client.post(f"{API}/groups/{gid}/join", headers=u.headers)
    return owner, bob, carl, gid


async def _notes(client, acc, **params):
    r = await client.get(f"{API}/notifications", params=params, headers=acc.headers)
    assert r.status_code == 200
    return r.json()["items"]


async def test_message_notifications_coalesce_and_skip_actor(client, register, make_group):
    owner, bob, carl, gid = await _setup(client, register, make_group)
    for text in ("one", "two"):
        await client.post(f"{API}/groups/{gid}/messages", json={"body": text}, headers=bob.headers)
    assert await _notes(client, bob) == []  # never for the actor
    for acc in (owner, carl):
        notes = await _notes(client, acc)
        assert [n["type"] for n in notes] == ["new_message"]  # coalesced to one
        assert notes[0]["group_id"] == gid and not notes[0]["is_read"]

    # after reading, the next message notifies again
    await client.post(f"{API}/notifications/{notes[0]['id']}/read", headers=carl.headers)
    await client.post(f"{API}/groups/{gid}/messages", json={"body": "three"}, headers=bob.headers)
    assert len(await _notes(client, carl)) == 2
    assert len(await _notes(client, carl, unread_only="true")) == 1


async def test_material_and_goal_notifications(client, register, make_group):
    owner, bob, carl, gid = await _setup(client, register, make_group)
    await client.post(
        f"{API}/groups/{gid}/materials",
        files={"file": ("n.txt", b"x", "text/plain")},
        headers=bob.headers,
    )
    await client.post(f"{API}/groups/{gid}/goals", json={"title": "Finish"}, headers=owner.headers)
    assert {n["type"] for n in await _notes(client, carl)} == {"new_material", "new_goal"}
    assert {n["type"] for n in await _notes(client, owner)} == {"new_material"}
    assert {n["type"] for n in await _notes(client, bob)} == {"new_goal"}


async def test_progress_milestones_notify_mentors(client, register, make_group):
    owner, bob, carl, gid = await _setup(client, register, make_group)
    goal = (
        await client.post(f"{API}/groups/{gid}/goals", json={"title": "G"}, headers=owner.headers)
    ).json()
    put = lambda acc, pct: client.put(  # noqa: E731
        f"{API}/goals/{goal['id']}/progress", json={"percent": pct}, headers=acc.headers
    )
    await put(bob, 30)
    assert await _notes(client, owner) == []
    await put(bob, 50)
    await put(bob, 70)  # already past 50: no new notification
    notes = await _notes(client, owner)
    assert [n["type"] for n in notes] == ["progress_milestone"] and "50%" in notes[0]["body"]
    await put(bob, 100)
    assert len(await _notes(client, owner)) == 2
    await put(carl, 100)  # straight to 100 notifies once
    assert len(await _notes(client, owner)) == 3
    for acc in (carl, bob):  # never for the member who made progress
        assert "progress_milestone" not in {n["type"] for n in await _notes(client, acc)}


async def test_read_and_unread_count(client, register, make_group):
    owner, bob, carl, gid = await _setup(client, register, make_group)
    await client.post(f"{API}/groups/{gid}/goals", json={"title": "A"}, headers=owner.headers)
    await client.post(
        f"{API}/groups/{gid}/materials",
        files={"file": ("n.txt", b"x", "text/plain")},
        headers=owner.headers,
    )
    count = lambda acc: client.get(f"{API}/notifications/unread-count", headers=acc.headers)  # noqa: E731
    assert (await count(bob)).json() == {"count": 2}
    first = (await _notes(client, bob))[0]
    r = await client.post(f"{API}/notifications/{first['id']}/read", headers=bob.headers)
    assert r.json()["is_read"] is True and (await count(bob)).json() == {"count": 1}
    # someone else's notification is invisible
    r = await client.post(f"{API}/notifications/{first['id']}/read", headers=carl.headers)
    assert r.status_code == 404
    r = await client.post(f"{API}/notifications/read-all", headers=bob.headers)
    assert r.json() == {"updated": 1} and (await count(bob)).json() == {"count": 0}
    assert (await client.get(f"{API}/notifications")).status_code == 401
