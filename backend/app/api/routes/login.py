from datetime import datetime, timedelta
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app import crud
from app.api.deps import AsyncSessionDep, CurrentUser, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash, decode_token
from app.models import Message, NewPassword, RefreshToken, Token, UserPublic
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
async def login_access_token(
    session: AsyncSessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access and refresh token for future requests
    """
    user = await crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Создаём access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    # Создаём refresh token
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token_id = str(uuid4())
    refresh_token = security.create_refresh_token(
        user.id, expires_delta=refresh_token_expires, jti=token_id
    )

    # Сохраняем refresh token в БД
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token_id=token_id,
        expires_at=datetime.utcnow() + refresh_token_expires,
    )
    session.add(db_refresh_token)
    await session.commit()

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/login/refresh-token")
async def refresh_access_token(
    session: AsyncSessionDep,
    refresh_token: str,
) -> Token:
    """
    Обновить access token используя refresh token
    """
    # Декодируем refresh token
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Проверяем тип токена
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    token_id = payload.get("jti")
    user_id = payload.get("sub")

    if not token_id or not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Проверяем существование refresh токена в БД
    stmt = select(RefreshToken).where(
        RefreshToken.token_id == token_id, RefreshToken.revoked == False
    )
    db_token = (await session.exec(stmt)).first()

    if not db_token:
        raise HTTPException(
            status_code=401, detail="Refresh token not found or revoked"
        )

    # Проверяем, не истёк ли токен
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # Создаём новый access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user_id, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/login/revoke-token")
async def revoke_refresh_token(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    refresh_token: str,
) -> Message:
    """
    Отозвать (revoke) refresh token (например, при logout)
    """
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    token_id = payload.get("jti")
    if not token_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Находим токен в БД
    stmt = select(RefreshToken).where(
        RefreshToken.token_id == token_id, RefreshToken.user_id == current_user.id
    )
    db_token = (await session.exec(stmt)).first()

    if db_token:
        db_token.revoked = True
        session.add(db_token)
        await session.commit()

    return Message(message="Refresh token revoked")


@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
async def recover_password(email: str, session: AsyncSessionDep) -> Message:
    """
    Password Recovery
    """
    user = await crud.get_user_by_email(session=session, email=email)
    if user:
        try:
            password_reset_token = generate_password_reset_token(email=email)
            email_data = generate_reset_password_email(
                email_to=user.email, email=email, token=password_reset_token
            )
            send_email(
                email_to=user.email,
                subject=email_data.subject,
                html_content=email_data.html_content,
            )
        except Exception:
            pass
    return Message(message="If the email exists, a recovery message was sent")


@router.post("/reset-password/")
async def reset_password(session: AsyncSessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = await crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    await session.commit()
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
async def recover_password_html_content(email: str, session: AsyncSessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = await crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject": email_data.subject}
    )
