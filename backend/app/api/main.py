from fastapi import APIRouter

from app.api.routes import (
    categories,
    courses,
    languages,
    lessons,
    login,
    modules,
    private,
    steps,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(modules.router)
api_router.include_router(modules.modules_router)
api_router.include_router(lessons.router)
api_router.include_router(steps.router)
api_router.include_router(courses.router)
api_router.include_router(languages.router)
api_router.include_router(categories.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
