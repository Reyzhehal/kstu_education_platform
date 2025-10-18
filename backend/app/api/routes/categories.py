from typing import Any
from uuid import UUID

from fastapi import APIRouter
from sqlmodel import col, func, select

from app.api.deps import AsyncSessionDep, CurrentUser
from app.models import (
    CategoriesPublic,
    Category,
    MetaCategoriesWithChildrenPublic,
    MetaCategory,
    MetaCategoryWithSubcategoriesPublic,
    Subcategory,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=CategoriesPublic)
async def read_categories(
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    count_statement = select(func.count()).select_from(Category)
    count = (await session.exec(count_statement)).one()
    statement = select(Category).offset(skip).limit(limit)
    categories = (await session.exec(statement)).all()
    return CategoriesPublic(data=categories, count=count)



@router.get("/{category_id}/meta-categories", response_model=MetaCategoriesWithChildrenPublic)
async def read_meta_categories_by_category(
    category_id: UUID,
    session: AsyncSessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    meta_stmt_count = (
        select(func.count()).select_from(MetaCategory).where(col(MetaCategory.category_id) == category_id)
    )
    meta_count = (await session.exec(meta_stmt_count)).one()

    meta_stmt = (
        select(MetaCategory).where(col(MetaCategory.category_id) == category_id).offset(skip).limit(limit)
    )
    meta_categories = (await session.exec(meta_stmt)).all()

    # fetch subcategories for each meta category
    result: list[MetaCategoryWithSubcategoriesPublic] = []
    for mc in meta_categories:
        sub_stmt = (
            select(Subcategory)
            .where(col(Subcategory.meta_category_id) == mc.id)
            .order_by(col(Subcategory.name))
        )
        children = (await session.exec(sub_stmt)).all()
        result.append(
            MetaCategoryWithSubcategoriesPublic(
                id=mc.id, name=mc.name, category_id=mc.category_id, subcategories=children
            )
        )

    return MetaCategoriesWithChildrenPublic(data=result, count=meta_count)


