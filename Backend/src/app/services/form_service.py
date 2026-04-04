import uuid
import datetime
from typing import Optional, List, Dict, Any

from app.core.mongodb import get_mongo_db
from app.schemas.form import FormCreate, FormResponse, FormEventCreate

class FormService:
    @staticmethod
    async def create_form(org_id: str, form_in: FormCreate) -> FormResponse:
        db = get_mongo_db()
        form_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow()
        doc = {
            "_id": form_id,
            "organization_id": org_id,
            "name": form_in.name,
            "description": form_in.description,
            "is_published": False,
            "schema_snapshot": {"blocks": []},
            "created_at": now,
            "updated_at": now,
        }
        await db.forms.insert_one(doc)
        return FormService._map_doc_to_response(doc)

    @staticmethod
    async def get_form(form_id: str) -> Optional[FormResponse]:
        db = get_mongo_db()
        doc = await db.forms.find_one({"_id": form_id})
        if not doc:
            return None
        return FormService._map_doc_to_response(doc)

    @staticmethod
    async def get_org_forms(org_id: str) -> List[FormResponse]:
        db = get_mongo_db()
        cursor = db.forms.find({"organization_id": org_id}).sort("updated_at", -1)
        docs = await cursor.to_list(length=100)
        return [FormService._map_doc_to_response(doc) for doc in docs]

    @staticmethod
    def _map_doc_to_response(doc: Dict[str, Any]) -> FormResponse:
        return FormResponse(
            id=uuid.UUID(doc["_id"]),
            organization_id=uuid.UUID(doc["organization_id"]),
            name=doc["name"],
            description=doc.get("description"),
            is_published=doc.get("is_published", False),
            schema_snapshot=doc.get("schema_snapshot", {}),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"]
        )

    @staticmethod
    def _apply_event_to_snapshot(
        snapshot: Dict[str, Any], event: FormEventCreate
    ) -> Dict[str, Any]:
        blocks = snapshot.get("blocks", []).copy()
        etype = event.event_type
        payload = event.payload

        if etype == "ADD_BLOCK":
            if "block" in payload:
                blocks.append(payload["block"])
        elif etype == "UPDATE_BLOCK":
            block_id = payload.get("id")
            for i, b in enumerate(blocks):
                if b.get("id") == block_id:
                    blocks[i] = payload.get("block")
                    break
        elif etype == "REMOVE_BLOCK":
            block_id = payload.get("id")
            blocks = [b for b in blocks if b.get("id") != block_id]
        elif etype == "REORDER_BLOCKS":
            new_order = payload.get("order", [])
            order_map = {bid: i for i, bid in enumerate(new_order)}
            blocks.sort(key=lambda b: order_map.get(b.get("id"), 9999))

        return {"blocks": blocks}

    @staticmethod
    async def process_event(
        form_id: str,
        user_id: Optional[str],
        event_in: FormEventCreate,
    ) -> FormResponse:
        db = get_mongo_db()
        doc = await db.forms.find_one({"_id": form_id})
        if not doc:
            raise ValueError("Form not found")

        now = datetime.datetime.utcnow()
        update_fields = {"updated_at": now}

        if event_in.event_type == "UPDATE_FORM_META":
            name = event_in.payload.get("name")
            description = event_in.payload.get("description")
            is_published = event_in.payload.get("is_published")

            if isinstance(name, str):
                update_fields["name"] = name.strip() or doc["name"]
            if description is None or isinstance(description, str):
                update_fields["description"] = description
            if isinstance(is_published, bool):
                update_fields["is_published"] = is_published
        else:
            snapshot = dict(doc.get("schema_snapshot", {}))
            new_snapshot = FormService._apply_event_to_snapshot(snapshot, event_in)
            update_fields["schema_snapshot"] = new_snapshot

        event_doc = {
            "form_id": form_id,
            "user_id": user_id,
            "event_type": event_in.event_type,
            "payload": event_in.payload,
            "created_at": now
        }
        await db.form_events.insert_one(event_doc)

        updated_doc = await db.forms.find_one_and_update(
            {"_id": form_id},
            {"$set": update_fields},
            return_document=True
        )

        return FormService._map_doc_to_response(updated_doc)
