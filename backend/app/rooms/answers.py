import asyncio

from app.rooms.answer_check import judge_answer, parse_answer
from app.rooms.game_question import send_question_to_player
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
        room = manager.rooms.get(room_id)
        if room is None:
            await send_to_player(manager, player_id, "error", "Room tidak ditemukan.", status="error")
            return
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
        player_results=outcome["player_results"],
    )

    if not outcome["finished"]:
        await send_question_to_player(manager, player_id, room, room.player_current_question[player_id])
    else:
        if all(room.player_finished.values()):
            scores = dict(room.scores)
            players = outcome["players"]
            durations = outcome["player_durations"]
            first_id, second_id = room.player_ids
            if scores[first_id] > scores[second_id]:
                winner_text = f"{players[first_id]} menang!"
            elif scores[second_id] > scores[first_id]:
                winner_text = f"{players[second_id]} menang!"
            else:
                d1 = durations.get(first_id, 999999)
                d2 = durations.get(second_id, 999999)
                if d1 <= d2:
                    winner_text = f"{players[first_id]} menang (waktu lebih cepat)!"
                else:
                    winner_text = f"{players[second_id]} menang (waktu lebih cepat)!"
            await broadcast_room(
                manager,
                room_id,
                "game_over",
                winner_text,
                status="success",
                winner_text=winner_text,
                scores=scores,
                players=players,
                durations=durations,
            )
            manager.rooms.pop(room_id, None)
            for pid in room.player_ids:
                manager.players[pid].room_id = None
