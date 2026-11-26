
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.rooms.manager import RoomManager

router = APIRouter()
room_manager = RoomManager()


@router.websocket("/ws")
async def matchmaking(websocket: WebSocket):
    player_name = (websocket.query_params.get("player_name") or "").strip()
    player_id = websocket.query_params.get("player_id")
    session_token = websocket.query_params.get("session_token")
    if not player_name and not (player_id and session_token):
        await websocket.accept()
        await websocket.send_json({
            "type": "error",
            "event": "error",
            "status": "error",
            "message": "Nama pemain wajib diisi sebelum bermain.",
        })
        await websocket.close(code=1008, reason="Nama pemain wajib diisi")
        return

    connected_player_id = None

    try:
        connected_player_id = await room_manager.connect(
            websocket=websocket,
            player_name=player_name,
            player_id=player_id,
            session_token=session_token,
        )

        if connected_player_id is None:
            return

        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "event": "error",
                    "status": "error",
                    "message": "Pesan harus berupa JSON yang valid.",
                })
                continue

            await room_manager.handle_message(connected_player_id, data)

    except WebSocketDisconnect:
        pass

    finally:
        if connected_player_id is not None:
            await room_manager.disconnect(
                connected_player_id,
                websocket,
            )
