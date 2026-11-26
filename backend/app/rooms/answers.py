import asyncio

from app.rooms.answer_check import judge_answer, parse_answer
from app.rooms.game_advance import next_question_delay
from app.rooms.send import broadcast_room, send_to_player


async def submit_answer(manager, player_id, data):
    parsed = parse_answer(data)
    if parsed is None:
        await send_to_player(
            manager,
            player_id,
            "error",
            "Data jawaban tidak valid.",
            status="error",
        )
        return
    room_id, question_index, answer_index = parsed
    async with manager._lock:
        outcome = judge_answer(
            manager, player_id, room_id, question_index, answer_index
        )
    if outcome["error"] is not None:
        await send_to_player(
            manager, player_id, "error", outcome["error"], status="error"
        )
        return
    correct = outcome["is_correct"]
    await send_to_player(
        manager,
        player_id,
        "answer_result",
        "Jawaban benar." if correct else "Jawaban kurang tepat.",
        status="success" if correct else "info",
        is_correct=correct,
        question_index=question_index,
    )
    await broadcast_room(
        manager,
        room_id,
        "score_update",
        "Skor diperbarui.",
        scores=outcome["scores"],
        players=outcome["players"],
    )
    if outcome["should_advance"]:
        asyncio.create_task(next_question_delay(manager, room_id))
