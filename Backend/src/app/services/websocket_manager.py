from typing import Dict, List
from fastapi import WebSocket


class FormConnectionManager:
    def __init__(self):
        # A dictionary mapping a Form ID to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.presence: Dict[str, Dict[WebSocket, dict]] = {}

    async def connect(self, form_id: str, websocket: WebSocket, user_meta: dict):
        await websocket.accept()
        if form_id not in self.active_connections:
            self.active_connections[form_id] = []
            self.presence[form_id] = {}
        self.active_connections[form_id].append(websocket)
        self.presence[form_id][websocket] = user_meta
        print(
            f"Connected to form: {form_id}. Total: {len(self.active_connections[form_id])}"
        )

    def disconnect(self, form_id: str, websocket: WebSocket) -> dict | None:
        user_meta = None
        if form_id in self.active_connections:
            if websocket in self.presence.get(form_id, {}):
                user_meta = self.presence[form_id].pop(websocket)
            if websocket in self.active_connections[form_id]:
                self.active_connections[form_id].remove(websocket)
            if not self.active_connections[form_id]:
                del self.active_connections[form_id]
                self.presence.pop(form_id, None)
            print(f"Disconnected from form: {form_id}.")
        return user_meta

    def list_presence(self, form_id: str) -> list[dict]:
        return list(self.presence.get(form_id, {}).values())

    async def broadcast_to_form(
        self, form_id: str, message: dict, exclude: WebSocket = None
    ):
        """
        Broadcasts a message to all connected clients viewing this specific form,
        optionally excluding the sender (so they don't apply their own event out of order).
        """
        if form_id in self.active_connections:
            for connection in self.active_connections[form_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Failed to send to a websocket: {e}")


manager = FormConnectionManager()
