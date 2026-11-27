import asyncio
import random
import time
from uuid import uuid4

from app.questions import QUIZ_QUESTIONS
from app.rooms.game_question import start_game
from app.rooms.models import GameRoom
from app.rooms.send import send_to_player


async def queue_player(manager, player_id):
    async with manager._lock:
        player = manager.players.get(player_id)
        if player is None or player.websocket is None:
            return
        if player.room_id is None and player_id not in manager.waiting_players:
            manager.waiting_players.append(player_id)
        while True:
            available = [
                queued_id
                for queued_id in manager.waiting_players
                if queued_id in manager.players
                and manager.players[queued_id].websocket is not None
                and manager.players[queued_id].room_id is None
            ]
            if len(available) < 2:
                break
            player_1, player_2 = available[:2]
            manager.waiting_players = [
                queued_id
                for queued_id in manager.waiting_players
                if queued_id not in (player_1, player_2)
            ]
            await _open_room(manager, player_1, player_2)
        if player.room_id is None:
            await send_to_player(
                manager,
                player_id,
                "waiting",
                "Menunggu pemain kedua.",
                status="waiting",
            )


async def _open_room(manager, player_1, player_2):
    room_id = f"room-{uuid4()}"
    now = time.time()
    room = GameRoom(
        player_ids=(player_1, player_2),
        questions=random.sample(QUIZ_QUESTIONS, min(5, len(QUIZ_QUESTIONS))),
        scores={player_1: 0, player_2: 0},
        player_results={player_1: {}, player_2: {}},
        player_current_question={player_1: 0, player_2: 0},
        player_finished={player_1: False, player_2: False},
        player_start_times={player_1: now, player_2: now},
        player_durations={},
    )
    manager.rooms[room_id] = room
    manager.players[player_1].room_id = room_id
    manager.players[player_2].room_id = room_id
    await send_to_player(
        manager,
        player_1,
        "matched",
        f"Lawan ditemukan: {manager.players[player_2].player_name}.",
        status="success",
        player_id=player_1,
        room_id=room_id,
        opponent=manager.players[player_2].player_name,
    )
    await send_to_player(
        manager,
        player_2,
        "matched",
        f"Lawan ditemukan: {manager.players[player_1].player_name}.",
        status="success",
        player_id=player_2,
        room_id=room_id,
        opponent=manager.players[player_1].player_name,
    )
    asyncio.create_task(start_game(manager, room_id))
