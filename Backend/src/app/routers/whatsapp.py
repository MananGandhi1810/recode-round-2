import json
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from typing import List
from pydantic import BaseModel
from app.services.whatsapp_service import handle_whatsapp_message, start_form_session
from app.dependencies import get_current_user
from app.schemas.auth import AuthUser
from app.core.config import settings  # Import settings

router = APIRouter()


class SendFormByWhatsappRequest(BaseModel):
    phone_numbers: List[str]


@router.post("/forms/{form_id}/send-whatsapp", status_code=status.HTTP_202_ACCEPTED)
async def send_form_by_whatsapp(
    form_id: str,
    request: SendFormByWhatsappRequest,
    current_user: AuthUser = Depends(get_current_user),  # Requires authentication
):
    """
    Initiates sending a form to a list of phone numbers via WhatsApp.
    """
    await start_form_session(form_id, request.phone_numbers)
    return {"message": "Form sending initiated successfully."}


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    try:
        json_body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload."
        )

    if json_body.get("event") == "message":
        await handle_whatsapp_message(json_body)

    return Response(status_code=200)
