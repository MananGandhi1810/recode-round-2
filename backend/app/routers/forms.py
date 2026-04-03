import uuid
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.form import Form
from app.models.organization import OrganizationMember
from app.models.user import User
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


async def _ensure_org_membership(db: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID) -> None:
    query = select(OrganizationMember).where(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == user_id,
    )
    result = await db.execute(query)
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")


async def _get_user_from_websocket(websocket: WebSocket, db: AsyncSession) -> User:
    auth_header = websocket.headers.get("authorization", "")
    bearer_token = auth_header.removeprefix("Bearer ").strip()
    token = websocket.cookies.get("access_token") or websocket.query_params.get("token") or bearer_token
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session payload")

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session payload") from exc

    result = await db.execute(select(User).where(User.id == parsed_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/organization/{org_id}", response_model=FormResponse)
async def create_form(
    org_id: uuid.UUID,
    form_in: FormCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _ensure_org_membership(db, org_id, user.id)
    new_form = await FormService.create_form(db=db, org_id=org_id, form_in=form_in)
    return new_form

@router.get("/organization/{org_id}", response_model=List[FormResponse])
async def list_org_forms(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _ensure_org_membership(db, org_id, user.id)
    return await FormService.get_org_forms(db=db, org_id=org_id)

@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    form = await FormService.get_form(db=db, form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    await _ensure_org_membership(db, form.organization_id, user.id)
    return form


@router.patch("/{form_id}", response_model=FormResponse)
async def update_form_meta(
    form_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    form = await FormService.get_form(db=db, form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    await _ensure_org_membership(db, form.organization_id, user.id)

    event_in = FormEventCreate(event_type="UPDATE_FORM_META", payload=payload)
    return await FormService.process_event(db=db, form_id=form_id, user_id=user.id, event_in=event_in)


@router.post("/{form_id}/events", response_model=FormResponse)
async def apply_form_event(
    form_id: uuid.UUID,
    event_in: FormEventCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    form = await FormService.get_form(db=db, form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")

    await _ensure_org_membership(db, form.organization_id, user.id)
    return await FormService.process_event(db=db, form_id=form_id, user_id=user.id, event_in=event_in)

@router.websocket("/{form_id}/ws")
async def websocket_endpoint(websocket: WebSocket, form_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        user = await _get_user_from_websocket(websocket, db)
    except HTTPException:
        await websocket.close(code=1008)
        return

    form = await FormService.get_form(db=db, form_id=form_id)
    if not form:
        await websocket.close(code=1008)
        return

    try:
        await _ensure_org_membership(db, form.organization_id, user.id)
    except HTTPException:
        await websocket.close(code=1008)
        return

    str_form_id = str(form_id)
    user_meta = {
        "userId": str(user.id),
        "label": _email_initials(user.email),
    }
    await manager.connect(str_form_id, websocket, user_meta=user_meta)
    await websocket.send_json({"type": "PRESENCE_SNAPSHOT", "users": manager.list_presence(str_form_id)})
    await manager.broadcast_to_form(
        str_form_id,
        {"type": "CURSOR_JOIN", "user": user_meta},
        exclude=websocket,
    )
    
    try:
        while True:
            # Client payload format: 
            # {"type": "EVENT", "formEvent": {"event_type": "...", "payload": {...}}}
            # {"type": "CURSOR", "cursor": {"x": 100, "y": 200, "userId": "...", "userName": "..."}}
            data = await websocket.receive_json()
            
            if data.get("type") == "EVENT":
                event_data = data.get("formEvent")
                form_event = FormEventCreate(**event_data)
                
                # Persist event in database to maintain Event Sourcing logic & Snapshot
                try:
                    updated_form = await FormService.process_event(
                        db=db, 
                        form_id=form_id, 
                        user_id=user.id,
                        event_in=form_event
                    )
                    applied_payload = event_data
                    if form_event.event_type == "UPDATE_FORM_META":
                        applied_payload = {
                            "event_type": "UPDATE_FORM_META",
                            "payload": {
                                "name": updated_form.name,
                                "description": updated_form.description,
                                "is_published": updated_form.is_published,
                            },
                        }
                    # Broadcast the successful event to all OTHER clients so they update UI
                    # We broadcast the specific event so they don't have to pull the entire new snapshot
                    await manager.broadcast_to_form(
                        str_form_id, 
                        {
                            "type": "EVENT_APPLIED",
                            "formEvent": applied_payload,
                            "actor": user_meta,
                        },
                        exclude=websocket
                    )
                except Exception as e:
                    # In case of validation or processing error, we might optionally notify the sender
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif data.get("type") == "CURSOR":
                # Real-time multi-cursor position update. Doesn't get saved, just broadcasted rapidly.
                cursor = data.get("cursor", {})
                await manager.broadcast_to_form(
                    str_form_id, 
                    {
                        "type": "CURSOR_UPDATE",
                        "cursor": {
                            **cursor,
                            "userId": user_meta["userId"],
                            "label": user_meta["label"],
                        },
                    },
                    exclude=websocket
                )
    
    except WebSocketDisconnect:
        left_user = manager.disconnect(str_form_id, websocket)
        if left_user:
            await manager.broadcast_to_form(str_form_id, {"type": "CURSOR_LEAVE", "userId": left_user.get("userId")})
