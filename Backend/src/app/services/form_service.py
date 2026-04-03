import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.form import Form, FormEvent
from app.schemas.form import FormCreate, FormUpdate, FormEventCreate

class FormService:
    @staticmethod
    async def create_form(db: AsyncSession, org_id: uuid.UUID, form_in: FormCreate) -> Form:
        new_form = Form(
            organization_id=org_id,
            name=form_in.name,
            description=form_in.description,
            schema_snapshot={"blocks": []} # initial empty schema
        )
        db.add(new_form)
        await db.commit()
        await db.refresh(new_form)
        return new_form

    @staticmethod
    async def get_form(db: AsyncSession, form_id: uuid.UUID) -> Optional[Form]:
        query = select(Form).where(Form.id == form_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
        
    @staticmethod
    async def get_org_forms(db: AsyncSession, org_id: uuid.UUID) -> List[Form]:
        query = select(Form).where(Form.organization_id == org_id).order_by(Form.updated_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    def _apply_event_to_snapshot(snapshot: Dict[str, Any], event: FormEventCreate) -> Dict[str, Any]:
        """
        Pure function to apply an event to a snapshot to compute the next state.
        This enables Event Sourcing and rebuilding state from history if necessary.
        """
        # Ensure deep copy logic or construct new dict carefully
        blocks = snapshot.get("blocks", []).copy()
        etype = event.event_type
        payload = event.payload
        
        if etype == "ADD_BLOCK":
            # payload: {"block": {...}}
            if "block" in payload:
                blocks.append(payload["block"])
        elif etype == "UPDATE_BLOCK":
            # payload: {"id": "block-id", "block": {...}}
            block_id = payload.get("id")
            for i, b in enumerate(blocks):
                if b.get("id") == block_id:
                    blocks[i] = payload.get("block")
                    break
        elif etype == "REMOVE_BLOCK":
            # payload: {"id": "block-id"}
            block_id = payload.get("id")
            blocks = [b for b in blocks if b.get("id") != block_id]
        elif etype == "REORDER_BLOCKS":
            # payload: {"order": ["id1", "id2", ...]}
            new_order = payload.get("order", [])
            order_map = {bid: i for i, bid in enumerate(new_order)}
            blocks.sort(key=lambda b: order_map.get(b.get("id"), 9999))
        elif etype == "UPDATE_FORM_META":
            # Metadata is persisted on the Form row, not in the snapshot.
            pass
            
        return {"blocks": blocks}

    @staticmethod
    async def process_event(
        db: AsyncSession, 
        form_id: uuid.UUID, 
        user_id: Optional[uuid.UUID], 
        event_in: FormEventCreate
    ) -> Form:
        form = await FormService.get_form(db, form_id)
        if not form:
            raise ValueError("Form not found")

        # Get latest version number
        version_query = select(func.max(FormEvent.version)).where(FormEvent.form_id == form_id)
        version_result = await db.execute(version_query)
        max_version = version_result.scalar_one_or_none() or 0
        new_version = max_version + 1

        # Create new event record
        new_event = FormEvent(
            form_id=form_id,
            user_id=user_id,
            version=new_version,
            event_type=event_in.event_type,
            payload=event_in.payload
        )
        db.add(new_event)

        # Update Form Snapshot
        if event_in.event_type == "UPDATE_FORM_META":
            name = event_in.payload.get("name")
            description = event_in.payload.get("description")
            is_published = event_in.payload.get("is_published")

            if isinstance(name, str):
                form.name = name.strip() or form.name
            if description is None or isinstance(description, str):
                form.description = description
            if isinstance(is_published, bool):
                form.is_published = is_published
        else:
            snapshot = dict(form.schema_snapshot)
            new_snapshot = FormService._apply_event_to_snapshot(snapshot, event_in)
            form.schema_snapshot = new_snapshot
        
        await db.commit()
        await db.refresh(form)
        return form
