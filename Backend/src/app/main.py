from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import organization, user  # noqa: F401
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.organizations import router as organizations_router
from app.routers.forms import router as forms_router

app = FastAPI(title="Workspace Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(
    organizations_router, prefix="/organizations", tags=["organizations"]
)
app.include_router(forms_router, prefix="/forms", tags=["forms"])


@app.on_event("startup")
async def startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
