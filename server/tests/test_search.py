from tests.conftest import API


async def _search(client, acc, q, **params):
    r = await client.get(f"{API}/search", params={"q": q, **params}, headers=acc.headers)
    assert r.status_code == 200, r.text
    return r.json()


async def test_search_respects_visibility(client, register, make_group, admin):
    owner, member, outsider = (
        await register("Zhanar Quantum"),
        await register("Member"),
        await register("Out"),
    )
    public = await make_group(owner, "Quantum Public", subject="Physics")
    private = await make_group(owner, "Quantum Private", is_public=False)
    await client.post(
        f"{API}/groups/{private['id']}/join", headers=member.headers
    )  # 404: not allowed
    await client.post(
        f"{API}/groups/{private['id']}/materials",
        files={"file": ("quantum-notes.txt", b"x", "text/plain")},
        data={"title": "Secret quantum sheet"},
        headers=owner.headers,
    )
    await client.post(
        f"{API}/groups/{public['id']}/materials",
        files={"file": ("a.txt", b"x", "text/plain")},
        data={"title": "Quantum slides"},
        headers=owner.headers,
    )

    out = await _search(client, outsider, "QUANTUM")
    assert [g["title"] for g in out["groups"]] == ["Quantum Public"]
    assert out["materials"] == []  # not a member of any group
    assert [u["full_name"] for u in out["users"]] == ["Zhanar Quantum"]
    assert set(out["users"][0]) == {"id", "full_name"}

    mine = await _search(client, owner, "quantum")
    assert {g["title"] for g in mine["groups"]} == {"Quantum Public", "Quantum Private"}
    assert {m["title"] for m in mine["materials"]} == {"Secret quantum sheet", "Quantum slides"}
    assert (await _search(client, owner, "notes"))["materials"][0][
        "file_name"
    ] == "quantum-notes.txt"

    everything = await _search(client, admin, "quantum")
    assert len(everything["groups"]) == 2 and len(everything["materials"]) == 2

    assert len((await _search(client, owner, "quantum", limit=1))["groups"]) == 1
    assert (await _search(client, owner, "physics"))["groups"][0]["title"] == "Quantum Public"


async def test_search_escapes_wildcards_and_validates(client, register, make_group):
    owner = await register("Owner")
    await make_group(owner, "100% Effort")
    await make_group(owner, "Plain")
    res = await _search(client, owner, "%")
    assert [g["title"] for g in res["groups"]] == ["100% Effort"]
    assert (await _search(client, owner, "_"))["groups"] == []
    assert (
        await client.get(f"{API}/search", params={"q": ""}, headers=owner.headers)
    ).status_code == 422
    assert (await client.get(f"{API}/search", params={"q": "x"})).status_code == 401
