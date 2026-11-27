import asyncio

from app.rooms.send import broadcast_room, send_to_player


async def start_game(manager, room_id):
    await asyncio.sleep(2)
    room = manager.rooms.get(room_id)
    if room is not None:
        for pid in room.player_ids:
            await send_question_to_player(manager, pid, room, room.player_current_question.get(pid, 0))


async def send_question(manager, room_id, question_index):
    pass


async def send_question_to_player(manager, player_id, room, question_index):
    if question_index >= len(room.questions):
        return
    question = room.questions[question_index]
    await send_to_player(
        manager,
        player_id,
        "new_question",
        question["question"],
        status="info",
        room_id=manager.players[player_id].room_id,
        question_index=question_index,
        total_questions=len(room.questions),
        question=question["question"],
        options=question["options"],
        correct_answer=question["answer"],
    )


async def send_score_update(manager, room_id):
    room = manager.rooms.get(room_id)
    if room is None:
        return
    await broadcast_room(
        manager,
        room_id,
        "score_update",
        "Skor saat ini.",
        scores=dict(room.scores),
        players={
            player_id: manager.players[player_id].player_name
            for player_id in room.player_ids
        },
    )
