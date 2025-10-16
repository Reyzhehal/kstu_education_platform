from uuid import UUID, uuid4
from enum import IntEnum
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import UniqueConstraint


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)
    # Allow admins to edit extended profile fields
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=30)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=30)
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)


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
    username: str | None = Field(default=None, unique=True, index=True, max_length=50)
    is_staff: bool = False
    is_teacher: bool = False
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    description_short: str | None = Field(default=None, max_length=255)
    is_profile_private: bool = False
    avatar_image: str | None = Field(default=None, max_length=255)
    cover_image: str | None = Field(default=None, max_length=255)
    city: str = Field(default="Bishkek", max_length=30)
    date_joined: datetime = Field(default_factory=datetime.now)

    def __str__(self) -> str:
        return self.full_name or (self.username or self.email)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: UUID
    language_id: int | None = None
    username: str | None = None
    is_staff: bool = False
    is_teacher: bool = False
    first_name: str | None = None
    last_name: str | None = None
    description: str | None = None
    description_short: str | None = None
    is_profile_private: bool = False
    avatar_image: str | None = None
    cover_image: str | None = None
    city: str = "Bishkek"
    date_joined: datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


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


# Course domain


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
    title: str = Field(min_length=1, max_length=255)
    cover_image: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    description_video: str | None = Field(default=None, max_length=255)
    hours_week: int | None = None
    hours_total: int | None = None
    has_certificate: bool = False
    difficulty_level: DifficultyLevel = DifficultyLevel.BEGINNER


class Course(CourseBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    datetime_create: datetime = Field(default_factory=datetime.now)
    datetime_update: datetime = Field(default_factory=datetime.now)
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


class CoursePageBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    video: str | None = Field(default=None, max_length=255)
    is_demo: bool = False


class CoursePage(CoursePageBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id", ondelete="CASCADE")
    course: Course | None = Relationship()

    def __str__(self) -> str:
        return self.title


class CoursePageCommentBase(SQLModel):
    text: str = Field(min_length=1, max_length=4000)
    datetime_create: datetime = Field(default_factory=datetime.now)


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
class CoursePublic(CourseBase):
    id: UUID
    datetime_create: datetime
    datetime_update: datetime
    author_id: UUID
    language_id: int
    category_id: UUID | None = None
    subcategory_id: UUID | None = None
    is_favorite: bool = False


class CoursesPublic(SQLModel):
    data: list[CoursePublic]
    count: int
