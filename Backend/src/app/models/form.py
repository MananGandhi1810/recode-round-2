from typing import List, Optional, TYPE_CHECKING
import uuid
import datetime
from sqlalchemy import String, ForeignKey, DateTime, Boolean, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.organization import Organization
from app.models.user import User

class Form(Base):
    __tablename__ = "forms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Store the latest compiled schema for quick reads
    schema_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="forms")
    events: Mapped[List["FormEvent"]] = relationship("FormEvent", back_populates="form", cascade="all, delete-orphan", order_by="FormEvent.version")


class FormEvent(Base):
    __tablename__ = "form_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Who made the change
    
    # Logical Version for ordering events sequentially
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # E.g., 'ADD_FIELD', 'REMOVE_FIELD', 'UPDATE_FIELD', 'UPDATE_SETTINGS'
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # The actual payload of the change (e.g. {"fieldId": "x", "newConfig": {...}})
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    form: Mapped["Form"] = relationship("Form", back_populates="events")
    user: Mapped["User"] = relationship("User")
