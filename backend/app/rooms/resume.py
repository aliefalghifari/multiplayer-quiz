import secrets

from app.rooms.game_question import send_question_to_player, send_score_update
from app.rooms.queue import queue_player
from app.rooms.send import notify_room, send


async def resume_player(manager, websocket, player_id, session_token):
    player = manager.players.get(player_id or "")
    token_ok = (
        player is not None
        and session_token is not None
        and secrets.compare_digest(player.session_token, session_token)
    )
    if not token_ok:
        await websocket.close(code=1008, reason="Identitas atau sesi tidak valid")
        return None
    player.websocket = websocket
    await send(
        websocket,
        "reconnected",
        "Sesi pemain tersambung kembali.",
        status="success",
        player_id=player_id,
        room_id=player.room_id,
    )
    if player.room_id is None:
        await queue_player(manager, player_id)
        return player_id
    room = manager.rooms.get(player.room_id)
    await notify_room(
        manager,
        player.room_id,
        player_id,
        "player_reconnected",
        "Lawan tersambung kembali.",
        player_id=player_id,
    )
    if room is not None and room.current_question >= 0:
        await send_question_to_player(manager, player_id, room, "new_question")
        await send_score_update(manager, player.room_id)
    return player_id
