import asyncio
import random
import secrets
from dataclasses import dataclass, field
from uuid import uuid4

from fastapi import WebSocket

from app.quiz_questions import QUIZ_QUESTIONS, QuizQuestion


@dataclass
class PlayerSession:
    player_name: str
    session_token: str
    websocket: WebSocket | None
    room_id: str | None = None


@dataclass
class GameRoom:
    player_ids: tuple[str, str]
    questions: list[QuizQuestion]
    scores: dict[str, int]
    current_question: int = -1
    answers: dict[str, int] = field(default_factory=dict)
    advancing: bool = False


class RoomManager:
    def __init__(self):
        self.players: dict[str, PlayerSession] = {}
        self.rooms: dict[str, GameRoom] = {}
        self.waiting_players: list[str] = []
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        player_name: str = "Player",
        player_id: str | None = None,
        session_token: str | None = None,
    ) -> str | None:
        await websocket.accept()

        if player_id is not None or session_token is not None:
            player = self.players.get(player_id or "")

            if (
                player is None
                or session_token is None
                or not secrets.compare_digest(
                    player.session_token, session_token
                )
            ):
                await websocket.close(
                    code=1008,
                    reason="Identitas atau sesi tidak valid",
                )
                return None

            player.websocket = websocket
            await self._send(
                websocket,
                "reconnected",
                "Sesi pemain tersambung kembali.",
                status="success",
                player_id=player_id,
                room_id=player.room_id,
            )

            if player.room_id is None:
                await self._queue_player(player_id)
            else:
                room = self.rooms.get(player.room_id)
                await self._notify_room(
                    player.room_id,
                    player_id,
                    "player_reconnected",
                    "Lawan tersambung kembali.",
                    player_id=player_id,
                )
                if room is not None and room.current_question >= 0:
                    await self._send_question_to_player(
                        player_id, room, "new_question"
                    )
                    await self._send_score_update(player.room_id)

            return player_id

        player_id = str(uuid4())
        session_token = secrets.token_urlsafe(32)
        self.players[player_id] = PlayerSession(
            player_name=player_name,
            session_token=session_token,
            websocket=websocket,
        )

        await self._send(
            websocket,
            "player_created",
            "Pemain terhubung ke server.",
            status="success",
            player_id=player_id,
            session_token=session_token,
        )
        await self._queue_player(player_id)
        return player_id

    async def _queue_player(self, player_id: str):
        async with self._lock:
            player = self.players.get(player_id)
            if player is None or player.websocket is None:
                return

            if player.room_id is None and player_id not in self.waiting_players:
                self.waiting_players.append(player_id)

            while True:
                available = [
                    queued_id
                    for queued_id in self.waiting_players
                    if queued_id in self.players
                    and self.players[queued_id].websocket is not None
                    and self.players[queued_id].room_id is None
                ]
                if len(available) < 2:
                    break

                player_1, player_2 = available[:2]
                self.waiting_players = [
                    queued_id
                    for queued_id in self.waiting_players
                    if queued_id not in (player_1, player_2)
                ]

                room_id = f"room-{uuid4()}"
                room = GameRoom(
                    player_ids=(player_1, player_2),
                    questions=random.sample(
                        QUIZ_QUESTIONS,
                        min(5, len(QUIZ_QUESTIONS)),
                    ),
                    scores={player_1: 0, player_2: 0},
                )
                self.rooms[room_id] = room
                self.players[player_1].room_id = room_id
                self.players[player_2].room_id = room_id

                await self._send_to_player(
                    player_1,
                    "matched",
                    f"Lawan ditemukan: {self.players[player_2].player_name}.",
                    status="success",
                    player_id=player_1,
                    room_id=room_id,
                    opponent=self.players[player_2].player_name,
                )
                await self._send_to_player(
                    player_2,
                    "matched",
                    f"Lawan ditemukan: {self.players[player_1].player_name}.",
                    status="success",
                    player_id=player_2,
                    room_id=room_id,
                    opponent=self.players[player_1].player_name,
                )
                asyncio.create_task(self._start_game(room_id))

            if player.room_id is None:
                await self._send_to_player(
                    player_id,
                    "waiting",
                    "Menunggu pemain kedua.",
                    status="waiting",
                )

    async def handle_message(self, player_id: str, data: object):
        if not isinstance(data, dict):
            await self._send_to_player(
                player_id,
                "error",
                "Pesan harus berupa objek JSON.",
                status="error",
            )
            return

        action = data.get("action")
        if action == "find_match":
            await self._queue_player(player_id)
            return
        if action == "submit_answer":
            await self._submit_answer(player_id, data)
            return

        await self._send_to_player(
            player_id,
            "error",
            "Aksi tidak dikenal.",
            status="error",
        )

    async def _submit_answer(self, player_id: str, data: dict):
        room_id = data.get("room_id")
        question_index = data.get("question_index")
        answer_index = data.get("answer_index")
        if (
            not isinstance(room_id, str)
            or not isinstance(question_index, int)
            or isinstance(question_index, bool)
            or not isinstance(answer_index, int)
            or isinstance(answer_index, bool)
        ):
            await self._send_to_player(
                player_id,
                "error",
                "Data jawaban tidak valid.",
                status="error",
            )
            return

        async with self._lock:
            room = self.rooms.get(room_id)
            if room is None or player_id not in room.player_ids:
                error = "Ruang permainan tidak ditemukan."
                is_correct = False
                should_advance = False
                scores = None
                player_names = None
            elif (
                room.current_question < 0
                or question_index != room.current_question
            ):
                error = "Indeks soal sudah tidak berlaku."
                is_correct = False
                should_advance = False
                scores = None
                player_names = None
            elif player_id in room.answers:
                error = "Jawaban untuk soal ini sudah dikirim."
                is_correct = False
                should_advance = False
                scores = None
                player_names = None
            elif not 0 <= answer_index < len(
                room.questions[question_index]["options"]
            ):
                error = "Pilihan jawaban tidak valid."
                is_correct = False
                should_advance = False
                scores = None
                player_names = None
            else:
                error = None
                is_correct = (
                    answer_index
                    == room.questions[question_index]["answer"]
                )
                room.answers[player_id] = answer_index
                if is_correct:
                    room.scores[player_id] += 100
                should_advance = (
                    len(room.answers) == len(room.player_ids)
                    and not room.advancing
                )
                if should_advance:
                    room.advancing = True
                scores = dict(room.scores)
                player_names = {
                    pid: self.players[pid].player_name
                    for pid in room.player_ids
                }

        if error is not None:
            await self._send_to_player(
                player_id,
                "error",
                error,
                status="error",
            )
            return

        await self._send_to_player(
            player_id,
            "answer_result",
            "Jawaban benar." if is_correct else "Jawaban kurang tepat.",
            status="success" if is_correct else "info",
            is_correct=is_correct,
            question_index=question_index,
        )
        await self._broadcast_room(
            room_id,
            "score_update",
            "Skor diperbarui.",
            scores=scores,
            players=player_names,
        )
        if should_advance:
            asyncio.create_task(self._next_question_delay(room_id))

    async def _start_game(self, room_id: str):
        await asyncio.sleep(2)
        room = self.rooms.get(room_id)
        if room is not None:
            await self._send_question(room_id, 0)

    async def _send_question(self, room_id: str, question_index: int):
        room = self.rooms.get(room_id)
        if room is None:
            return

        room.current_question = question_index
        room.answers.clear()
        room.advancing = False
        question = room.questions[question_index]
        await self._broadcast_room(
            room_id,
            "new_question",
            question["question"],
            status="info",
            question_index=question_index,
            total_questions=len(room.questions),
            question=question["question"],
            options=question["options"],
        )

    async def _send_question_to_player(
        self,
        player_id: str,
        room: GameRoom,
        event: str,
    ):
        question = room.questions[room.current_question]
        await self._send_to_player(
            player_id,
            event,
            question["question"],
            status="info",
            room_id=self.players[player_id].room_id,
            question_index=room.current_question,
            total_questions=len(room.questions),
            question=question["question"],
            options=question["options"],
        )

    async def _next_question_delay(self, room_id: str):
        await asyncio.sleep(1.5)
        room = self.rooms.get(room_id)
        if room is None:
            return

        next_question = room.current_question + 1
        if next_question < len(room.questions):
            await self._send_question(room_id, next_question)
            return

        scores = dict(room.scores)
        players = {
            player_id: self.players[player_id].player_name
            for player_id in room.player_ids
        }
        first_id, second_id = room.player_ids
        if scores[first_id] > scores[second_id]:
            winner_text = f"{players[first_id]} menang!"
        elif scores[second_id] > scores[first_id]:
            winner_text = f"{players[second_id]} menang!"
        else:
            winner_text = "Hasil seri!"

        await self._broadcast_room(
            room_id,
            "game_over",
            winner_text,
            status="success",
            winner_text=winner_text,
            scores=scores,
            players=players,
        )
        self.rooms.pop(room_id, None)
        for player_id in room.player_ids:
            self.players[player_id].room_id = None

    async def _send_score_update(self, room_id: str):
        room = self.rooms.get(room_id)
        if room is None:
            return
        await self._broadcast_room(
            room_id,
            "score_update",
            "Skor saat ini.",
            scores=dict(room.scores),
            players={
                player_id: self.players[player_id].player_name
                for player_id in room.player_ids
            },
        )

    async def _send_to_player(
        self,
        target_player_id: str,
        event: str,
        message: str,
        status: str = "info",
        **payload,
    ):
        player = self.players.get(target_player_id)
        if player is not None and player.websocket is not None:
            await self._send(
                player.websocket,
                event,
                message,
                status=status,
                **payload,
            )

    async def _broadcast_room(
        self,
        room_id: str,
        event: str,
        message: str,
        status: str = "info",
        **payload,
    ):
        room = self.rooms.get(room_id)
        if room is None:
            return
        for player_id in room.player_ids:
            await self._send_to_player(
                player_id,
                event,
                message,
                status=status,
                **payload,
            )

    async def _notify_room(
        self,
        room_id: str,
        excluded_player_id: str,
        event: str,
        message: str,
        **payload,
    ):
        room = self.rooms.get(room_id)
        if room is None:
            return
        for player_id in room.player_ids:
            if player_id != excluded_player_id:
                await self._send_to_player(
                    player_id,
                    event,
                    message,
                    **payload,
                )

    async def _send(
        self,
        websocket: WebSocket,
        event: str,
        message: str,
        status: str = "info",
        **payload,
    ):
        await websocket.send_json({
            "type": event,
            "event": event,
            "status": status,
            "message": message,
            **payload,
        })

    async def disconnect(self, player_id: str, websocket: WebSocket):
        async with self._lock:
            player = self.players.get(player_id)
            if player is None or player.websocket is not websocket:
                return

            player.websocket = None
            self.waiting_players = [
                queued_id
                for queued_id in self.waiting_players
                if queued_id != player_id
            ]
            room_id = player.room_id
            room = self.rooms.pop(room_id, None) if room_id is not None else None
            remaining_players = []
            if room is not None:
                for room_player_id in room.player_ids:
                    room_player = self.players[room_player_id]
                    room_player.room_id = None
                    if (
                        room_player_id != player_id
                        and room_player.websocket is not None
                    ):
                        remaining_players.append(room_player_id)

        for remaining_player_id in remaining_players:
            await self._send_to_player(
                remaining_player_id,
                "opponent_left",
                f"Lawan ({player.player_name}) terputus. Room ditutup.",
                status="error",
                player_id=player_id,
            )
