from typing import Any
from uuid import UUID, uuid4
from pathlib import Path

from fastapi import APIRouter, HTTPException, File, UploadFile
from sqlmodel import select

from app.api.deps import AsyncSessionDep, CurrentUser
from app.api.utils import detect_image_ext_by_magic
from app.core.config import settings
from app.models import (
    Course,
    Module,
    Lesson,
    LessonCreate,
    LessonUpdate,
    LessonPublic,
)

router = APIRouter(prefix="/lessons", tags=["lessons"])


async def get_lesson_with_course(
    session: AsyncSessionDep, lesson_id: UUID
) -> tuple[Lesson, Module, Course]:
    """Получить урок, модуль и курс, проверив их существование"""
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return lesson, module, course


@router.get("/{lesson_id}", response_model=LessonPublic)
async def read_lesson(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить урок по ID.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return LessonPublic(**lesson.model_dump())


@router.patch("/{lesson_id}", response_model=LessonPublic)
async def update_lesson(
    lesson_id: UUID,
    lesson_in: LessonUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить урок по ID. Только автор курса может обновлять.
    """
    lesson, module, course = await get_lesson_with_course(session, lesson_id)

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


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Удалить урок по ID. Только автор курса может удалять.
    """
    lesson, module, course = await get_lesson_with_course(session, lesson_id)

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete lessons"
        )

    await session.delete(lesson)
    await session.commit()

    return {"message": "Lesson deleted successfully"}


@router.post("/{lesson_id}/cover", response_model=LessonPublic)
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
    lesson, module, course = await get_lesson_with_course(session, lesson_id)

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
    if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    magic_ext = detect_image_ext_by_magic(data)
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


@router.delete("/{lesson_id}/cover", response_model=LessonPublic)
async def delete_lesson_cover(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Удалить обложку урока. Только автор курса может удалять.
    """
    lesson, module, course = await get_lesson_with_course(session, lesson_id)

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
