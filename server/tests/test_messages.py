from tests.conftest import API


async def _setup(client, register, make_group):
    owner, bob, out = await register("Owner"), await register("Bob"), await register("Out")
    gid = (await make_group(owner))["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=bob.headers)
    return owner, bob, out, gid


async def test_post_requires_membership(client, register, make_group):
    owner, bob, out, gid = await _setup(client, register, make_group)
    r = await client.post(f"{API}/groups/{gid}/messages", json={"body": "hi"}, headers=out.headers)
    assert r.status_code == 403
    r = await client.get(f"{API}/groups/{gid}/messages", headers=out.headers)
    assert r.status_code == 403
    r = await client.post(f"{API}/groups/{gid}/messages", json={"body": "  "}, headers=bob.headers)
    assert r.status_code == 422
    r = await client.post(f"{API}/groups/{gid}/messages", json={"body": "hi"}, headers=bob.headers)
    assert r.status_code == 201 and r.json()["author_name"] == "Bob"


async def test_cursor_pagination(client, register, make_group):
    owner, bob, _, gid = await _setup(client, register, make_group)
    ids = []
    for i in range(6):
        who = owner if i % 2 else bob
        r = await client.post(
            f"{API}/groups/{gid}/messages", json={"body": f"m{i}"}, headers=who.headers
        )
        ids.append(r.json()["id"])
    url = f"{API}/groups/{gid}/messages"

    latest = (await client.get(url, params={"limit": 3}, headers=bob.headers)).json()
    assert [m["body"] for m in latest["items"]] == ["m3", "m4", "m5"] and latest["total"] == 3

    older = (
        await client.get(url, params={"before": ids[3], "limit": 2}, headers=bob.headers)
    ).json()
    assert [m["body"] for m in older["items"]] == ["m1", "m2"]

    newer = (await client.get(url, params={"after": ids[2]}, headers=bob.headers)).json()
    assert [m["body"] for m in newer["items"]] == ["m3", "m4", "m5"]
    assert (await client.get(url, params={"after": ids[5]}, headers=bob.headers)).json()[
        "items"
    ] == []

    unknown = await client.get(
        url, params={"after": "00000000-0000-0000-0000-000000000000"}, headers=bob.headers
    )
    assert unknown.status_code == 404
    assert (await client.get(url, params={"limit": 101}, headers=bob.headers)).status_code == 422
