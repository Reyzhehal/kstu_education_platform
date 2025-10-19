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
    LessonUpdate,
    LessonPublic,
)

router = APIRouter(prefix="/courses/{course_id}/modules", tags=["modules"])


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

    lesson = Lesson(
        **lesson_in.model_dump(),
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
