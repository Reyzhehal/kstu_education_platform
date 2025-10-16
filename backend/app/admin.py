from typing import Optional

import jwt
from fastapi import Request
from sqladmin import Admin, ModelView
from wtforms.fields import TextAreaField
from sqladmin.authentication import AuthenticationBackend

from app.core import security
from app.core.config import settings
from app.core.db import async_engine, AsyncSessionLocal
from app.models import (
    Category,
    Classroom,
    Course,
    CourseDescriptionBlock,
    CourseDescriptionLine,
    CoursePage,
    CoursePageComment,
    CoursePageCommentReview,
    Language,
    MetaCategory,
    Subcategory,
    User,
)
from app.core.security import verify_password


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")  # поле из формы SQLAdmin
        password = form.get("password")

        if not username or not password:
            return False

        async with AsyncSessionLocal() as session:
            # ищем по email или username — подстройте под свою логику
            from sqlmodel import select
            stmt = select(User).where((User.email == username) | (User.username == username))
            user = (await session.exec(stmt)).first()

            if not user or not user.is_superuser:
                return False
            if not verify_password(password, user.hashed_password):
                return False

        # помечаем сессию как вошедшую
        request.session["admin_user_id"] = str(user.id)
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        # 1) сессия после формы логина
        if request.session.get("admin_user_id"):
            return True

        # 2) fallback: Bearer JWT
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:].strip()
            try:
                import jwt
                from app.core import security
                from app.core.config import settings
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
                user_id = payload.get("sub")
                if not user_id:
                    return False
                async with AsyncSessionLocal() as session:
                    user = await session.get(User, user_id)  # type: ignore[arg-type]
                    return bool(user and user.is_superuser)
            except Exception:
                return False

        return False


class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    column_list = [User.id, User.email, User.full_name, User.username, User.language, User.is_superuser, User.is_staff, User.is_teacher]
    column_searchable_list = [User.email, User.username, User.full_name]
    form_overrides = {
        "description": TextAreaField,
        "description_short": TextAreaField,
    }
    form_widget_args = {
        "description": {"rows": 6},
        "description_short": {"rows": 3},
    }


class LanguageAdmin(ModelView, model=Language):
    name = "Language"
    name_plural = "Languages"
    column_list = [Language.id, Language.code, Language.name]


class CategoryAdmin(ModelView, model=Category):
    name = "Category"
    name_plural = "Categories"
    column_list = [Category.id, Category.name]


class SubcategoryAdmin(ModelView, model=Subcategory):
    name = "Subcategory"
    name_plural = "Subcategories"
    column_list = [Subcategory.id, Subcategory.name, Subcategory.category, Subcategory.meta_category]


class MetaCategoryAdmin(ModelView, model=MetaCategory):
    name = "MetaCategory"
    name_plural = "MetaCategories"
    column_list = [MetaCategory.id, MetaCategory.name, MetaCategory.category]


# Currency removed


class CourseAdmin(ModelView, model=Course):
    name = "Course"
    name_plural = "Courses"
    column_searchable_list = [Course.title]
    column_list = [
        Course.id,
        Course.title,
        Course.author,
        Course.category,
        Course.subcategory,
        Course.difficulty_level,
    ]
    form_overrides = {
        "description": TextAreaField,
    }
    form_widget_args = {
        "description": {"rows": 8},
    }


class CourseDescriptionBlockAdmin(ModelView, model=CourseDescriptionBlock):
    name = "Course Block"
    name_plural = "Course Blocks"
    column_list = [CourseDescriptionBlock.id, CourseDescriptionBlock.title, CourseDescriptionBlock.course]
    form_overrides = {
        "text": TextAreaField,
    }
    form_widget_args = {
        "text": {"rows": 8},
    }


class CourseDescriptionLineAdmin(ModelView, model=CourseDescriptionLine):
    name = "Course Line"
    name_plural = "Course Lines"
    column_list = [CourseDescriptionLine.id, CourseDescriptionLine.course, CourseDescriptionLine.text]
    form_overrides = {
        "text": TextAreaField,
    }
    form_widget_args = {
        "text": {"rows": 4},
    }


class CoursePageAdmin(ModelView, model=CoursePage):
    name = "Course Page"
    name_plural = "Course Pages"
    column_list = [CoursePage.id, CoursePage.title, CoursePage.course]


class CoursePageCommentAdmin(ModelView, model=CoursePageComment):
    name = "Comment"
    name_plural = "Comments"
    column_list = [CoursePageComment.id, CoursePageComment.course_page, CoursePageComment.author, CoursePageComment.text]
    form_overrides = {
        "text": TextAreaField,
    }
    form_widget_args = {
        "text": {"rows": 6},
    }


class CoursePageCommentReviewAdmin(ModelView, model=CoursePageCommentReview):
    name = "Comment Review"
    name_plural = "Comment Reviews"
    column_list = [CoursePageCommentReview.id, CoursePageCommentReview.comment, CoursePageCommentReview.author, CoursePageCommentReview.is_like]


class ClassroomAdmin(ModelView, model=Classroom):
    name = "Classroom"
    name_plural = "Classrooms"
    column_list = [Classroom.id, Classroom.owner]


def setup_admin(app) -> None:
    admin = Admin(app, engine=async_engine, authentication_backend=AdminAuth(secret_key=str(settings.SECRET_KEY)))
    admin.add_view(UserAdmin)
    admin.add_view(LanguageAdmin)
    admin.add_view(CategoryAdmin)
    admin.add_view(SubcategoryAdmin)
    admin.add_view(MetaCategoryAdmin)
    admin.add_view(CourseAdmin)
    admin.add_view(CourseDescriptionBlockAdmin)
    admin.add_view(CourseDescriptionLineAdmin)
    admin.add_view(CoursePageAdmin)
    admin.add_view(CoursePageCommentAdmin)
    admin.add_view(CoursePageCommentReviewAdmin)
    admin.add_view(ClassroomAdmin)


