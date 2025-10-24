from datetime import datetime
from enum import IntEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)
    # Allow admins to edit extended profile fields
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=30)


class UserUpdateMe(SQLModel):
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=30)
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)
    telegram_url: str | None = Field(default=None, max_length=255)
    github_url: str | None = Field(default=None, max_length=255)
    youtube_url: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


class LanguageBase(SQLModel):
    name: str = Field(unique=True, max_length=20)
    code: str = Field(unique=True, max_length=2)


class Language(LanguageBase, table=True):
    id: int = Field(primary_key=True)
    users: list["User"] = Relationship(back_populates="language")

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    language_id: int | None = Field(
        default=None, foreign_key="language.id", ondelete="SET NULL"
    )
    language: Language | None = Relationship(back_populates="users")
    is_staff: bool = False
    is_teacher: bool = False
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)
    is_profile_private: bool = False
    avatar_image: str | None = Field(default=None, max_length=255)
    cover_image: str | None = Field(default=None, max_length=255)
    city: str = Field(default="Bishkek", max_length=30)
    date_joined: datetime = Field(default_factory=datetime.utcnow)
    # social links
    website_url: str | None = Field(default=None, max_length=120)
    telegram_url: str | None = Field(default=None, max_length=120)
    github_url: str | None = Field(default=None, max_length=120)
    youtube_url: str | None = Field(default=None, max_length=120)

    def __str__(self) -> str:
        name = " ".join([p for p in [self.first_name, self.last_name] if p])
        return name or self.email


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: UUID
    language_id: int | None = None
    is_staff: bool = False
    is_teacher: bool = False
    description: str | None = None
    description_short: str | None = None
    is_profile_private: bool = False
    avatar_image: str | None = None
    cover_image: str | None = None
    city: str = "Bishkek"
    date_joined: datetime
    # extra computed fields
    courses_count: int = 0
    # social links
    website_url: str | None = None
    telegram_url: str | None = None
    github_url: str | None = None
    youtube_url: str | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None
    type: str | None = None  # "access" или "refresh"
    jti: str | None = None  # JWT ID для refresh токенов


# Refresh token in database
class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    token_id: str = Field(unique=True, index=True)  # jti из JWT
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = Field(default=False)

    def __str__(self) -> str:
        return f"RefreshToken({self.token_id[:8]}...)"


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class LanguagePublic(LanguageBase):
    id: int


class LanguagesPublic(SQLModel):
    data: list[LanguagePublic]
    count: int


class SetLanguage(SQLModel):
    language_id: int | None = None


class CategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, unique=True, index=True)


class Category(CategoryBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    meta_categories: list["MetaCategory"] = Relationship(
        back_populates="category", cascade_delete=True
    )

    def __str__(self) -> str:
        return self.name


class SubcategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, index=True)


class MetaCategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, index=True)


