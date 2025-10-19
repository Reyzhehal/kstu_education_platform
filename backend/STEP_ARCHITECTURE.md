# Архитектура шагов урока (Steps)

## Обзор

Система поддерживает 15 типов шагов урока с различным контентом. Используется **гибридный подход**: базовая модель с JSON-полем для специфичных данных каждого типа.

## Структура данных

```
Course (Курс)
  └── Module (Модуль)
        └── Lesson (Урок)
              └── Step (Шаг) ← JSON content
```

## Модель Step

```python
class Step(SQLModel, table=True):
    id: UUID
    lesson_id: UUID  # FK -> Lesson
    title: str | None
    step_type: StepType  # enum
    position: int  # порядок в уроке
    content: dict[str, Any]  # JSON/JSONB поле
```

## Типы шагов (StepType)

| Тип | Название | Описание |
|-----|----------|----------|
| `TEXT` | Текст | Текст с форматированием, изображениями |
| `VIDEO` | Видео | Видео контент |
| `CODE` | Программирование | Задача на код (stdin → stdout) |
| `QUIZ` | Тест | Выбор ответов (один/несколько) |
| `MATCHING` | Сопоставление | Соединить элементы из двух списков |
| `SORTING` | Сортировка | Расположить элементы в правильном порядке |
| `TABLE` | Табличная задача | Заполнить таблицу |
| `FILL_BLANKS` | Пропуски | Заполнить пропуски в тексте |
| `STRING` | Текстовая задача | Короткий текстовый ответ |
| `NUMBER` | Численная задача | Числовой ответ с допуском |
| `MATH` | Математическая задача | Математическая формула |
| `FREE_ANSWER` | Свободный ответ | Развернутый текстовый ответ |
| `SQL` | SQL Challenge | Написать SQL запрос |
| `HTML_CSS` | HTML и CSS | Верстка страницы |
| `DATASET` | Задача на данные | Data Science задача |

## Примеры структур content

### TEXT - Текст
```json
{
  "text": "# Заголовок\n\nТекст урока...",
  "images": ["url1.png", "url2.png"]
}
```

### VIDEO - Видео
```json
{
  "url": "https://youtube.com/watch?v=xxx",
  "duration": 300
}
```

### QUIZ - Тест
```json
{
  "question": "Вопрос?",
  "options": [
    {"text": "Вариант 1", "is_correct": true},
    {"text": "Вариант 2", "is_correct": false}
  ],
  "multiple": false,
  "explanation": "Объяснение..."
}
```

### CODE - Программирование
```json
{
  "task": "Описание задачи",
  "starter_code": "def solution():\n    pass",
  "test_cases": [
    {"input": "1 2", "expected_output": "3"}
  ],
  "language": "python"
}
```

## Валидация

Для каждого типа шага создана Pydantic схема в `app/schemas/step_content.py`:

```python
from app.schemas.step_content import TextStepContent, QuizStepContent

# Создание с валидацией
content = TextStepContent(text="...", images=[])
step = Step(
    step_type=StepType.TEXT,
    content=content.model_dump()  # Pydantic -> dict
)

# Чтение с валидацией
validated = TextStepContent(**step.content)  # dict -> Pydantic
```

## Преимущества подхода

✅ **Гибкость** - легко добавлять новые типы шагов
✅ **Типизация** - Pydantic схемы для валидации
✅ **Производительность** - PostgreSQL JSONB с индексами
✅ **Простота** - не нужны десятки таблиц
✅ **Масштабируемость** - JSON поддерживает вложенные структуры

## Альтернативные подходы (не выбраны)

### ❌ Class Table Inheritance
- Отдельная таблица для каждого типа
- Сложность: много таблиц, JOIN'ов
- Плюс: строгая типизация на уровне БД

### ❌ Single Table Inheritance
- Все поля в одной таблице + type
- Много NULL значений
- Сложно масштабировать

### ❌ Отдельные таблицы без связи
- Нет общего интерфейса
- Сложность работы с уроками

## Миграция

После добавления модели Step выполните:

```bash
cd backend
alembic revision --autogenerate -m "Add Step model"
alembic upgrade head
```

## API пример

```python
@router.post("/lessons/{lesson_id}/steps")
async def create_step(
    lesson_id: UUID,
    step_type: StepType,
    content: dict,
    session: AsyncSessionDep
):
    # Валидация content по типу
    content_schemas = {
        StepType.TEXT: TextStepContent,
        StepType.QUIZ: QuizStepContent,
        # ...
    }
    
    schema = content_schemas[step_type]
    validated_content = schema(**content)
    
    step = Step(
        lesson_id=lesson_id,
        step_type=step_type,
        content=validated_content.model_dump()
    )
    
    session.add(step)
    await session.commit()
    return step
```

## Индексы PostgreSQL

Для эффективных запросов к JSON:

```sql
-- Индекс по типу шага
CREATE INDEX idx_step_type ON step(step_type);

-- GIN индекс для поиска по content
CREATE INDEX idx_step_content ON step USING GIN(content);

-- Поиск шагов с определенным языком программирования
SELECT * FROM step 
WHERE step_type = 2 
AND content->>'language' = 'python';
```

