import asyncio
import hashlib
import uuid
from datetime import UTC, datetime, timedelta
from typing import Literal

import bcrypt
import jwt

from app.core.config import get_settings

TokenKind = Literal["access", "refresh"]


def _prehash(password: str) -> bytes:  # bcrypt truncates at 72 bytes; hash first
    return hashlib.sha256(password.encode()).hexdigest().encode()


def _hash(password: str) -> str:
    rounds = get_settings().bcrypt_rounds
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt(rounds)).decode()


async def hash_password(password: str) -> str:
    return await asyncio.to_thread(_hash, password)


async def verify_password(password: str, hashed: str) -> bool:
    return await asyncio.to_thread(bcrypt.checkpw, _prehash(password), hashed.encode())


def create_token(user_id: uuid.UUID, kind: TokenKind, version: int = 0) -> str:
    s = get_settings()
    if kind == "access":
        ttl = timedelta(minutes=s.jwt_access_ttl_min)
    else:
        ttl = timedelta(days=s.jwt_refresh_ttl_days)
    now = datetime.now(UTC)
    payload = {"sub": str(user_id), "type": kind, "tv": version, "iat": now, "exp": now + ttl}
    return jwt.encode(payload, s.jwt_secret, algorithm="HS256")


def decode_token(token: str, kind: TokenKind) -> tuple[uuid.UUID, int]:
    """Returns (user_id, token_version). Raises ValueError for any invalid token."""
    try:
        payload = jwt.decode(
            token,
            get_settings().jwt_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        if payload.get("type") != kind:
            raise ValueError("wrong token type")
        return uuid.UUID(payload["sub"]), int(payload.get("tv", 0))
    except (jwt.PyJWTError, KeyError, TypeError) as e:
        raise ValueError("invalid token") from e