class MetaCategory(MetaCategoryBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    category_id: UUID = Field(foreign_key="category.id", ondelete="CASCADE")
    category: Category | None = Relationship(back_populates="meta_categories")
    subcategories: list["Subcategory"] = Relationship(back_populates="meta_category")

    def __str__(self) -> str:
        return self.name


class Subcategory(SubcategoryBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    category_id: UUID = Field(foreign_key="category.id", ondelete="CASCADE")
    meta_category_id: UUID | None = Field(
        default=None, foreign_key="metacategory.id", ondelete="SET NULL"
    )
    category: Category | None = Relationship()
    meta_category: MetaCategory | None = Relationship(back_populates="subcategories")

    def __str__(self) -> str:
        return self.name


class CategoryPublic(CategoryBase):
    id: UUID


class CategoriesPublic(SQLModel):
    data: list[CategoryPublic]
    count: int


class SubcategoryPublic(SubcategoryBase):
    id: UUID
    category_id: UUID
    meta_category_id: UUID | None = None


class SubcategoriesPublic(SQLModel):
    data: list[SubcategoryPublic]
    count: int


class MetaCategoryPublic(MetaCategoryBase):
    id: UUID
    category_id: UUID


class MetaCategoriesPublic(SQLModel):
    data: list[MetaCategoryPublic]
    count: int


class MetaCategoryWithSubcategoriesPublic(MetaCategoryPublic):
    subcategories: list[SubcategoryPublic] = []


class MetaCategoriesWithChildrenPublic(SQLModel):
    data: list[MetaCategoryWithSubcategoriesPublic]
    count: int


class DifficultyLevel(IntEnum):
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3


class CourseStudentLink(SQLModel, table=True):
    __tablename__ = "course_student_link"
    course_id: UUID = Field(foreign_key="course.id", primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", primary_key=True)


class CourseFavoriteLink(SQLModel, table=True):
    __tablename__ = "course_favorite_link"
    course_id: UUID = Field(foreign_key="course.id", primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", primary_key=True)


class CourseBase(SQLModel):
    title: str = Field(min_length=1, max_length=64)
    cover_image: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    description_video: str | None = Field(default=None, max_length=255)
    short_description: str | None = Field(default=None, max_length=512)
    what_you_will_learn: str | None = Field(default=None, max_length=2000)
    target_audience: str | None = Field(default=None, max_length=2000)
    requirements: str | None = Field(default=None, max_length=2000)
    how_it_works: str | None = Field(default=None, max_length=2000)
    what_you_get: str | None = Field(default=None, max_length=2000)
    hours_week: int | None = None
    hours_total: int | None = None
    has_certificate: bool = False
    difficulty_level: DifficultyLevel = DifficultyLevel.BEGINNER
    is_published: bool = Field(default=False)


class Course(CourseBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    datetime_create: datetime = Field(default_factory=datetime.utcnow)
    datetime_update: datetime = Field(default_factory=datetime.utcnow)
    author_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    author: User | None = Relationship()
    language_id: int = Field(foreign_key="language.id", ondelete="RESTRICT", default=1)
    language: Language | None = Relationship()
    category_id: UUID | None = Field(
        default=None, foreign_key="category.id", ondelete="RESTRICT"
    )
    subcategory_id: UUID | None = Field(
        default=None, foreign_key="subcategory.id", ondelete="RESTRICT"
    )

    students: list[User] = Relationship(link_model=CourseStudentLink)
    favorite: list[User] = Relationship(link_model=CourseFavoriteLink)

    # helper relationships for admin forms
    category: Category | None = Relationship()
    subcategory: Subcategory | None = Relationship()

    def __str__(self) -> str:
        return self.title


class CourseDescriptionBlockBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    text: str = Field(min_length=1, max_length=4000)


class CourseDescriptionBlock(CourseDescriptionBlockBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course | None = Relationship()

    def __str__(self) -> str:
        return self.title


class CourseDescriptionLineBase(SQLModel):
    text: str = Field(min_length=1, max_length=2000)


class CourseDescriptionLine(CourseDescriptionLineBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course | None = Relationship()

    def __str__(self) -> str:
        return self.text[:50] + ("…" if len(self.text) > 50 else "")


class ModuleBase(SQLModel):
    title: str = Field(min_length=1, max_length=64)
    description: str | None = Field(default=None, max_length=256)
    position: int = Field(default=0)


class Module(ModuleBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course | None = Relationship()

    def __str__(self) -> str:
        return self.title


class LessonBase(SQLModel):
    title: str = Field(min_length=1, max_length=64)
    cover_image: str | None = Field(default=None, max_length=255)
    language_id: int | None = None
    allow_comments: bool = True
    position: int = Field(default=0)


class Lesson(LessonBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    module_id: UUID = Field(foreign_key="module.id", ondelete="CASCADE")
    module: Module | None = Relationship()
    language_id: int = Field(foreign_key="language.id", ondelete="RESTRICT", default=1)
    language: Language | None = Relationship()

    def __str__(self) -> str:
        return self.title


class StepType(IntEnum):
    TEXT = 0  # Текст
    VIDEO = 1  # Видео
    CODE = 2  # Программирование
    QUIZ = 3  # Тест (задача)
    MATCHING = 4  # Задача на сопоставление
    SORTING = 5  # Задача на сортировку
    TABLE = 6  # Табличная задача
    FILL_BLANKS = 7  # Пропуски
    STRING = 8  # Текстовая задача
    NUMBER = 9  # Численная задача
    MATH = 10  # Математическая задача
    FREE_ANSWER = 11  # Свободный ответ
    SQL = 12  # SQL Challenge
    HTML_CSS = 13  # HTML и CSS задача
    DATASET = 14  # Задача на данные


class StepBase(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    step_type: StepType = Field(default=StepType.TEXT)
    position: int = Field(default=0)  # порядок шага в уроке


class Step(StepBase, table=True):
    # Примеры структур content для разных типов:
    #
    # TEXT: {"text": str, "images": [str]}
    # VIDEO: {"url": str, "duration": int}
    # CODE: {"task": str, "starter_code": str, "test_cases": [...], "language": str}
    # QUIZ: {"question": str, "options": [...], "correct_answers": [...], "multiple": bool}
    # MATCHING: {"pairs": [{"left": str, "right": str}], "options": [...]}
    # SORTING: {"items": [str], "correct_order": [int]}
    # TABLE: {"headers": [str], "correct_answers": [[str]]}
    # FILL_BLANKS: {"text": str, "blanks": [{"position": int, "answer": str}]}
    # STRING: {"question": str, "answer": str, "case_sensitive": bool}
    # NUMBER: {"question": str, "answer": float, "tolerance": float}
    # MATH: {"question": str, "answer": str, "variables": {...}}
    # FREE_ANSWER: {"question": str, "max_length": int}
    # SQL: {"task": str, "database_schema": str, "test_queries": [...]}
    # HTML_CSS: {"task": str, "initial_html": str, "initial_css": str}
    # DATASET: {"task": str, "dataset_url": str, "test_cases": [...]}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    lesson_id: UUID = Field(foreign_key="lesson.id", ondelete="CASCADE")
    lesson: Lesson | None = Relationship()

    # JSON поле для специфичного контента каждого типа
    content: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    def __str__(self) -> str:
        return self.title or f"Step {self.position}"


class CoursePageBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    video: str | None = Field(default=None, max_length=255)


class CoursePage(CoursePageBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course | None = Relationship()

    def __str__(self) -> str:
        return self.title


class CoursePageCommentBase(SQLModel):
    text: str = Field(min_length=1, max_length=4000)
    datetime_create: datetime = Field(default_factory=datetime.utcnow)


class CoursePageComment(CoursePageCommentBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_page_id: UUID = Field(foreign_key="coursepage.id", ondelete="CASCADE")
    course_page: CoursePage | None = Relationship()
    author_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    author: User | None = Relationship()
    reply_to_comment_id: UUID | None = Field(
        default=None, foreign_key="coursepagecomment.id", ondelete="SET NULL"
    )

    def __str__(self) -> str:
        return self.text[:50] + ("…" if len(self.text) > 50 else "")


class CoursePageCommentReviewBase(SQLModel):
    is_like: bool = True


class CoursePageCommentReview(CoursePageCommentReviewBase, table=True):
    __table_args__ = (
        UniqueConstraint("author_id", "comment_id", name="uq_comment_review_author"),
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    author: User | None = Relationship()
    comment_id: UUID = Field(foreign_key="coursepagecomment.id", ondelete="CASCADE")
    comment: CoursePageComment | None = Relationship()

    def __str__(self) -> str:
        return "Like" if self.is_like else "Dislike"


class ClassroomStudentLink(SQLModel, table=True):
    __tablename__ = "classroom_student_link"
    classroom_id: UUID = Field(foreign_key="classroom.id", primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", primary_key=True)


class ClassroomBase(SQLModel):
    pass


class Classroom(ClassroomBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")
    owner: User | None = Relationship()
    students: list[User] = Relationship(link_model=ClassroomStudentLink)

    def __str__(self) -> str:
        return f"Classroom {str(self.id)[:8]}"


# Public schemas for Courses
class CourseCreate(SQLModel):
    title: str = Field(min_length=1, max_length=64)


class CourseUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=64)
    cover_image: str | None = None
    description: str | None = None
    description_video: str | None = None
    short_description: str | None = Field(default=None, min_length=100, max_length=500)
    what_you_will_learn: str | None = None
    target_audience: str | None = None
    requirements: str | None = None
    how_it_works: str | None = None
    what_you_get: str | None = None
    hours_week: int | None = None
    hours_total: int | None = None
    has_certificate: bool | None = None
    difficulty_level: DifficultyLevel | None = None
    language_id: int | None = None
    category_id: UUID | None = None
    subcategory_id: UUID | None = None


class CoursePublic(CourseBase):
    id: UUID
    datetime_create: datetime
    datetime_update: datetime
    author_id: UUID
    language_id: int
    category_id: UUID | None = None
    subcategory_id: UUID | None = None
    is_favorite: bool = False
    students_count: int = 0
    is_enrolled: bool = False


class CoursesPublic(SQLModel):
    data: list[CoursePublic]
    count: int


# Public schemas for Modules
class ModuleCreate(SQLModel):
    title: str = Field(min_length=1, max_length=64)
    description: str | None = None
    position: int = 0


class ModuleUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=64)
    description: str | None = None
    position: int | None = None


class ModulePublic(ModuleBase):
    id: UUID
    course_id: UUID


# Public schemas for Lessons
class LessonCreate(SQLModel):
    title: str = Field(min_length=1, max_length=64)
    cover_image: str | None = None
    language_id: int | None = None
    allow_comments: bool = True
    position: int = 0


class LessonUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=64)
    cover_image: str | None = None
    language_id: int | None = None
    allow_comments: bool | None = None
    position: int | None = None


class LessonPublic(LessonBase):
    id: UUID
    module_id: UUID


# Вложенная структура для просмотра содержания курса
class ModuleWithLessons(ModulePublic):
    lessons: list[LessonPublic] = []


# Public schemas for Steps
class StepCreate(SQLModel):
    title: str | None = None
    step_type: StepType = StepType.TEXT
    position: int = 0
    content: dict[str, Any] = Field(default_factory=dict)


class StepUpdate(SQLModel):
    title: str | None = None
    step_type: StepType | None = None
    position: int | None = None
    content: dict[str, Any] | None = None


class StepPublic(StepBase):
    id: UUID
    lesson_id: UUID
    content: dict[str, Any] = Field(default_factory=dict)


class StepsPublic(SQLModel):
    data: list[StepPublic]
    count: int
