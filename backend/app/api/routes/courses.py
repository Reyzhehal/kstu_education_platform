from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, File, UploadFile
from sqlmodel import col, func, select

from app.api.utils import detect_image_ext_by_magic
from app.core.config import settings

from app.api.deps import AsyncSessionDep, CurrentUser
from app.models import (
    Course,
    CourseCreate,
    CourseUpdate,
    CourseDescriptionBlock,
    CourseDescriptionLine,
    CourseFavoriteLink,
    CoursePublic,
    CoursesPublic,
    CourseStudentLink,
    User,
    Subcategory,
)

router = APIRouter(prefix="/courses", tags=["courses"])


async def enrich_course_public(
    course: Course, session: AsyncSessionDep, user_id: UUID
) -> CoursePublic:
    """
    Обогатить объект Course дополнительными полями для CoursePublic
    """
    # Проверяем избранное
    is_favorite_stmt = select(CourseFavoriteLink).where(
        CourseFavoriteLink.course_id == course.id,
        CourseFavoriteLink.user_id == user_id,
    )
    is_favorite = (await session.exec(is_favorite_stmt)).first() is not None

    # Считаем студентов
    students_count_stmt = (
        select(func.count())
        .select_from(CourseStudentLink)
        .where(CourseStudentLink.course_id == course.id)
    )
    students_count = (await session.exec(students_count_stmt)).one()

    # Проверяем запись на курс
    is_enrolled_stmt = select(CourseStudentLink).where(
        CourseStudentLink.course_id == course.id,
        CourseStudentLink.user_id == user_id,
    )
    is_enrolled = (await session.exec(is_enrolled_stmt)).first() is not None

    course_dict = course.model_dump()
    course_dict["is_favorite"] = is_favorite
    course_dict["students_count"] = students_count
    course_dict["is_enrolled"] = is_enrolled

    return CoursePublic(**course_dict)


