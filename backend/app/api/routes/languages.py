from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import AsyncSessionDep
from app.models import Language, LanguagesPublic

router = APIRouter(prefix="/languages", tags=["languages"])


@router.get("/", response_model=LanguagesPublic)
async def read_languages(
    session: AsyncSessionDep, skip: int = 0, limit: int = 100
) -> Any:
    count_statement = select(func.count()).select_from(Language)
    count = (await session.exec(count_statement)).one()
    statement = select(Language).offset(skip).limit(limit)
    languages = (await session.exec(statement)).all()
    return LanguagesPublic(data=languages, count=count)
