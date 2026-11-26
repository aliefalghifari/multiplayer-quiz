from dataclasses import dataclass, field

from fastapi import WebSocket

from app.questions.types import QuizQuestion


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
