import re
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from app.api.utils import detect_image_ext_by_magic
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import col, func, select

from app import crud
from app.api.deps import (
    AsyncSessionDep,
    CurrentUser,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Course,
    Message,
    SetLanguage,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


_RE_WEBSITE = re.compile(r"^https?://[^\s]+$")
_RE_TELEGRAM = re.compile(r"^https?://t\.me/[^\s]+$")
_RE_GITHUB = re.compile(r"^https?://(?:www\.)?github\.com/[^\s]+$")
_RE_YOUTUBE = re.compile(
    r"^https?://(?:www\.)?(?:youtube\.com/[^\s]+|youtu\.be/[^\s]+)$"
)


def _validate_social_links(payload: dict) -> None:
    website = payload.get("website_url")
    telegram = payload.get("telegram_url")
    github = payload.get("github_url")
    youtube = payload.get("youtube_url")

    def _has_value(v: str | None) -> bool:
        return bool(v and v.strip())

    if _has_value(website):
        website = website.strip()
        if not _RE_WEBSITE.fullmatch(website):
            raise HTTPException(
                status_code=422,
                detail="website_url must start with http:// or https://",
            )
    if _has_value(telegram):
        telegram = telegram.strip()
        if not _RE_TELEGRAM.fullmatch(telegram):
            raise HTTPException(
                status_code=422, detail="telegram_url must start with https://t.me/"
            )
    if _has_value(github):
        github = github.strip()
        if not _RE_GITHUB.fullmatch(github):
            raise HTTPException(
                status_code=422, detail="github_url must start with https://github.com/"
            )
    if _has_value(youtube):
        youtube = youtube.strip()
        if not _RE_YOUTUBE.fullmatch(youtube):
            raise HTTPException(
                status_code=422,
                detail="youtube_url must start with https://youtube.com/ or https://youtu.be/",
            )


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
async def read_users(session: AsyncSessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """

    count_statement = select(func.count()).select_from(User)
    count = (await session.exec(count_statement)).one()

    statement = select(User).offset(skip).limit(limit)
    users = (await session.exec(statement)).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
async def create_user(*, session: AsyncSessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = await crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = await crud.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, session: AsyncSessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = await crud.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    _validate_social_links(user_data)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, session: AsyncSessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    await session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser, session: AsyncSessionDep) -> Any:
    """
    Get current user.
    """
    # compute authored courses count
    count_statement = (
        select(func.count())
        .select_from(Course)
        .where(col(Course.author_id) == current_user.id)
    )
    courses_count = (await session.exec(count_statement)).one()
    data = current_user.model_dump()
    data["courses_count"] = courses_count
    return UserPublic(**data)


@router.post("/me/language", response_model=UserPublic)
async def set_language_me(
    *, session: AsyncSessionDep, body: SetLanguage, current_user: CurrentUser
) -> Any:
    """
    Set own language by id or code. Pass either language_id or code. Pass null to unset.
    """
    from app.models import Language

    if body.language_id is None and body.code is None:
        current_user.language_id = None
    elif body.language_id is not None:
        lang = await session.get(Language, body.language_id)
        if not lang:
            raise HTTPException(status_code=404, detail="Language not found")
        current_user.language_id = lang.id
    elif body.code is not None:
        lang = (
            await session.exec(select(Language).where(col(Language.code) == body.code))
        ).first()
        if not lang:
            raise HTTPException(status_code=404, detail="Language not found")
        current_user.language_id = lang.id
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.delete("/me", response_model=Message)
async def delete_user_me(session: AsyncSessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    await session.delete(current_user)
    await session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
async def register_user(session: AsyncSessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = await crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = await crud.create_user(session=session, user_create=user_create)
    return user


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: UUID, session: AsyncSessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    count_statement = (
        select(func.count()).select_from(Course).where(col(Course.author_id) == user_id)
    )
    courses_count = (await session.exec(count_statement)).one()
    data = user.model_dump()
    data["courses_count"] = courses_count
    return UserPublic(**data)


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
async def update_user(
    *, session: AsyncSessionDep, user_id: UUID, user_in: UserUpdate
) -> Any:
    """
    Update a user.
    """

    db_user = await session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = await crud.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = await crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
async def delete_user(
    session: AsyncSessionDep, current_user: CurrentUser, user_id: UUID
) -> Message:
    """
    Delete a user.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    await session.delete(user)
    await session.commit()
    return Message(message="User deleted successfully")


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar_me(
    *, session: AsyncSessionDep, current_user: CurrentUser, file: UploadFile = File(...)
) -> Any:
    """
    Upload and set current user's avatar. Accepts image/jpeg, image/png, image/webp.
    Returns updated user.
    """
    content_type = file.content_type or ""
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    avatars_dir = Path("app/static/avatars")
    avatars_dir.mkdir(parents=True, exist_ok=True)
    ext = allowed[content_type]
    filename = f"{current_user.id}_{uuid4().hex}.{ext}"
    filepath = avatars_dir / filename

    data = await file.read()
    if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    magic_ext = detect_image_ext_by_magic(data)
    if magic_ext is None or magic_ext != allowed[content_type]:
        raise HTTPException(status_code=400, detail="Invalid image data")
    filepath.write_bytes(data)

    # Remove previous local avatar file if exists under /static/avatars
    if current_user.avatar_image and current_user.avatar_image.startswith(
        "/static/avatars/"
    ):
        try:
            old_path = Path("app") / current_user.avatar_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    current_user.avatar_image = f"/static/avatars/{filename}"
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserPublic)
async def delete_avatar_me(
    *, session: AsyncSessionDep, current_user: CurrentUser
) -> Any:
    """
    Delete current user's avatar.
    """
    if current_user.avatar_image and current_user.avatar_image.startswith(
        "/static/avatars/"
    ):
        try:
            old_path = Path("app") / current_user.avatar_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    current_user.avatar_image = None
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.post("/me/cover", response_model=UserPublic)
async def upload_cover_me(
    *, session: AsyncSessionDep, current_user: CurrentUser, file: UploadFile = File(...)
) -> Any:
    """
    Upload and set current user's cover image. Accepts image/jpeg, image/png, image/webp.
    Returns updated user.
    """

    content_type = file.content_type or ""
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    covers_dir = Path("app/static/covers")
    covers_dir.mkdir(parents=True, exist_ok=True)
    ext = allowed[content_type]
    filename = f"{current_user.id}_{uuid4().hex}.{ext}"
    filepath = covers_dir / filename

    data = await file.read()
    if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    magic_ext = detect_image_ext_by_magic(data)
    if magic_ext is None or magic_ext != allowed[content_type]:
        raise HTTPException(status_code=400, detail="Invalid image data")
    filepath.write_bytes(data)

    # Remove previous local cover file if exists under /static/covers
    if current_user.cover_image and current_user.cover_image.startswith(
        "/static/covers/"
    ):
        try:
            old_path = Path("app") / current_user.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    current_user.cover_image = f"/static/covers/{filename}"
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.delete("/me/cover", response_model=UserPublic)
async def delete_cover_me(
    *, session: AsyncSessionDep, current_user: CurrentUser
) -> Any:
    """
    Delete current user's cover image.
    """
    if current_user.cover_image and current_user.cover_image.startswith(
        "/static/covers/"
    ):
        try:
            old_path = Path("app") / current_user.cover_image.lstrip("/")
            if old_path.exists():
                old_path.unlink()
        except Exception:
            pass

    current_user.cover_image = None
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user
