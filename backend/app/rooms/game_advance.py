import asyncio

from app.rooms.game_question import send_question
from app.rooms.send import broadcast_room


async def next_question_delay(manager, room_id):
    await asyncio.sleep(1.5)
    room = manager.rooms.get(room_id)
    if room is None:
        return
    next_index = room.current_question + 1
    if next_index < len(room.questions):
        await send_question(manager, room_id, next_index)
        return
    scores = dict(room.scores)
    players = {
        player_id: manager.players[player_id].player_name
        for player_id in room.player_ids
    }
    first_id, second_id = room.player_ids
    if scores[first_id] > scores[second_id]:
        winner_text = f"{players[first_id]} menang!"
    elif scores[second_id] > scores[first_id]:
        winner_text = f"{players[second_id]} menang!"
    else:
        winner_text = "Hasil seri!"
    await broadcast_room(
        manager,
        room_id,
        "game_over",
        winner_text,
        status="success",
        winner_text=winner_text,
        scores=scores,
        players=players,
    )
    manager.rooms.pop(room_id, None)
    for player_id in room.player_ids:
        manager.players[player_id].room_id = None
