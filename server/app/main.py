import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.core.config import get_settings
from app.core.errors import register_handlers
from app.db.session import get_sessionmaker
from app.features.admin.router import router as admin_router
from app.features.auth import service as auth_service
from app.features.auth.router import router as auth_router
from app.features.goals.router import router as goals_router
from app.features.groups.router import router as groups_router
from app.features.materials.router import router as materials_router
from app.features.messages.router import router as messages_router
from app.features.notifications.router import router as notifications_router
from app.features.profile.router import router as profile_router
from app.features.search.router import router as search_router

log = logging.getLogger("tandem")


@asynccontextmanager
async def lifespan(_: FastAPI):
    s = get_settings()
    if s.admin_email and s.admin_password:
        async with get_sessionmaker()() as session:
            if await auth_service.ensure_admin(session, s.admin_email, s.admin_password):
                log.warning("seeded admin %s", s.admin_email)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tandem API",
        version="1.0.0",
        lifespan=lifespan,
        generate_unique_id_function=lambda route: route.name,  # handlers are named verb_noun
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
    register_handlers(app)

    api = APIRouter(prefix="/api/v1")
    for r in (
        auth_router,
        profile_router,
        groups_router,
        messages_router,
        materials_router,
        goals_router,
        notifications_router,
        search_router,
        admin_router,
    ):
        api.include_router(r)
    app.include_router(api)

    @app.get("/health", tags=["health"])
    async def get_health() -> dict[str, str]:
        return {"status": "ok"}

    names = [r.name for r in app.routes if isinstance(r, APIRoute)]
    dupes = {n for n in names if names.count(n) > 1}
    assert not dupes, f"duplicate operation ids: {dupes}"
    return app


app = create_app()
