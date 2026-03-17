from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.models import Match, Team, Group, Goal, Player, MatchStage
from app.schemas.schemas import GroupStanding, TeamStanding, TopScorer
from typing import List

router = APIRouter(prefix="/api/standings", tags=["standings"])


@router.get("/groups", response_model=List[GroupStanding])
async def group_standings(db: AsyncSession = Depends(get_db)):
    # Load all groups with their teams
    groups_result = await db.execute(
        select(Group).options(selectinload(Group.teams)).order_by(Group.name)
    )
    groups = groups_result.scalars().all()

    # Load all played group-stage matches
    matches_result = await db.execute(
        select(Match)
        .options(selectinload(Match.home_team), selectinload(Match.away_team))
        .where(Match.stage == MatchStage.GROUP, Match.played == True)
    )
    matches = matches_result.scalars().all()

    result = []
    for group in groups:
        stats: dict[int, dict] = {}
        team_is_mixed = {}  # Track which teams are mixed
        for team in group.teams:
            stats[team.id] = {
                "team_id": team.id,
                "team_name": team.name,
                "team_short": team.short_name,
                "played": 0, "won": 0, "drawn": 0, "lost": 0,
                "goals_for": 0, "goals_against": 0,
            }
            team_is_mixed[team.id] = team.is_mixed

        for m in matches:
            if m.group_id != group.id:
                continue
            hs, as_ = m.home_score, m.away_score
            for tid, gf, ga in [
                (m.home_team_id, hs, as_),
                (m.away_team_id, as_, hs),
            ]:
                if tid not in stats:
                    continue
                s = stats[tid]
                s["played"] += 1
                s["goals_for"] += gf
                s["goals_against"] += ga
                if gf > ga:
                    s["won"] += 1
                elif gf == ga:
                    s["drawn"] += 1
                else:
                    s["lost"] += 1

        standings = []
        for s in stats.values():
            gd = s["goals_for"] - s["goals_against"]
            # Apply different points based on is_mixed status
            is_mixed = team_is_mixed[s["team_id"]]
            if is_mixed:
                # Bonus points for mixed teams: 4 for win, 2 for draw, 1 for loss
                pts = s["won"] * 4 + s["drawn"] * 2 + s["lost"]
            else:
                # Normal points: 3 for win, 1 for draw, 0 for loss
                pts = s["won"] * 3 + s["drawn"]
            standings.append(TeamStanding(
                **s,
                goal_difference=gd,
                points=pts,
            ))

        standings.sort(key=lambda x: (-x.points, -x.goal_difference, -x.goals_for))
        result.append(GroupStanding(group_id=group.id, group_name=group.name, standings=standings))

    return result


@router.get("/scorers", response_model=List[TopScorer])
async def top_scorers(db: AsyncSession = Depends(get_db)):
    # Count goals per player (exclude own goals from scorer's tally)
    result = await db.execute(
        select(
            Player.id,
            Player.name,
            Team.name.label("team_name"),
            Team.short_name.label("team_short"),
            func.count(Goal.id).filter(Goal.is_own_goal == False).label("goals"),
            func.count(Goal.id).filter(Goal.is_penalty == True, Goal.is_own_goal == False).label("penalties"),
        )
        .join(Goal, Goal.scorer_id == Player.id)
        .join(Team, Player.team_id == Team.id)
        .where(Goal.is_own_goal == False)
        .group_by(Player.id, Player.name, Team.name, Team.short_name)
        .order_by(func.count(Goal.id).filter(Goal.is_own_goal == False).desc())
    )
    rows = result.all()
    return [
        TopScorer(
            player_id=r.id,
            player_name=r.name,
            team_name=r.team_name,
            team_short=r.team_short,
            goals=r.goals,
            penalties=r.penalties,
        )
        for r in rows
    ]
