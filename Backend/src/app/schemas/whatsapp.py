from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid


class WhatsappConversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    phone_number: str
    form_id: str
    current_block_index: int = 0
    partial_answers: Dict[str, Any] = Field(default_factory=dict)
    status: str = "started"  # e.g., "started", "awaiting_answer", "completed", "cancelled"
    device_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "phone_number": "1234567890",
                "form_id": "form123",
                "current_block_index": 0,
                "partial_answers": {},
                "status": "started",
                "device_id": "628123456789@s.whatsapp.net",
                "created_at": "2023-01-01T12:00:00Z",
                "updated_at": "2023-01-01T12:00:00Z",
            }
        }
