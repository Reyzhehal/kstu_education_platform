from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from app.api.deps import AsyncSessionDep, CurrentUser
from app.models import (
    Course,
    Lesson,
    Module,
    Step,
    StepCreate,
    StepUpdate,
    StepPublic,
    StepsPublic,
)

router = APIRouter(prefix="/lessons/{lesson_id}/steps", tags=["steps"])


@router.get("/", response_model=list[StepPublic])
async def read_lesson_steps(
    lesson_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить все шаги урока, отсортированные по position
    """
    # Проверяем существование урока
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Получаем модуль и курс для проверки доступа
    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Получаем шаги
    steps_stmt = (
        select(Step).where(col(Step.lesson_id) == lesson_id).order_by(Step.position)
    )
    steps_result = await session.exec(steps_stmt)
    steps = steps_result.all()

    return steps


@router.post("/", response_model=StepPublic)
async def create_step(
    lesson_id: UUID,
    step_in: StepCreate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Создать новый шаг в уроке. Только автор курса может создавать шаги.
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    step = Step.model_validate(step_in.model_dump() | {"lesson_id": lesson_id})
    session.add(step)
    await session.commit()
    await session.refresh(step)
    return step


@router.get("/{step_id}", response_model=StepPublic)
async def read_step(
    lesson_id: UUID,
    step_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Получить шаг по ID
    """
    step = await session.get(Step, step_id)
    if not step or step.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Step not found")

    return step


@router.put("/{step_id}", response_model=StepPublic)
async def update_step(
    lesson_id: UUID,
    step_id: UUID,
    step_in: StepUpdate,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Обновить шаг. Только автор курса может обновлять шаги.
    """
    step = await session.get(Step, step_id)
    if not step or step.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Step not found")

    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = step_in.model_dump(exclude_unset=True)
    step.sqlmodel_update(update_data)
    session.add(step)
    await session.commit()
    await session.refresh(step)
    return step


@router.delete("/{step_id}")
async def delete_step(
    lesson_id: UUID,
    step_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Удалить шаг. Только автор курса может удалять шаги.
    """
    step = await session.get(Step, step_id)
    if not step or step.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Step not found")

    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    module = await session.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    course = await session.get(Course, module.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await session.delete(step)
    await session.commit()
    return {"ok": True}
