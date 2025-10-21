from typing import Any
from uuid import UUID, uuid4
from pathlib import Path

from fastapi import APIRouter, HTTPException, File, UploadFile
from sqlmodel import col, select

from app.api.deps import AsyncSessionDep, CurrentUser
from app.models import (
    Course,
    Module,
    ModuleCreate,
    ModuleUpdate,
    ModulePublic,
    ModuleWithLessons,
    Lesson,
    LessonCreate,
    LessonUpdate,
    LessonPublic,
)

router = APIRouter(prefix="/courses/{course_id}/modules", tags=["modules"])

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _detect_image_ext_by_magic(data: bytes) -> str | None:
    # JPEG: FF D8 FF
    if len(data) >= 3 and data[0:3] == b"\xff\xd8\xff":
        return "jpg"
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if len(data) >= 8 and data[0:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    # WEBP: RIFF....WEBP
    if len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


@router.get("/", response_model=list[ModuleWithLessons])
async def read_course_modules(
    course_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить все модули курса с уроками, отсортированные по position
    """
    # Проверяем существование курса
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Получаем модули
    modules_stmt = (
        select(Module)
        .where(col(Module.course_id) == course_id)
        .order_by(Module.position)
    )
    modules_result = await session.exec(modules_stmt)
    modules = modules_result.all()

    # Для каждого модуля получаем уроки
    result = []
    for module in modules:
        lessons_stmt = (
            select(Lesson)
            .where(col(Lesson.module_id) == module.id)
            .order_by(Lesson.position)
        )
        lessons_result = await session.exec(lessons_stmt)
        lessons = lessons_result.all()

        module_dict = module.model_dump()
        module_dict["lessons"] = [lesson.model_dump() for lesson in lessons]
        result.append(ModuleWithLessons(**module_dict))

    return result


@router.post("/", response_model=ModulePublic)
async def create_module(
    course_id: UUID,
    module_in: ModuleCreate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Создать новый модуль в курсе. Только автор курса может создавать модули.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can create modules"
        )

    module = Module(
        **module_in.model_dump(),
        course_id=course_id,
    )
    session.add(module)
    await session.commit()
    await session.refresh(module)

    return ModulePublic(**module.model_dump())


@router.patch("/{module_id}", response_model=ModulePublic)
async def update_module(
    course_id: UUID,
    module_id: UUID,
    module_in: ModuleUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить модуль. Только автор курса может обновлять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can update modules"
        )

    module = await session.get(Module, module_id)
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Module not found")

    update_data = module_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)

    session.add(module)
    await session.commit()
    await session.refresh(module)

    return ModulePublic(**module.model_dump())


@router.delete("/{module_id}")
async def delete_module(
    course_id: UUID,
    module_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Удалить модуль. Только автор курса может удалять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete modules"
        )

    module = await session.get(Module, module_id)
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Module not found")

    await session.delete(module)
    await session.commit()

    return {"message": "Module deleted successfully"}


# Endpoints для уроков
@router.post("/{module_id}/lessons", response_model=LessonPublic)
async def create_lesson(
    course_id: UUID,
    module_id: UUID,
    lesson_in: LessonCreate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Создать новый урок в модуле. Только автор курса может создавать уроки.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can create lessons"
        )

    module = await session.get(Module, module_id)
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Module not found")

    lesson_data = lesson_in.model_dump()
    # Устанавливаем язык курса по умолчанию, если не указан
    if lesson_data.get("language_id") is None:
        lesson_data["language_id"] = course.language_id

    lesson = Lesson(
        **lesson_data,
        module_id=module_id,
    )
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)

    return LessonPublic(**lesson.model_dump())


@router.patch("/{module_id}/lessons/{lesson_id}", response_model=LessonPublic)
async def update_lesson(
    course_id: UUID,
    module_id: UUID,
    lesson_id: UUID,
    lesson_in: LessonUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить урок. Только автор курса может обновлять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can update lessons"
        )

    lesson = await session.get(Lesson, lesson_id)
    if not lesson or lesson.module_id != module_id:
        raise HTTPException(status_code=404, detail="Lesson not found")

    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)

    return LessonPublic(**lesson.model_dump())


@router.delete("/{module_id}/lessons/{lesson_id}")
async def delete_lesson(
    course_id: UUID,
    module_id: UUID,
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Удалить урок. Только автор курса может удалять.
    """
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete lessons"
        )

    lesson = await session.get(Lesson, lesson_id)
    if not lesson or lesson.module_id != module_id:
        raise HTTPException(status_code=404, detail="Lesson not found")

    await session.delete(lesson)
    await session.commit()

    return {"message": "Lesson deleted successfully"}


# Отдельный endpoint для получения урока по ID (без привязки к курсу)
@router.get("/lessons/{lesson_id}", response_model=LessonPublic, tags=["lessons"])
async def read_lesson_by_id(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить урок по ID. Доступно авторизованным пользователям.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return LessonPublic(**lesson.model_dump())


@router.patch("/lessons/{lesson_id}", response_model=LessonPublic, tags=["lessons"])
async def update_lesson_by_id(
    lesson_id: UUID,
    lesson_in: LessonUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить урок по ID. Только автор курса может обновлять.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Проверяем права доступа через модуль и курс
    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can update lessons"
        )

    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)

    return LessonPublic(**lesson.model_dump())


@router.post(
    "/lessons/{lesson_id}/cover", response_model=LessonPublic, tags=["lessons"]
)
async def upload_lesson_cover(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> Any:
    """
    Загрузить обложку урока. Принимает image/jpeg, image/png, image/webp.
    Только автор курса может загружать обложку.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Проверяем права доступа через модуль и курс
    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can upload lesson cover"
        )

    content_type = file.content_type or ""
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    covers_dir = Path("app/static/covers")
    covers_dir.mkdir(parents=True, exist_ok=True)
    ext = allowed[content_type]
    filename = f"{lesson_id}_{uuid4().hex}.{ext}"
    filepath = covers_dir / filename

    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    magic_ext = _detect_image_ext_by_magic(data)
    if magic_ext is None or magic_ext != allowed[content_type]:
        raise HTTPException(status_code=400, detail="Invalid image data")
    filepath.write_bytes(data)

    # Удаляем старую обложку, если она есть
    if lesson.cover_image and lesson.cover_image.startswith("/static/covers/"):
        try:
            old_path = Path("app") / lesson.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    lesson.cover_image = f"/static/covers/{filename}"
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)

    return LessonPublic(**lesson.model_dump())


@router.delete(
    "/lessons/{lesson_id}/cover", response_model=LessonPublic, tags=["lessons"]
)
async def delete_lesson_cover(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Удалить обложку урока. Только автор курса может удалять.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Проверяем права доступа через модуль и курс
    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete lesson cover"
        )

    if lesson.cover_image and lesson.cover_image.startswith("/static/covers/"):
        try:
            old_path = Path("app") / lesson.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    lesson.cover_image = None
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)

    return LessonPublic(**lesson.model_dump())
