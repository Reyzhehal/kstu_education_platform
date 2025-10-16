from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.models import Course, CoursesPublic, CoursePublic, CourseFavoriteLink, User, CourseDescriptionLine, CourseDescriptionBlock
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

    # Получаем список ID избранных курсов текущего пользователя
    favorite_statement = select(CourseFavoriteLink.course_id).where(
        CourseFavoriteLink.user_id == current_user.id
    )
    favorite_course_ids = set((await session.exec(favorite_statement)).all())

    # Преобразуем курсы в CoursePublic с is_favorite
    courses_public = []
    for course in courses:
        course_dict = course.model_dump()
        course_dict['is_favorite'] = course.id in favorite_course_ids
        courses_public.append(CoursePublic(**course_dict))

    return CoursesPublic(data=courses_public, count=count)


@router.get("/{course_id}", response_model=CoursePublic)
async def read_course_by_id(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # проверяем избранное
    favorite_statement = select(CourseFavoriteLink.course_id).where(
        CourseFavoriteLink.user_id == current_user.id
    )
    favorite_course_ids = set((await session.exec(favorite_statement)).all())

    course_dict = course.model_dump()
    course_dict['is_favorite'] = course.id in favorite_course_ids
    return CoursePublic(**course_dict)


@router.post("/{course_id}/favorite")
async def add_to_favorites(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Добавить курс в избранное
    """
    # Проверяем, существует ли курс
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Проверяем, не добавлен ли уже курс в избранное
    existing = await session.exec(
        select(CourseFavoriteLink).where(
            CourseFavoriteLink.course_id == course_id,
            CourseFavoriteLink.user_id == current_user.id
        )
    )
    if existing.first():
        raise HTTPException(status_code=400, detail="Course already in favorites")
    
    # Добавляем в избранное
    favorite_link = CourseFavoriteLink(course_id=course_id, user_id=current_user.id)
    session.add(favorite_link)
    await session.commit()
    
    return {"message": "Course added to favorites"}


@router.delete("/{course_id}/favorite")
async def remove_from_favorites(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Удалить курс из избранного
    """
    # Ищем запись в избранном
    result = await session.exec(
        select(CourseFavoriteLink).where(
            CourseFavoriteLink.course_id == course_id,
            CourseFavoriteLink.user_id == current_user.id
        )
    )
    favorite_link = result.first()
    
    if not favorite_link:
        raise HTTPException(status_code=404, detail="Course not in favorites")
    
    # Удаляем из избранного
    await session.delete(favorite_link)
    await session.commit()
    
    return {"message": "Course removed from favorites"}


@router.get("/favorites", response_model=CoursesPublic)
async def read_favorite_courses(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список избранных курсов текущего пользователя
    """
    # Получаем ID избранных курсов
    favorite_links_statement = select(CourseFavoriteLink.course_id).where(
        CourseFavoriteLink.user_id == current_user.id
    )
    favorite_course_ids = (await session.exec(favorite_links_statement)).all()
    
    if not favorite_course_ids:
        return CoursesPublic(data=[], count=0)
    
    # Получаем курсы по ID
    statement = select(Course).where(col(Course.id).in_(favorite_course_ids))
    
    # Подсчет
    count_statement = statement.with_only_columns(func.count()).order_by(None)
    count = (await session.exec(count_statement)).one()
    
    # Пагинация
    statement = statement.offset(skip).limit(limit)
    courses = (await session.exec(statement)).all()
    
    # Все курсы в избранном, поэтому is_favorite = True для всех
    courses_public = []
    for course in courses:
        course_dict = course.model_dump()
        course_dict['is_favorite'] = True
        courses_public.append(CoursePublic(**course_dict))
    
    return CoursesPublic(data=courses_public, count=count)


@router.get("/{course_id}/learn", response_model=list[str])
async def read_course_learn_lines(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> list[str]:
    """Вернуть список CourseDescriptionLine.text для курса"""
    statement = select(CourseDescriptionLine.text).where(col(CourseDescriptionLine.course_id) == course_id)
    results = (await session.exec(statement)).all()
    return [r for r in results]


@router.get("/{course_id}/blocks", response_model=list[dict])
async def read_course_description_blocks(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> list[dict]:
    """Вернуть список CourseDescriptionBlock для курса (title, text)"""
    statement = select(CourseDescriptionBlock.title, CourseDescriptionBlock.text).where(col(CourseDescriptionBlock.course_id) == course_id)
    rows = (await session.exec(statement)).all()
    return [{"title": title, "text": text} for title, text in rows]


