import uuid
import re
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
import asyncpg

from app.core.security import decode_token
from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import AuthUser
from app.services.form_service import FormService
from app.services.websocket_manager import manager
from app.schemas.form import FormResponse, FormCreate, FormEventCreate

router = APIRouter()

def _email_initials(email: str) -> str:
    local = email.split("@", 1)[0]
    chunks = [chunk for chunk in re.split(r"[^a-zA-Z0-9]+", local) if chunk]
    if len(chunks) >= 2:
        return (chunks[0][0] + chunks[1][0]).upper()
    return local[:2].upper() if local else "U"

async def _ensure_org_membership(
    conn: asyncpg.Connection, org_id: str, user_id: str
) -> None:
    row = await conn.fetchrow(
        "SELECT id FROM organization_members WHERE organization_id = $1::uuid AND user_id = $2::uuid",
        org_id, user_id
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )

async def _get_user_from_websocket(websocket: WebSocket, conn: asyncpg.Connection) -> AuthUser:
    auth_header = websocket.headers.get("authorization", "")
    bearer_token = auth_header.removeprefix("Bearer ").strip()
    token = (
        websocket.cookies.get("access_token")
        or websocket.query_params.get("token")
        or bearer_token
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session payload"
        )

    row = await conn.fetchrow("SELECT id, email, full_name FROM users WHERE id = $1::uuid", user_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return AuthUser(id=str(row["id"]), email=row["email"], full_name=row["full_name"])

@router.post("/organization/{org_id}", response_model=FormResponse)
async def create_form(
    org_id: str,
    form_in: FormCreate,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    await _ensure_org_membership(conn, org_id, str(user.id))
    new_form = await FormService.create_form(org_id=org_id, form_in=form_in)
    
    org_row = await conn.fetchrow("SELECT slug FROM organizations WHERE id = $1::uuid", org_id)
    if org_row:
        new_form.organization_slug = org_row["slug"]
        
    return new_form

@router.get("/organization/{org_id}", response_model=List[FormResponse])
async def list_org_forms(
    org_id: str,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    await _ensure_org_membership(conn, org_id, str(user.id))
    forms = await FormService.get_org_forms(org_id=org_id)
    
    org_row = await conn.fetchrow("SELECT slug FROM organizations WHERE id = $1::uuid", org_id)
    if org_row:
        for f in forms:
            f.organization_slug = org_row["slug"]
            
    return forms

@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: str,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    form = await FormService.get_form(form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    await _ensure_org_membership(conn, str(form.organization_id), str(user.id))
    
    org_row = await conn.fetchrow("SELECT slug FROM organizations WHERE id = $1::uuid", form.organization_id)
    if org_row:
        form.organization_slug = org_row["slug"]
        
    return form

@router.patch("/{form_id}", response_model=FormResponse)
async def update_form_meta(
    form_id: str,
    payload: dict,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    form = await FormService.get_form(form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    await _ensure_org_membership(conn, str(form.organization_id), str(user.id))

    event_in = FormEventCreate(event_type="UPDATE_FORM_META", payload=payload)
    return await FormService.process_event(
        form_id=form_id, user_id=str(user.id), event_in=event_in
    )

@router.post("/{form_id}/events", response_model=FormResponse)
async def apply_form_event(
    form_id: str,
    event_in: FormEventCreate,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
):
    form = await FormService.get_form(form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")

    await _ensure_org_membership(conn, str(form.organization_id), str(user.id))
    return await FormService.process_event(
        form_id=form_id, user_id=str(user.id), event_in=event_in
    )

@router.websocket("/{form_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket, form_id: str, conn: asyncpg.Connection = Depends(get_db)
):
    try:
        user = await _get_user_from_websocket(websocket, conn)
    except HTTPException:
        await websocket.close(code=1008)
        return

    form = await FormService.get_form(form_id=form_id)
    if not form:
        await websocket.close(code=1008)
        return

    try:
        await _ensure_org_membership(conn, str(form.organization_id), str(user.id))
    except HTTPException:
        await websocket.close(code=1008)
        return

    user_meta = {
        "userId": str(user.id),
        "label": _email_initials(user.email),
    }
    await manager.connect(form_id, websocket, user_meta=user_meta)
    await websocket.send_json(
        {"type": "PRESENCE_SNAPSHOT", "users": manager.list_presence(form_id)}
    )
    await manager.broadcast_to_form(
        form_id,
        {"type": "CURSOR_JOIN", "user": user_meta},
        exclude=websocket,
    )

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "EVENT":
                event_data = data.get("formEvent")
                form_event = FormEventCreate(**event_data)

                try:
                    updated_form = await FormService.process_event(
                        form_id=form_id, user_id=str(user.id), event_in=form_event
                    )
                    applied_payload = event_data
                    if form_event.event_type == "UPDATE_FORM_META":
                        applied_payload = {
                            "event_type": "UPDATE_FORM_META",
                            "payload": {
                                "name": updated_form.name,
                                "description": updated_form.description,
                                "is_published": updated_form.is_published,
                                "theme": updated_form.theme,
                            },
                        }
                    await manager.broadcast_to_form(
                        form_id,
                        {
                            "type": "EVENT_APPLIED",
                            "formEvent": applied_payload,
                            "actor": user_meta,
                        },
                        exclude=websocket,
                    )
                except Exception as e:
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif data.get("type") == "CURSOR":
                cursor = data.get("cursor", {})
                await manager.broadcast_to_form(
                    form_id,
                    {
                        "type": "CURSOR_UPDATE",
                        "cursor": {
                            **cursor,
                            "userId": user_meta["userId"],
                            "label": user_meta["label"],
                        },
                    },
                    exclude=websocket,
                )

    except WebSocketDisconnect:
        left_user = manager.disconnect(form_id, websocket)
        if left_user:
            await manager.broadcast_to_form(
                form_id, {"type": "CURSOR_LEAVE", "userId": left_user.get("userId")}
            )
