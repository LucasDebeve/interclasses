from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.models import Goal, Player, AdminUser
from app.schemas.schemas import GoalCreate, GoalOut
from app.auth import get_current_admin
from typing import List, Optional

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _to_out(g: Goal) -> GoalOut:
    return GoalOut(
        id=g.id,
        match_id=g.match_id,
        scorer_id=g.scorer_id,
        scorer_name=g.scorer.name if g.scorer else None,
        team_name=g.scorer.team.name if g.scorer and g.scorer.team else None,
        minute=g.minute,
        is_own_goal=g.is_own_goal,
        is_penalty=g.is_penalty,
    )


@router.get("", response_model=List[GoalOut])
async def list_goals(match_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    q = (
        select(Goal)
        .options(selectinload(Goal.scorer).selectinload(Player.team))
        .order_by(Goal.minute)
    )
    if match_id:
        q = q.where(Goal.match_id == match_id)
    result = await db.execute(q)
    return [_to_out(g) for g in result.scalars().all()]


@router.post("", response_model=GoalOut)
async def create_goal(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    goal = Goal(**data.model_dump())
    db.add(goal)
    await db.commit()
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.scorer).selectinload(Player.team))
        .where(Goal.id == goal.id)
    )
    return _to_out(result.scalar_one())


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="But introuvable")
    await db.delete(goal)
    await db.commit()
    return {"ok": True}
