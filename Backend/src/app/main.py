from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json

from app.core.database import connect_to_db, close_db_connection
from app.core.mongodb import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.forms import router as forms_router
from app.routers.public_forms import router as public_forms_router
from app.routers.health import router as health_router
from app.routers.organizations import router as organizations_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await connect_to_db()
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    await close_db_connection()


app = FastAPI(title="FormBar API", lifespan=lifespan)

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
app.include_router(public_forms_router, prefix="/f", tags=["public_forms"])

# Anonymous Homepage Multiplayer
homepage_connections: list[WebSocket] = []


@app.websocket("/homepage/ws")
async def homepage_ws(websocket: WebSocket):
    await websocket.accept()
    homepage_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast to everyone else
            for conn in homepage_connections:
                if conn != websocket:
                    try:
                        await conn.send_text(data)
                    except:
                        pass
    except WebSocketDisconnect:
        if websocket in homepage_connections:
            homepage_connections.remove(websocket)
    except Exception:
        if websocket in homepage_connections:
            homepage_connections.remove(websocket)
