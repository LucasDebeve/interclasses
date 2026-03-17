from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import MatchStage


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Group ────────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str

class GroupOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


# ── Team ─────────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    short_name: str
    logo_url: Optional[str] = None
    is_mixed: bool = False
    group_id: Optional[int] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    logo_url: Optional[str] = None
    is_mixed: Optional[bool] = None
    group_id: Optional[int] = None

class TeamOut(BaseModel):
    id: int
    name: str
    short_name: str
    logo_url: Optional[str]
    is_mixed: bool
    group_id: Optional[int]
    model_config = {"from_attributes": True}


# ── Player ───────────────────────────────────────────────────────────────────

class PlayerCreate(BaseModel):
    name: str
    number: Optional[int] = None
    team_id: int

class PlayerOut(BaseModel):
    id: int
    name: str
    number: Optional[int]
    team_id: int
    team_name: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Match ────────────────────────────────────────────────────────────────────

class MatchCreate(BaseModel):
    home_team_id: int
    away_team_id: int
    match_date: Optional[datetime] = None
    week: Optional[int] = None
    stage: MatchStage = MatchStage.GROUP
    group_id: Optional[int] = None
    location: Optional[str] = None

class MatchUpdate(BaseModel):
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: Optional[datetime] = None
    week: Optional[int] = None
    played: Optional[bool] = None
    location: Optional[str] = None

class MatchOut(BaseModel):
    id: int
    home_team_id: int
    away_team_id: int
    home_team_name: Optional[str] = None
    away_team_name: Optional[str] = None
    home_team_short: Optional[str] = None
    away_team_short: Optional[str] = None
    home_score: Optional[int]
    away_score: Optional[int]
    match_date: Optional[datetime]
    week: Optional[int]
    stage: MatchStage
    group_id: Optional[int]
    group_name: Optional[str] = None
    played: bool
    location: Optional[str]
    model_config = {"from_attributes": True}


# ── Goal ─────────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    match_id: int
    scorer_id: int
    minute: Optional[int] = None
    is_own_goal: bool = False
    is_penalty: bool = False

class GoalOut(BaseModel):
    id: int
    match_id: int
    scorer_id: int
    scorer_name: Optional[str] = None
    team_name: Optional[str] = None
    minute: Optional[int]
    is_own_goal: bool
    is_penalty: bool
    model_config = {"from_attributes": True}


# ── Standings ─────────────────────────────────────────────────────────────────

class TeamStanding(BaseModel):
    team_id: int
    team_name: str
    team_short: str
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int

class GroupStanding(BaseModel):
    group_id: int
    group_name: str
    standings: List[TeamStanding]


# ── Top Scorers ───────────────────────────────────────────────────────────────

class TopScorer(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    team_short: str
    goals: int
    penalties: int


# ── Prof Vs Eleves ───────────────────────────────────────────────────────────

class ProfPlayer(BaseModel):
    number: int
    name: str
    role: str
    x: float
    y: float


class ProfVsElevesConfigUpdate(BaseModel):
    profs: List[ProfPlayer]
    substitutes: List[str]


class ProfVsElevesConfigOut(BaseModel):
    profs: List[ProfPlayer]
    substitutes: List[str]
    updated_at: Optional[datetime] = None