@router.post("/", response_model=CoursePublic)
async def create_course(
    course_in: CourseCreate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Создать новый курс. Курс создается как черновик с минимальными данными.
    """
    course = Course(
        title=course_in.title,
        author_id=current_user.id,
    )
    session.add(course)
    await session.commit()
    await session.refresh(course)

    return await enrich_course_public(course, session, current_user.id)


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
    Только опубликованные курсы.
    """

    statement = select(Course).where(col(Course.is_published) == True)

    # Фильтр по категории
    if category_id is not None:
        statement = statement.where(col(Course.category_id) == category_id)

    # Фильтр по подкатегории
    if subcategory_id is not None:
        statement = statement.where(col(Course.subcategory_id) == subcategory_id)

    # Фильтр по метакатегории через join subcategory
    if meta_category_id is not None:
        statement = statement.join(
            Subcategory, col(Subcategory.id) == col(Course.subcategory_id)
        ).where(col(Subcategory.meta_category_id) == meta_category_id)

    # Фильтр по языку курса
    if language_id is not None:
        statement = statement.where(col(Course.language_id) == language_id)

    # Фильтр по уровню сложности
    if difficulty_level is not None:
        statement = statement.where(col(Course.difficulty_level) == difficulty_level)

    # Поиск по тексту (title, description, author first/last name, author.username)
    if q:
        pattern = f"%{q}%"
        statement = statement.join(User, col(User.id) == col(Course.author_id)).where(
            (col(Course.title).ilike(pattern))
            | (col(Course.description).ilike(pattern))
            | (col(User.first_name).ilike(pattern))
            | (col(User.last_name).ilike(pattern))
            | False
        )

    # Подсчет общего количества с учетом фильтров
    count_statement = statement.with_only_columns(func.count()).order_by(None)
    count = (await session.exec(count_statement)).one()

    # Пагинация
    statement = statement.offset(skip).limit(limit)
    courses = (await session.exec(statement)).all()

    # Преобразуем курсы в CoursePublic с дополнительными полями
    courses_public = []
    for course in courses:
        course_public = await enrich_course_public(course, session, current_user.id)
        courses_public.append(course_public)

    return CoursesPublic(data=courses_public, count=count)


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

    # Преобразуем курсы в CoursePublic
    courses_public = []
    for course in courses:
        course_public = await enrich_course_public(course, session, current_user.id)
        courses_public.append(course_public)

    return CoursesPublic(data=courses_public, count=count)


@router.get("/progress", response_model=CoursesPublic)
async def read_my_courses(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Курсы, на которые записан текущий пользователь"""
    course_ids_stmt = select(CourseStudentLink.course_id).where(
        CourseStudentLink.user_id == current_user.id
    )
    enrolled_ids = (await session.exec(course_ids_stmt)).all()
    if not enrolled_ids:
        return CoursesPublic(data=[], count=0)

    statement = select(Course).where(col(Course.id).in_(enrolled_ids))
    count_statement = statement.with_only_columns(func.count()).order_by(None)
    count = (await session.exec(count_statement)).one()
    statement = statement.offset(skip).limit(limit)
    courses = (await session.exec(statement)).all()

    courses_public: list[CoursePublic] = []
    for course in courses:
        course_public = await enrich_course_public(course, session, current_user.id)
        courses_public.append(course_public)

    return CoursesPublic(data=courses_public, count=count)


@router.get("/author", response_model=CoursesPublic)
async def read_author_courses(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Курсы, созданные текущим пользователем (где он автор)"""
    statement = select(Course).where(col(Course.author_id) == current_user.id)

    count_statement = statement.with_only_columns(func.count()).order_by(None)
    count = (await session.exec(count_statement)).one()

    statement = statement.offset(skip).limit(limit)
    courses = (await session.exec(statement)).all()

    courses_public: list[CoursePublic] = []
    for course in courses:
        course_public = await enrich_course_public(course, session, current_user.id)
        # Автор не записан на свой курс, так что переопределяем
        course_dict = course_public.model_dump()
        course_dict["is_enrolled"] = False
        courses_public.append(CoursePublic(**course_dict))

    return CoursesPublic(data=courses_public, count=count)


@router.post("/{course_id}/publish")
async def publish_course(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """Опубликовать курс. Только автор может публиковать."""
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only course author can publish")

    course.is_published = True
    session.add(course)
    await session.commit()

    return {"message": "Course published successfully"}


@router.get("/{course_id}", response_model=CoursePublic)
async def read_course_by_id(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Если курс не опубликован, только автор может его видеть
    if not course.is_published and course.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")

    return await enrich_course_public(course, session, current_user.id)


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
            CourseFavoriteLink.user_id == current_user.id,
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
            CourseFavoriteLink.user_id == current_user.id,
        )
    )
    favorite_link = result.first()

    if not favorite_link:
        raise HTTPException(status_code=404, detail="Course not in favorites")

    # Удаляем из избранного
    await session.delete(favorite_link)
    await session.commit()

    return {"message": "Course removed from favorites"}


@router.post("/{course_id}/enroll")
async def enroll_course(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """Записаться на курс"""
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # проверим, не записан ли уже
    exists = await session.exec(
        select(CourseStudentLink).where(
            CourseStudentLink.course_id == course_id,
            CourseStudentLink.user_id == current_user.id,
        )
    )
    if exists.first():
        return {"message": "Already enrolled"}

    session.add(CourseStudentLink(course_id=course_id, user_id=current_user.id))
    await session.commit()
    return {"message": "Enrolled"}


@router.delete("/{course_id}/enroll")
async def unenroll_course(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """Отписаться от курса"""
    result = await session.exec(
        select(CourseStudentLink).where(
            CourseStudentLink.course_id == course_id,
            CourseStudentLink.user_id == current_user.id,
        )
    )
    link = result.first()
    if not link:
        return {"message": "Not enrolled"}
    await session.delete(link)
    await session.commit()
    return {"message": "Unenrolled"}


@router.get("/{course_id}/learn", response_model=list[str])
async def read_course_learn_lines(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> list[str]:
    """Вернуть список CourseDescriptionLine.text для курса"""
    statement = select(CourseDescriptionLine.text).where(
        col(CourseDescriptionLine.course_id) == course_id
    )
    results = (await session.exec(statement)).all()
    return [r for r in results]


@router.get("/{course_id}/blocks", response_model=list[dict])
async def read_course_description_blocks(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> list[dict]:
    """Вернуть список CourseDescriptionBlock для курса (title, text)"""
    statement = select(CourseDescriptionBlock.title, CourseDescriptionBlock.text).where(
        col(CourseDescriptionBlock.course_id) == course_id
    )
    rows = (await session.exec(statement)).all()
    return [{"title": title, "text": text} for title, text in rows]


@router.post("/{course_id}/cover", response_model=CoursePublic)
async def upload_course_cover(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> Any:
    """
    Загрузить обложку курса. Принимает image/jpeg, image/png, image/webp.
    Только автор курса может загружать обложку.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can upload course cover"
        )

    content_type = file.content_type or ""
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    covers_dir = Path("app/static/covers")
    covers_dir.mkdir(parents=True, exist_ok=True)
    ext = allowed[content_type]
    filename = f"{course_id}_{uuid4().hex}.{ext}"
    filepath = covers_dir / filename

    data = await file.read()
    if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    magic_ext = detect_image_ext_by_magic(data)
    if magic_ext is None or magic_ext != allowed[content_type]:
        raise HTTPException(status_code=400, detail="Invalid image data")
    filepath.write_bytes(data)

    # Удаляем старую обложку, если она есть
    if course.cover_image and course.cover_image.startswith("/static/covers/"):
        try:
            old_path = Path("app") / course.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    course.cover_image = f"/static/covers/{filename}"
    session.add(course)
    await session.commit()
    await session.refresh(course)

    return await enrich_course_public(course, session, current_user.id)


@router.delete("/{course_id}/cover", response_model=CoursePublic)
async def delete_course_cover(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Удалить обложку курса. Только автор курса может удалять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete course cover"
        )

    # Удаляем файл обложки
    if course.cover_image and course.cover_image.startswith("/static/covers/"):
        try:
            old_path = Path("app") / course.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    course.cover_image = None
    session.add(course)
    await session.commit()
    await session.refresh(course)

    return await enrich_course_public(course, session, current_user.id)


@router.patch("/{course_id}", response_model=CoursePublic)
async def update_course(
    course_id: UUID,
    course_in: CourseUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить курс. Только автор может обновлять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only course author can update")

    # Обновляем только переданные поля
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    # Обновляем дату изменения
    course.datetime_update = datetime.utcnow()

    session.add(course)
    await session.commit()
    await session.refresh(course)

    return await enrich_course_public(course, session, current_user.id)
