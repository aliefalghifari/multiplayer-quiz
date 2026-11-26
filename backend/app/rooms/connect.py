import secrets
from uuid import uuid4

from app.rooms.models import PlayerSession
from app.rooms.queue import queue_player
from app.rooms.resume import resume_player
from app.rooms.send import send


async def connect_player(
    manager,
    websocket,
    player_name="Player",
    player_id=None,
    session_token=None,
):
    await websocket.accept()
    if player_id is not None or session_token is not None:
        return await resume_player(
            manager, websocket, player_id, session_token
        )
    player_id = str(uuid4())
    session_token = secrets.token_urlsafe(32)
    manager.players[player_id] = PlayerSession(
        player_name=player_name,
        session_token=session_token,
        websocket=websocket,
    )
    await send(
        websocket,
        "player_created",
        "Pemain terhubung ke server.",
        status="success",
        player_id=player_id,
        session_token=session_token,
    )
    await queue_player(manager, player_id)
    return player_id
