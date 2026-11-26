async def send(websocket, event, message, status="info", **payload):
    await websocket.send_json({
        "type": event,
        "event": event,
        "status": status,
        "message": message,
        **payload,
    })


async def send_to_player(
    manager, target_player_id, event, message, status="info", **payload
):
    player = manager.players.get(target_player_id)
    if player is not None and player.websocket is not None:
        await send(
            player.websocket, event, message, status=status, **payload
        )


async def broadcast_room(
    manager, room_id, event, message, status="info", **payload
):
    room = manager.rooms.get(room_id)
    if room is None:
        return
    for player_id in room.player_ids:
        await send_to_player(
            manager, player_id, event, message, status=status, **payload
        )


async def notify_room(
    manager, room_id, excluded_player_id, event, message, **payload
):
    room = manager.rooms.get(room_id)
    if room is None:
        return
    for player_id in room.player_ids:
        if player_id != excluded_player_id:
            await send_to_player(
                manager, player_id, event, message, **payload
            )
