"""
Примеры создания шагов разных типов.
Показывает как использовать модель Step с различным контентом.
"""

from uuid import uuid4
from app.models import Step, StepType
from app.schemas.step_content import (
    TextStepContent,
    VideoStepContent,
    QuizStepContent,
    QuizOption,
    CodeStepContent,
    CodeTestCase,
)


# Пример 1: Текстовый шаг
def create_text_step(lesson_id):
    content = TextStepContent(
        text="# Введение в Python\n\nPython - это высокоуровневый язык программирования.",
        images=["https://example.com/image1.png"],
    )

    step = Step(
        lesson_id=lesson_id,
        title="Введение",
        step_type=StepType.TEXT,
        position=1,
        content=content.model_dump(),  # Pydantic -> dict
    )
    return step


# Пример 2: Видео шаг
def create_video_step(lesson_id):
    content = VideoStepContent(url="https://youtube.com/watch?v=xxx", duration=300)

    step = Step(
        lesson_id=lesson_id,
        title="Видео урок",
        step_type=StepType.VIDEO,
        position=2,
        content=content.model_dump(),
    )
    return step


# Пример 3: Тест
def create_quiz_step(lesson_id):
    content = QuizStepContent(
        question="Что такое Python?",
        options=[
            QuizOption(text="Язык программирования", is_correct=True),
            QuizOption(text="Змея", is_correct=False),
            QuizOption(text="Фреймворк", is_correct=False),
        ],
        multiple=False,
        explanation="Python - это интерпретируемый язык программирования.",
    )

    step = Step(
        lesson_id=lesson_id,
        title="Тест: Основы Python",
        step_type=StepType.QUIZ,
        position=3,
        content=content.model_dump(),
    )
    return step


# Пример 4: Задача на программирование
def create_code_step(lesson_id):
    content = CodeStepContent(
        task="Напишите функцию, которая возвращает сумму двух чисел",
        starter_code="def add(a, b):\n    # Ваш код здесь\n    pass",
        test_cases=[
            CodeTestCase(input="2 3", expected_output="5"),
            CodeTestCase(input="10 20", expected_output="30"),
        ],
        language="python",
    )

    step = Step(
        lesson_id=lesson_id,
        title="Задача: Сумма чисел",
        step_type=StepType.CODE,
        position=4,
        content=content.model_dump(),
    )
    return step


# Валидация при чтении
def validate_step_content(step: Step):
    """Валидирует content шага согласно его типу"""

    content_schemas = {
        StepType.TEXT: TextStepContent,
        StepType.VIDEO: VideoStepContent,
        StepType.QUIZ: QuizStepContent,
        StepType.CODE: CodeStepContent,
        # и т.д. для остальных типов
    }

    schema = content_schemas.get(step.step_type)
    if schema:
        # Валидация через Pydantic
        validated_content = schema(**step.content)
        return validated_content

    return step.content
