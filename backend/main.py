from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import select

from app.database import engine, AsyncSessionLocal
from app.models.models import Base, AdminUser
from app.auth import hash_password
from app.config import settings
from app.routers import auth, groups, teams, players, matches, goals, standings, prof_vs_eleves


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed default admin
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME))
        if not result.scalar_one_or_none():
            admin = AdminUser(
                username=settings.ADMIN_USERNAME,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
            )
            db.add(admin)
            await db.commit()
            print(f"✅  Admin créé : {settings.ADMIN_USERNAME} / {settings.ADMIN_PASSWORD}")
    yield


app = FastAPI(title="Tournament Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(goals.router)
app.include_router(standings.router)
app.include_router(prof_vs_eleves.router)


@app.get("/")
async def root():
    return {"message": "Tournament Manager API", "docs": "/docs"}
