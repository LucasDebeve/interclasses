from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin
from app.database import get_db
from app.models.models import AdminUser, ProfVsElevesConfig
from app.schemas.schemas import ProfVsElevesConfigOut, ProfVsElevesConfigUpdate

router = APIRouter(prefix="/api/prof-vs-eleves", tags=["prof-vs-eleves"])

DEFAULT_PROFS = [
    {"number": 1, "name": "?", "role": "Gardien", "x": 50, "y": 92},
    {"number": 3, "name": "?", "role": "Defenseur", "x": 50, "y": 60},
    {"number": 7, "name": "?", "role": "Milieu lateral", "x": 25, "y": 40},
    {"number": 8, "name": "?", "role": "Milieu lateral", "x": 75, "y": 40},
    {"number": 9, "name": "?", "role": "Attaquant", "x": 50, "y": 15},
]

DEFAULT_SUBSTITUTES = ["?"]


def _validate_payload(data: ProfVsElevesConfigUpdate) -> None:
    if len(data.profs) != 5:
        raise HTTPException(status_code=400, detail="La composition des profs doit contenir exactement 5 joueurs")
    for p in data.profs:
        if p.x < 0 or p.x > 100 or p.y < 0 or p.y > 100:
            raise HTTPException(status_code=400, detail="Les coordonnees x/y doivent etre entre 0 et 100")


@router.get("", response_model=ProfVsElevesConfigOut)
async def get_config(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProfVsElevesConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config:
        return ProfVsElevesConfigOut(profs=DEFAULT_PROFS, substitutes=DEFAULT_SUBSTITUTES, updated_at=None)

    return ProfVsElevesConfigOut(
        profs=config.profs,
        substitutes=config.substitutes,
        updated_at=config.updated_at,
    )


@router.put("", response_model=ProfVsElevesConfigOut)
async def update_config(
    data: ProfVsElevesConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    _validate_payload(data)

    result = await db.execute(select(ProfVsElevesConfig).limit(1))
    config = result.scalar_one_or_none()

    if not config:
        config = ProfVsElevesConfig(
            profs=[p.model_dump() for p in data.profs],
            substitutes=data.substitutes,
            updated_at=datetime.utcnow(),
        )
        db.add(config)
    else:
        config.profs = [p.model_dump() for p in data.profs]
        config.substitutes = data.substitutes
        config.updated_at = datetime.utcnow()

    await db.commit()

    return ProfVsElevesConfigOut(
        profs=config.profs,
        substitutes=config.substitutes,
        updated_at=config.updated_at,
    )
