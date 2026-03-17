from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.models import Player, Team, AdminUser
from app.schemas.schemas import PlayerCreate, PlayerOut
from app.auth import get_current_admin
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/players", tags=["players"])


class BulkImportRequest(BaseModel):
    data: str  # CSV format: "TEAM_NAME, PLAYER_NAME, PLAYER_NUMBER"\n...


def _to_out(p: Player) -> PlayerOut:
    return PlayerOut(
        id=p.id,
        name=p.name,
        number=p.number,
        team_id=p.team_id,
        team_name=p.team.name if p.team else None,
    )


@router.get("", response_model=List[PlayerOut])
async def list_players(team_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    q = select(Player).options(selectinload(Player.team)).order_by(Player.name)
    if team_id:
        q = q.where(Player.team_id == team_id)
    result = await db.execute(q)
    return [_to_out(p) for p in result.scalars().all()]


@router.post("", response_model=PlayerOut)
async def create_player(
    data: PlayerCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    player = Player(**data.model_dump())
    db.add(player)
    await db.commit()
    result = await db.execute(
        select(Player).options(selectinload(Player.team)).where(Player.id == player.id)
    )
    return _to_out(result.scalar_one())


@router.delete("/{player_id}")
async def delete_player(
    player_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable")
    await db.delete(player)
    await db.commit()
    return {"ok": True}


@router.post("/bulk/import", response_model=dict)
async def bulk_import_players(
    request: BulkImportRequest,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """
    Import multiple players from CSV format.
    Format: TEAM_NAME, PLAYER_NAME, PLAYER_NUMBER
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
            if len(parts) != 3:
                errors.append(f"Ligne {line_no}: format invalide (3 champs attendus)")
                continue
            
            team_name, player_name, player_number = parts
            
            # Find team by name
            team_result = await db.execute(
                select(Team).where(Team.name == team_name)
            )
            team = team_result.scalar_one_or_none()
            if not team:
                errors.append(f"Ligne {line_no}: équipe '{team_name}' introuvable")
                continue
            
            # Parse number
            try:
                number = int(player_number) if player_number else None
            except ValueError:
                errors.append(f"Ligne {line_no}: numéro de joueur invalide")
                continue
            
            # Create player
            player = Player(name=player_name, number=number, team_id=team.id)
            db.add(player)
            created += 1
        
        except Exception as e:
            errors.append(f"Ligne {line_no}: {str(e)}")
    
    await db.commit()
    
    return {
        "created": created,
        "errors": errors,
        "total_lines": len([l for l in lines if l.strip()])
    }
