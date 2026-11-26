import asyncio

from app.rooms.connect import connect_player
from app.rooms.disconnect import disconnect_player
from app.rooms.messages import handle_message


class RoomManager:
    def __init__(self):
        self.players = {}
        self.rooms = {}
        self.waiting_players = []
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket,
        player_name="Player",
        player_id=None,
        session_token=None,
    ):
        return await connect_player(
            self, websocket, player_name, player_id, session_token
        )

    async def handle_message(self, player_id, data):
        await handle_message(self, player_id, data)

    async def disconnect(self, player_id, websocket):
        await disconnect_player(self, player_id, websocket)
