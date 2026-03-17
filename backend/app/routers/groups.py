from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Group, AdminUser
from app.schemas.schemas import GroupCreate, GroupOut
from app.auth import get_current_admin
from typing import List

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("", response_model=List[GroupOut])
async def list_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).order_by(Group.name))
    return result.scalars().all()


@router.post("", response_model=GroupOut)
async def create_group(
    data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    group = Group(name=data.name)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@router.delete("/{group_id}")
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Poule introuvable")
    await db.delete(group)
    await db.commit()
    return {"ok": True}
