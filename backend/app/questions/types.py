from typing import TypedDict


class QuizQuestion(TypedDict):
    question: str
    options: list[str]
    answer: int
