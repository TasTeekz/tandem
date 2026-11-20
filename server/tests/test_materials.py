from urllib.parse import quote

from tests.conftest import API

MAX = 10 * 1024 * 1024


def _file(name="notes.txt", data=b"hello world", mime="text/plain"):
    return {"file": (name, data, mime)}


async def _setup(client, register, make_group):
    owner, bob, out = await register("Owner"), await register("Bob"), await register("Out")
    gid = (await make_group(owner))["id"]
    await client.post(f"{API}/groups/{gid}/join", headers=bob.headers)
    return owner, bob, out, gid


async def test_upload_list_download(client, register, make_group):
    owner, bob, out, gid = await _setup(client, register, make_group)
    r = await client.post(
        f"{API}/groups/{gid}/materials",
        files=_file("конспект.txt", "привет".encode()),
        data={"title": "Lecture 1"},
        headers=bob.headers,
    )
    assert r.status_code == 201, r.text
    m = r.json()
    assert (
        m["title"] == "Lecture 1"
        and m["size_bytes"] == len("привет".encode())
        and "content" not in m
    )
    assert m["uploader_name"] == "Bob"

    listing = await client.get(f"{API}/groups/{gid}/materials", headers=owner.headers)
    assert listing.json()["total"] == 1

    dl = await client.get(f"{API}/materials/{m['id']}/download", headers=owner.headers)
    assert dl.status_code == 200 and dl.content == "привет".encode()
    assert dl.headers["content-type"].startswith("text/plain")
    disp = dl.headers["content-disposition"]
    assert disp.startswith("attachment") and f"filename*=UTF-8''{quote('конспект.txt')}" in disp

    assert (
        await client.get(f"{API}/materials/{m['id']}/download", headers=out.headers)
    ).status_code == 403
    assert (await client.get(f"{API}/materials/{m['id']}/download")).status_code == 401
    assert (
        await client.get(f"{API}/groups/{gid}/materials", headers=out.headers)
    ).status_code == 403


async def test_default_title_and_bad_uploads(client, register, make_group):
    owner, bob, out, gid = await _setup(client, register, make_group)
    url = f"{API}/groups/{gid}/materials"
    r = await client.post(
        url, files=_file("a.pdf", b"%PDF-1.4", "application/pdf"), headers=bob.headers
    )
    assert r.json()["title"] == "a.pdf" and r.json()["mime_type"] == "application/pdf"

    empty = await client.post(url, files=_file(data=b""), headers=bob.headers)
    assert empty.status_code == 415 and empty.json()["error"]["code"] == "unsupported_media"
    not_multipart = await client.post(url, json={"x": 1}, headers=bob.headers)
    assert not_multipart.status_code == 415
    assert (await client.post(url, files=_file(), headers=out.headers)).status_code == 403


async def test_upload_size_limit(client, register, make_group):
    owner, bob, _, gid = await _setup(client, register, make_group)
    url = f"{API}/groups/{gid}/materials"
    ok = await client.post(
        url, files=_file("max.bin", b"x" * MAX, "application/octet-stream"), headers=bob.headers
    )
    assert ok.status_code == 201 and ok.json()["size_bytes"] == MAX
    big = await client.post(url, files=_file("big.bin", b"x" * (MAX + 1)), headers=bob.headers)
    assert big.status_code == 413 and big.json()["error"]["code"] == "file_too_large"


async def test_delete_permissions(client, register, make_group):
    owner, bob, carl, gid = await _setup(client, register, make_group)
    await client.post(f"{API}/groups/{gid}/join", headers=carl.headers)
    url = f"{API}/groups/{gid}/materials"
    a = (await client.post(url, files=_file(), headers=bob.headers)).json()["id"]
    b = (await client.post(url, files=_file(), headers=bob.headers)).json()["id"]
    assert (await client.delete(f"{API}/materials/{a}", headers=carl.headers)).status_code == 403
    assert (
        await client.delete(f"{API}/materials/{a}", headers=bob.headers)
    ).status_code == 204  # uploader
    assert (
        await client.delete(f"{API}/materials/{b}", headers=owner.headers)
    ).status_code == 204  # mentor
    assert (await client.delete(f"{API}/materials/{b}", headers=owner.headers)).status_code == 404
