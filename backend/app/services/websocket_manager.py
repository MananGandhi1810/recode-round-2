import uuid
from typing import Dict, List
from fastapi import WebSocket

class FormConnectionManager:
    def __init__(self):
        # A dictionary mapping a Form ID to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, form_id: str, websocket: WebSocket):
        await websocket.accept()
        if form_id not in self.active_connections:
            self.active_connections[form_id] = []
        self.active_connections[form_id].append(websocket)
        print(f"Connected to form: {form_id}. Total: {len(self.active_connections[form_id])}")

    def disconnect(self, form_id: str, websocket: WebSocket):
        if form_id in self.active_connections:
            self.active_connections[form_id].remove(websocket)
            if not self.active_connections[form_id]:
                del self.active_connections[form_id]
            print(f"Disconnected from form: {form_id}.")

    async def broadcast_to_form(self, form_id: str, message: dict, exclude: WebSocket = None):
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
