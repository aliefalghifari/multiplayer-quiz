from app.rooms.answers import submit_answer
from app.rooms.queue import queue_player
from app.rooms.send import send_to_player


async def handle_message(manager, player_id, data):
    if not isinstance(data, dict):
        await send_to_player(
            manager,
            player_id,
            "error",
            "Pesan harus berupa objek JSON.",
            status="error",
        )
        return
    action = data.get("action")
    if action == "find_match":
        await queue_player(manager, player_id)
        return
    if action == "submit_answer":
        await submit_answer(manager, player_id, data)
        return
    await send_to_player(
        manager, player_id, "error", "Aksi tidak dikenal.", status="error"
    )
