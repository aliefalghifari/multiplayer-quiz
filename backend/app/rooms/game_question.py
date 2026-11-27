import asyncio

from app.rooms.send import broadcast_room, send_to_player


async def start_game(manager, room_id):
    await asyncio.sleep(2)
    room = manager.rooms.get(room_id)
    if room is not None:
        await send_question(manager, room_id, 0)


async def send_question(manager, room_id, question_index):
    room = manager.rooms.get(room_id)
    if room is None:
        return
    room.current_question = question_index
    room.answers.clear()
    room.advancing = False
    question = room.questions[question_index]
    await broadcast_room(
        manager,
        room_id,
        "new_question",
        question["question"],
        status="info",
        question_index=question_index,
        total_questions=len(room.questions),
        question=question["question"],
        options=question["options"],
        correct_answer=question["answer"],
    )


async def send_question_to_player(manager, player_id, room, event):
    question = room.questions[room.current_question]
    await send_to_player(
        manager,
        player_id,
        event,
        question["question"],
        status="info",
        room_id=manager.players[player_id].room_id,
        question_index=room.current_question,
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
