import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.api.deps import AsyncSessionDep, CurrentUser

router = APIRouter(prefix="/content", tags=["content"])

# Универсальная директория для всех изображений контента
CONTENT_IMAGES_DIR = Path("app/static/content_images")


@router.post("/upload-image")
async def upload_content_image(
    file: UploadFile = File(...),
    session: AsyncSessionDep = None,
    current_user: CurrentUser = None,
) -> Any:
    """
    Универсальный endpoint для загрузки изображений в контент.
    Используется для всех редакторов: шаги уроков, описания курсов и т.д.
    """
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="File must be an image (JPEG, PNG, WebP, GIF)"
        )

    # Проверяем размер файла (максимум 5 МБ)
    file.file.seek(0, 2)  # Перемещаемся в конец файла
    file_size = file.file.tell()  # Получаем размер
    file.file.seek(0)  # Возвращаемся в начало

    if file_size > 5 * 1024 * 1024:  # 5 MB
        raise HTTPException(status_code=400, detail="File size must not exceed 5 MB")

    # Создаем директорию, если её нет
    CONTENT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{current_user.id}_{uuid4().hex}{file_extension}"
    file_path = CONTENT_IMAGES_DIR / unique_filename

    # Сохраняем файл
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Возвращаем относительный путь
    relative_path = f"/static/content_images/{unique_filename}"
    return {"url": relative_path}


@router.delete("/delete-image")
async def delete_content_image(
    image_url: str,
    session: AsyncSessionDep = None,
    current_user: CurrentUser = None,
) -> Any:
    """
    Универсальный endpoint для удаления изображений из контента.
    """
    # Извлекаем имя файла из URL
    if image_url.startswith("/static/content_images/"):
        filename = image_url.replace("/static/content_images/", "")
        file_path = CONTENT_IMAGES_DIR / filename

        # Проверяем, что файл принадлежит текущему пользователю (опционально)
        # или что пользователь имеет права на удаление
        if file_path.exists():
            # Проверяем, что файл начинается с ID пользователя
            if filename.startswith(str(current_user.id) + "_"):
                file_path.unlink()
                return {"ok": True}
            else:
                # Можно добавить дополнительную проверку прав
                raise HTTPException(
                    status_code=403,
                    detail="You don't have permission to delete this image",
                )

    raise HTTPException(status_code=404, detail="Image not found")
