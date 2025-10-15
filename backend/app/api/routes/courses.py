from typing import Any
from uuid import UUID

from fastapi import APIRouter
from sqlmodel import col, func, select

from app.models import Course, CoursesPublic, User
from app.api.deps import AsyncSessionDep, CurrentUser


router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=CoursesPublic)
async def read_courses(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    category_id: UUID | None = None,
    subcategory_id: UUID | None = None,
    meta_category_id: UUID | None = None,
    language_id: int | None = None,
    difficulty_level: int | None = None,
    q: str | None = None,
) -> Any:
    """
    Получить список курсов с фильтрами по категории, подкатегории и текстовому поиску
    по полям title и description. Поддерживает пагинацию.
    """

    statement = select(Course)

    # Фильтр по категории
    if category_id is not None:
        statement = statement.where(col(Course.category_id) == category_id)

    # Фильтр по подкатегории
    if subcategory_id is not None:
        statement = statement.where(col(Course.subcategory_id) == subcategory_id)

    # Фильтр по метакатегории через join subcategory
    if meta_category_id is not None:
        from app.models import Subcategory
        statement = (
            statement.join(Subcategory, col(Subcategory.id) == col(Course.subcategory_id))
            .where(col(Subcategory.meta_category_id) == meta_category_id)
        )

    # Фильтр по языку курса
    if language_id is not None:
        statement = statement.where(col(Course.language_id) == language_id)

    # Фильтр по уровню сложности
    if difficulty_level is not None:
        statement = statement.where(col(Course.difficulty_level) == difficulty_level)

    # Поиск по тексту (title, description, author.full_name, author.username)
    if q:
        pattern = f"%{q}%"
        statement = (
            statement.join(User, col(User.id) == col(Course.author_id))
            .where(
                (col(Course.title).ilike(pattern))
                | (col(Course.description).ilike(pattern))
                | (col(User.full_name).ilike(pattern))
                | (col(User.username).ilike(pattern))
            )
        )

    # Подсчет общего количества с учетом фильтров
    count_statement = statement.with_only_columns(func.count()).order_by(None)
    count = (await session.exec(count_statement)).one()

    # Пагинация
    statement = statement.offset(skip).limit(limit)
    courses = (await session.exec(statement)).all()

    return CoursesPublic(data=courses, count=count)


