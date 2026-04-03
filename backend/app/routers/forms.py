import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies import get_current_user
from app.services.form_service import FormService
from app.services.websocket_manager import manager
from app.schemas.form import FormResponse, FormCreate, FormEventCreate

router = APIRouter(prefix="/forms", tags=["Forms"])

@router.post("/organization/{org_id}", response_model=FormResponse)
async def create_form(org_id: uuid.UUID, form_in: FormCreate, db: AsyncSession = Depends(get_db)):
    # You might want logic to verify user is a member of this org
    new_form = await FormService.create_form(db=db, org_id=org_id, form_in=form_in)
    return new_form

@router.get("/organization/{org_id}", response_model=List[FormResponse])
async def list_org_forms(org_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await FormService.get_org_forms(db=db, org_id=org_id)

@router.get("/{form_id}", response_model=FormResponse)
async def get_form(form_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    form = await FormService.get_form(db=db, form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    return form

@router.websocket("/{form_id}/ws")
async def websocket_endpoint(websocket: WebSocket, form_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # You could inject get_current_user_ws to parse auth tokens over WS header here if you like
    # and restrict connections to org members only
    token = websocket.query_params.get("token")
    user = None # Auth resolution to be injected properly based on token later
    
    str_form_id = str(form_id)
    await manager.connect(str_form_id, websocket)
    
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
                        user_id=user.id if user else None, 
                        event_in=form_event
                    )
                    # Broadcast the successful event to all OTHER clients so they update UI
                    # We broadcast the specific event so they don't have to pull the entire new snapshot
                    await manager.broadcast_to_form(
                        str_form_id, 
                        {"type": "EVENT_APPLIED", "formEvent": event_data},
                        exclude=websocket
                    )
                except Exception as e:
                    # In case of validation or processing error, we might optionally notify the sender
                    await websocket.send_json({"type": "ERROR", "message": str(e)})

            elif data.get("type") == "CURSOR":
                # Real-time multi-cursor position update. Doesn't get saved, just broadcasted rapidly.
                await manager.broadcast_to_form(
                    str_form_id, 
                    {"type": "CURSOR_UPDATE", "cursor": data.get("cursor")},
                    exclude=websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(str_form_id, websocket)
        if user:
            await manager.broadcast_to_form(
                str_form_id, 
                {"type": "CURSOR_LEAVE", "userId": str(user.id)}
            )
