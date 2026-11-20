import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, forbidden, not_authenticated, not_found
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.features.auth import repository as repo
from app.features.auth.models import User
from app.features.auth.schemas import AuthOut, RegisterIn, TokenOut, UserOut

EMAIL_TAKEN = AppError("email_taken", 409, "Email already registered")
ACCOUNT_DISABLED = AppError("account_disabled", 403, "Account is disabled")


def _tokens(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_token(user.id, "access", user.token_version),
        refresh_token=create_token(user.id, "refresh", user.token_version),
    )


async def create_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    full_name: str,
    role: str = "student",
    locale: str = "en",
    is_active: bool = True,
) -> User:
    if await repo.get_by_email(session, email):
        raise EMAIL_TAKEN
    user = User(
        email=email,
        password_hash=await hash_password(password),
        full_name=full_name,
        role=role,
        locale=locale,
        is_active=is_active,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as e:  # concurrent registration with the same email
        await session.rollback()
        raise EMAIL_TAKEN from e
    return user


async def update_user(session: AsyncSession, user: User, fields: dict) -> User:
    if "password" in fields or fields.get("is_active") is False:
        user.token_version += 1  # invalidates every token issued so far
    if "password" in fields:
        user.password_hash = await hash_password(fields.pop("password"))
    if "email" in fields and fields["email"] != user.email:
        if await repo.get_by_email(session, fields["email"]):
            raise EMAIL_TAKEN
    for key, value in fields.items():
        setattr(user, key, value)
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise EMAIL_TAKEN from e
    return user


async def get_user(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await repo.get_by_id(session, user_id)
    if user is None:
        raise not_found("User not found")
    return user


async def register(session: AsyncSession, data: RegisterIn) -> AuthOut:
    user = await create_user(session, **data.model_dump())
    return AuthOut(user=UserOut.model_validate(user), **_tokens(user).model_dump())


_DUMMY: list[str] = []


async def _dummy_hash() -> str:
    if not _DUMMY:
        _DUMMY.append(await hash_password("dummy-password"))
    return _DUMMY[0]


async def login(session: AsyncSession, email: str, password: str) -> AuthOut:
    user = await repo.get_by_email(session, email)
    # unknown email still pays for one bcrypt check, so timing does not leak existence
    hashed = user.password_hash if user else await _dummy_hash()
    if not await verify_password(password, hashed) or user is None:
        raise AppError("invalid_credentials", 401, "Wrong email or password")
    if not user.is_active:
        raise ACCOUNT_DISABLED
    return AuthOut(user=UserOut.model_validate(user), **_tokens(user).model_dump())


async def refresh(session: AsyncSession, refresh_token: str) -> TokenOut:
    invalid = AppError("invalid_refresh_token", 401, "Invalid or expired refresh token")
    try:
        user_id, version = decode_token(refresh_token, "refresh")
    except ValueError as e:
        raise invalid from e
    user = await repo.get_by_id(session, user_id)
    if user is None or user.token_version != version:
        raise invalid
    if not user.is_active:
        raise ACCOUNT_DISABLED
    return _tokens(user)


async def user_from_access_token(session: AsyncSession, token: str) -> User:
    try:
        user_id, version = decode_token(token, "access")
    except ValueError as e:
        raise not_authenticated("Invalid or expired token") from e
    user = await repo.get_by_id(session, user_id)
    if user is None or user.token_version != version:
        raise not_authenticated("Invalid or expired token")
    if not user.is_active:
        raise ACCOUNT_DISABLED
    return user


async def ensure_admin(session: AsyncSession, email: str, password: str) -> bool:
    """Startup seeding: create (or promote) the admin if the platform has none."""
    if await repo.admin_exists(session):
        return False
    existing = await repo.get_by_email(session, email.lower())
    if existing:
        await update_user(session, existing, {"role": "admin", "is_active": True})
    else:
        await create_user(
            session, email=email.lower(), password=password, full_name="Administrator", role="admin"
        )
    return True


async def search_users(session: AsyncSession, q: str, limit: int) -> list[User]:
    return await repo.search_by_name(session, q, limit)


def require_admin(user: User) -> User:
    if user.role != "admin":
        raise forbidden("Admin only")
    return user
