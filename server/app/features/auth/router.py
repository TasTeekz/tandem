from fastapi import APIRouter

from app.core.deps import CurrentUser, SessionDep
from app.features.auth import service
from app.features.auth.schemas import AuthOut, LoginIn, RefreshIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut, status_code=201)
async def register_user(data: RegisterIn, session: SessionDep):
    return await service.register(session, data)


@router.post("/login", response_model=AuthOut)
async def login_user(data: LoginIn, session: SessionDep):
    return await service.login(session, data.email, data.password)


@router.post("/refresh", response_model=TokenOut)
async def refresh_token(data: RefreshIn, session: SessionDep):
    return await service.refresh(session, data.refresh_token)


@router.get("/me", response_model=UserOut)
async def get_me(user: CurrentUser):
    return user
