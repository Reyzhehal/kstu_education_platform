from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
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
    LessonPublic,
)

router = APIRouter(prefix="/courses/{course_id}/modules", tags=["modules"])
modules_router = APIRouter(prefix="/modules", tags=["modules"])


async def get_module_with_course(
    session: AsyncSessionDep, module_id: UUID
) -> tuple[Module, Course]:
    """Получить модуль и курс, проверив их существование"""
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return module, course


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


@modules_router.get("/{module_id}", response_model=ModulePublic)
async def read_module(
    module_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить модуль по ID.
    """
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return ModulePublic(**module.model_dump())


@modules_router.patch("/{module_id}", response_model=ModulePublic)
async def update_module(
    module_id: UUID,
    module_in: ModuleUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить модуль по ID. Только автор курса может обновлять.
    """
    module, course = await get_module_with_course(session, module_id)

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can update modules"
        )

    update_data = module_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)

    session.add(module)
    await session.commit()
    await session.refresh(module)

    return ModulePublic(**module.model_dump())


@modules_router.delete("/{module_id}")
async def delete_module(
    module_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> dict[str, str]:
    """
    Удалить модуль по ID. Только автор курса может удалять.
    """
    module, course = await get_module_with_course(session, module_id)

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can delete modules"
        )

    await session.delete(module)
    await session.commit()

    return {"message": "Module deleted successfully"}


# Создание урока в модуле
@modules_router.post("/{module_id}/lessons", response_model=LessonPublic)
async def create_lesson_in_module(
    module_id: UUID,
    lesson_in: LessonCreate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Создать новый урок в модуле. Только автор курса может создавать уроки.
    """
    module, course = await get_module_with_course(session, module_id)

    if course.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only course author can create lessons"
        )

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
