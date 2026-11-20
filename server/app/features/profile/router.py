from fastapi import APIRouter

from app.core.deps import CurrentUser, SessionDep
from app.features.auth.schemas import UserOut
from app.features.profile import service
from app.features.profile.schemas import ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserOut)
async def get_profile(user: CurrentUser):
    return user


@router.patch("", response_model=UserOut)
async def update_profile(data: ProfileUpdate, user: CurrentUser, session: SessionDep):
    return await service.update_profile(session, user, data)
