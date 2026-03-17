from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Boolean, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class MatchStage(str, enum.Enum):
    GROUP = "group"
    ROUND_OF_16 = "round_of_16"
    QUARTER_FINAL = "quarter_final"
    SEMI_FINAL = "semi_final"
    THIRD_PLACE = "third_place"
    FINAL = "final"


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)  # "Poule A", "Poule B"…

    teams = relationship("Team", back_populates="group")
    matches = relationship("Match", back_populates="group")


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    short_name = Column(String(10), nullable=False)
    logo_url = Column(String(255), nullable=True)
    is_mixed = Column(Boolean, default=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)

    group = relationship("Group", back_populates="teams")
    players = relationship("Player", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")


class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    number = Column(Integer, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    team = relationship("Team", back_populates="players")
    goals = relationship("Goal", back_populates="scorer")


class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    match_date = Column(DateTime, nullable=True)
    week = Column(Integer, nullable=True)   # journée / semaine
    stage = Column(SAEnum(MatchStage), default=MatchStage.GROUP, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    played = Column(Boolean, default=False)
    location = Column(String(200), nullable=True)

    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    group = relationship("Group", back_populates="matches")
    goals = relationship("Goal", back_populates="match", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    scorer_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    minute = Column(Integer, nullable=True)
    is_own_goal = Column(Boolean, default=False)
    is_penalty = Column(Boolean, default=False)

    match = relationship("Match", back_populates="goals")
    scorer = relationship("Player", back_populates="goals")


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProfVsElevesConfig(Base):
    __tablename__ = "prof_vs_eleves_config"
    id = Column(Integer, primary_key=True, index=True)
    profs = Column(JSON, nullable=False)
    substitutes = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
