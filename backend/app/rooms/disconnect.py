from app.rooms.send import send_to_player


async def disconnect_player(manager, player_id, websocket):
    async with manager._lock:
        player = manager.players.get(player_id)
        if player is None or player.websocket is not websocket:
            return
        player.websocket = None
        manager.waiting_players = [
            queued_id
            for queued_id in manager.waiting_players
            if queued_id != player_id
        ]
        room_id = player.room_id
        room = manager.rooms.pop(room_id, None) if room_id else None
        remaining = []
        if room is not None:
            for room_player_id in room.player_ids:
                room_player = manager.players[room_player_id]
                room_player.room_id = None
                still_here = room_player_id != player_id
                if still_here and room_player.websocket is not None:
                    remaining.append(room_player_id)
    for remaining_id in remaining:
        await send_to_player(
            manager,
            remaining_id,
            "opponent_left",
            f"Lawan ({player.player_name}) terputus. Room ditutup.",
            status="error",
            player_id=player_id,
        )
