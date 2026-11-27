import { ui } from "./state.js";
import { setMessage } from "./status-view.js";
import { numberRecord, stringRecord } from "./records.js";
import { readQuestion } from "./read-question.js";
import { recordMatchHistory } from "./history-view.js";

function recordQuestionEntry(quiz, next) {
  const existingIndex = quiz.questionLog.findIndex(
    (item) => item.questionIndex === next.questionIndex,
  );
  const entry = {
    questionIndex: next.questionIndex,
    question: next.question,
    options: next.options,
    selectedAnswer: null,
    isCorrect: null,
    correctAnswer: next.correctAnswer,
  };
  if (existingIndex >= 0) {
    quiz.questionLog[existingIndex] = {
      ...quiz.questionLog[existingIndex],
      question: next.question,
      options: next.options,
      correctAnswer: next.correctAnswer ?? quiz.questionLog[existingIndex].correctAnswer,
    };
  } else {
    quiz.questionLog.push(entry);
  }
}

export function applyEvent(eventType, parsed, message) {
  const quiz = ui.quiz;
  if (eventType === "matched" || eventType === "match_found") {
    quiz.stage = "starting";
    quiz.completed = false;
    quiz.historySaved = false;
    quiz.questionLog = [];
    quiz.startedAt = Date.now();
    quiz.endedAt = null;
    if (typeof parsed.player_id === "string") quiz.playerId = parsed.player_id;
    if (typeof parsed.room_id === "string") quiz.roomId = parsed.room_id;
    if (typeof parsed.opponent === "string") quiz.opponent = parsed.opponent;
    return;
  }
  if (eventType === "new_question") {
    const next = readQuestion(parsed, quiz);
    if (!next) {
      setMessage({
        type: "error",
        status: "error",
        message: "The server sent an invalid quiz question.",
      });
      return;
    }
    if (quiz.startedAt === null) quiz.startedAt = Date.now();
    Object.assign(quiz, next);
    recordQuestionEntry(quiz, next);
    return;
  }
  if (eventType === "answer_result" && typeof parsed.is_correct === "boolean") {
    quiz.answerCorrect = parsed.is_correct;
    if (typeof parsed.correct_answer === "number") {
      quiz.correctAnswer = parsed.correct_answer;
    }
    const item = quiz.questionLog.find(
      (entry) => entry.questionIndex === quiz.questionIndex,
    );
    if (item) {
      item.isCorrect = parsed.is_correct;
      if (typeof parsed.correct_answer === "number") {
        item.correctAnswer = parsed.correct_answer;
      }
    }
    return;
  }
  if (eventType === "score_update") {
    quiz.scores = numberRecord(parsed.scores);
    quiz.players = stringRecord(parsed.players);
    return;
  }
  if (eventType === "game_over") {
    quiz.stage = "result";
    quiz.completed = true;
    quiz.endedAt = Date.now();
    quiz.winnerText =
      typeof parsed.winner_text === "string" ? parsed.winner_text : message.message;
    quiz.scores = numberRecord(parsed.scores);
    quiz.players = stringRecord(parsed.players);
    recordMatchHistory(quiz);
    return;
  }
  if (eventType === "player_disconnected" || eventType === "opponent_left") {
    quiz.stage = "result";
    quiz.completed = false;
    quiz.endedAt = Date.now();
    quiz.winnerText = message.message;
    recordMatchHistory(quiz);
    return;
  }
  if (eventType === "error" && quiz.stage === "question") {
    quiz.selectedAnswer = null;
  }
}
