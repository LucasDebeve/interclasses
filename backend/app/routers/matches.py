from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.models import Match, Team, Group, AdminUser, MatchStage
from app.schemas.schemas import MatchCreate, MatchUpdate, MatchOut
from app.auth import get_current_admin
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/matches", tags=["matches"])


class BulkImportRequest(BaseModel):
    data: str  # CSV format: "TEAM_A, TEAM_B, GROUP_NAME, WEEK, DATE"


def _to_out(m: Match) -> MatchOut:
    return MatchOut(
        id=m.id,
        home_team_id=m.home_team_id,
        away_team_id=m.away_team_id,
        home_team_name=m.home_team.name if m.home_team else None,
        away_team_name=m.away_team.name if m.away_team else None,
        home_team_short=m.home_team.short_name if m.home_team else None,
        away_team_short=m.away_team.short_name if m.away_team else None,
        home_score=m.home_score,
        away_score=m.away_score,
        match_date=m.match_date,
        week=m.week,
        stage=m.stage,
        group_id=m.group_id,
        group_name=m.group.name if m.group else None,
        played=m.played,
        location=m.location,
    )


def _load_options():
    return [
        selectinload(Match.home_team),
        selectinload(Match.away_team),
        selectinload(Match.group),
    ]


@router.get("", response_model=List[MatchOut])
async def list_matches(
    team_id: Optional[int] = None,
    week: Optional[int] = None,
    stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Match).options(*_load_options()).order_by(Match.match_date, Match.id)
    if team_id:
        q = q.where((Match.home_team_id == team_id) | (Match.away_team_id == team_id))
    if week is not None:
        q = q.where(Match.week == week)
    if stage:
        q = q.where(Match.stage == stage)
    result = await db.execute(q)
    return [_to_out(m) for m in result.scalars().all()]


@router.post("", response_model=MatchOut)
async def create_match(
    data: MatchCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    match = Match(**data.model_dump())
    db.add(match)
    await db.commit()
    result = await db.execute(
        select(Match).options(*_load_options()).where(Match.id == match.id)
    )
    return _to_out(result.scalar_one())


@router.put("/{match_id}", response_model=MatchOut)
async def update_match(
    match_id: int,
    data: MatchUpdate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(
        select(Match).options(*_load_options()).where(Match.id == match_id)
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match introuvable")

    incoming = data.model_dump(exclude_unset=True)
    next_home_id = incoming.get("home_team_id", match.home_team_id)
    next_away_id = incoming.get("away_team_id", match.away_team_id)
    if next_home_id == next_away_id:
        raise HTTPException(status_code=400, detail="Les deux equipes doivent etre differentes")

    for field, value in incoming.items():
        setattr(match, field, value)
    # Auto-mark as played if both scores are set
    if match.home_score is not None and match.away_score is not None:
        match.played = True
    await db.commit()
    result = await db.execute(
        select(Match).options(*_load_options()).where(Match.id == match_id)
    )
    return _to_out(result.scalar_one())


@router.delete("/{match_id}")
async def delete_match(
    match_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match introuvable")
    await db.delete(match)
    await db.commit()
    return {"ok": True}


@router.post("/bulk/import", response_model=dict)
async def bulk_import_matches(
    request: BulkImportRequest,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """
    Import multiple matches from CSV format.
    Format: TEAM_A, TEAM_B, GROUP_NAME, WEEK, DATE
    Date format: YYYY-MM-DD or DD/MM/YYYY
    Default time: 12:05
    Default stage: group
    """
    lines = request.data.strip().split('\n')
    created = 0
    errors = []
    
    for line_no, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
        
        try:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) != 5:
                errors.append(f"Ligne {line_no}: format invalide (5 champs attendus)")
                continue
            
            team_a_name, team_b_name, group_name, week_str, date_str = parts
            
            # Parse teams
            team_a_result = await db.execute(
                select(Team).where(Team.name == team_a_name)
            )
            team_a = team_a_result.scalar_one_or_none()
            if not team_a:
                errors.append(f"Ligne {line_no}: équipe '{team_a_name}' introuvable")
                continue
            
            team_b_result = await db.execute(
                select(Team).where(Team.name == team_b_name)
            )
            team_b = team_b_result.scalar_one_or_none()
            if not team_b:
                errors.append(f"Ligne {line_no}: équipe '{team_b_name}' introuvable")
                continue
            
            # Parse group
            group_result = await db.execute(
                select(Group).where(Group.name == group_name)
            )
            group = group_result.scalar_one_or_none()
            if not group:
                errors.append(f"Ligne {line_no}: poule '{group_name}' introuvable")
                continue
            
            # Parse week
            try:
                week = int(week_str)
            except ValueError:
                errors.append(f"Ligne {line_no}: journée invalide")
                continue
            
            # Parse date - try YYYY-MM-DD first, then DD/MM/YYYY
            try:
                if len(date_str) == 10 and date_str[4] == '-':
                    # YYYY-MM-DD format
                    match_date = datetime.strptime(f"{date_str} 12:05", "%Y-%m-%d %H:%M")
                elif len(date_str) == 10 and date_str[2] == '/':
                    # DD/MM/YYYY format
                    match_date = datetime.strptime(f"{date_str} 12:05", "%d/%m/%Y %H:%M")
                else:
                    errors.append(f"Ligne {line_no}: format de date invalide (attendu YYYY-MM-DD ou DD/MM/YYYY)")
                    continue
            except ValueError:
                errors.append(f"Ligne {line_no}: date invalide: {date_str}")
                continue
            
            # Create match
            match = Match(
                home_team_id=team_a.id,
                away_team_id=team_b.id,
                group_id=group.id,
                week=week,
                stage=MatchStage.GROUP,
                match_date=match_date,
                played=False
            )
            db.add(match)
            created += 1
        
        except Exception as e:
            errors.append(f"Ligne {line_no}: {str(e)}")
    
    await db.commit()
    
    return {
        "created": created,
        "errors": errors,
        "total_lines": len([l for l in lines if l.strip()])
    }
