"""
Pydantic схемы для валидации content различных типов шагов урока.
Используются для строгой типизации JSON поля content в модели Step.
"""

from pydantic import BaseModel, Field


# Текстовый шаг
class TextStepContent(BaseModel):
    text: str
    images: list[str] = Field(default_factory=list)


# Видео шаг
class VideoStepContent(BaseModel):
    url: str
    duration: int | None = None  # в секундах


# Программирование
class CodeTestCase(BaseModel):
    input: str
    expected_output: str


class CodeStepContent(BaseModel):
    task: str
    starter_code: str = ""
    test_cases: list[CodeTestCase] = Field(default_factory=list)
    language: str = "python"  # python, javascript, cpp, java, etc.


# Тест (множественный/единичный выбор)
class QuizOption(BaseModel):
    text: str
    is_correct: bool = False


class QuizStepContent(BaseModel):
    question: str
    options: list[QuizOption]
    multiple: bool = False  # множественный выбор
    explanation: str | None = None  # объяснение правильного ответа


# Задача на сопоставление
class MatchingPair(BaseModel):
    left: str
    right: str


class MatchingStepContent(BaseModel):
    task: str
    pairs: list[MatchingPair]  # правильные пары
    shuffle: bool = True


# Задача на сортировку
class SortingStepContent(BaseModel):
    task: str
    items: list[str]
    correct_order: list[int]  # индексы в правильном порядке


# Табличная задача
class TableStepContent(BaseModel):
    task: str
    headers: list[str]
    rows_count: int
    correct_answers: list[list[str]]  # двумерный массив правильных ответов


# Пропуски (fill in the blanks)
class Blank(BaseModel):
    position: int  # позиция в тексте
    answer: str
    case_sensitive: bool = False


class FillBlanksStepContent(BaseModel):
    text: str  # текст с маркерами пропусков типа {0}, {1}
    blanks: list[Blank]


# Текстовая задача (короткий ответ)
class StringStepContent(BaseModel):
    question: str
    answer: str
    case_sensitive: bool = False
    hint: str | None = None


# Численная задача
class NumberStepContent(BaseModel):
    question: str
    answer: float
    tolerance: float = 0.01  # допустимая погрешность
    hint: str | None = None


# Математическая задача
class MathStepContent(BaseModel):
    question: str
    answer: str  # математическое выражение
    variables: dict[str, float] = Field(default_factory=dict)
    hint: str | None = None


# Свободный ответ
class FreeAnswerStepContent(BaseModel):
    question: str
    max_length: int = 5000
    placeholder: str | None = None


# SQL Challenge
class SQLTestQuery(BaseModel):
    query: str
    expected_result: list[dict]


class SQLStepContent(BaseModel):
    task: str
    database_schema: str  # DDL схемы базы данных
    initial_data: str | None = None  # INSERT запросы для начальных данных
    test_queries: list[SQLTestQuery] = Field(default_factory=list)


# HTML и CSS задача
class HTMLCSSStepContent(BaseModel):
    task: str
    initial_html: str = ""
    initial_css: str = ""
    expected_output_image: str | None = None  # URL скриншота ожидаемого результата


# Задача на данные (Data Science)
class DatasetStepContent(BaseModel):
    task: str
    dataset_url: str
    test_cases: list[dict] = Field(default_factory=list)
    language: str = "python"  # python, r, julia
