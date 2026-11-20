from sqlalchemy.ext.asyncio import AsyncSession

from app.features.auth import service as auth_service
from app.features.auth.models import User
from app.features.auth.schemas import PublicUserOut
from app.features.groups import service as groups
from app.features.materials import service as materials
from app.features.search.schemas import SearchOut


async def search(session: AsyncSession, user: User, q: str, limit: int) -> SearchOut:
    # Sequential on purpose: one AsyncSession cannot run concurrent statements.
    found_groups = await groups.search(session, user, q, limit)
    found_materials = await materials.search(session, user, q, limit)
    found_users = await auth_service.search_users(session, q, limit)
    return SearchOut(
        groups=found_groups,
        materials=found_materials,
        users=[PublicUserOut.model_validate(u) for u in found_users],
    )
