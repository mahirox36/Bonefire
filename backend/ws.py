from fastapi import WebSocket
from enum import StrEnum

class MessageType(StrEnum):
    MESSAGE = "message"
    NOTIFICATION = "notification"
    ERROR = "error"
    USER_JOINED = "user_joined"
    USER_LEFT = "user_left"
    SYSTEM = "system"

    def __str__(self):
        return self.value

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    def connect(self, channel: str, websocket: WebSocket):
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, channel: str, websocket: WebSocket):
        self.active_connections[channel].remove(websocket)
        if not self.active_connections[channel]:
            del self.active_connections[channel]

    async def broadcast(self, channel: str, username: str, message: str, type: MessageType = MessageType.MESSAGE):
        if channel not in self.active_connections:
            return
        for connection in self.active_connections.get(channel, []):
            await connection.send_json({
                "type": type.value,
                "username": username,
                "content": message,
            })