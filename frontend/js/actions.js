import { ui, refs, initialQuiz } from "./state.js";
import { setMessage } from "./status-view.js";
import { render } from "./render.js";

function fail(message) {
  setMessage({ type: "error", status: "error", message });
  render();
}

export function submitAnswer(answerIndex) {
  const quiz = ui.quiz;
  if (quiz.answerSubmitted) return;
  quiz.selectedAnswer = answerIndex;
  render();
}

export function confirmAnswer() {
  const socket = refs.activeSocket;
  const quiz = ui.quiz;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!quiz.roomId || quiz.selectedAnswer === null || quiz.answerSubmitted) return;
  try {
    socket.send(
      JSON.stringify({
        action: "submit_answer",
        room_id: quiz.roomId,
        question_index: quiz.questionIndex,
        answer_index: quiz.selectedAnswer,
      }),
    );
  } catch {
    fail("Jawaban gagal dikirim karena koneksi terputus.");
    return;
  }
  quiz.answerSubmitted = true;
  const entry = quiz.questionLog.find(
    (item) => item.questionIndex === quiz.questionIndex,
  );
  if (entry) {
    entry.selectedAnswer = quiz.selectedAnswer;
  }
  if (quiz.questionIndex >= quiz.totalQuestions - 1) {
    quiz.waitingForOpponent = true;
  }
  render();
}

export function findMatchAgain() {
  const socket = refs.activeSocket;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    fail("Koneksi ke server terputus. Sambungkan kembali dari halaman utama.");
    return;
  }
  try {
    socket.send(JSON.stringify({ action: "find_match" }));
  } catch {
    fail("Gagal mencari lawan karena koneksi terputus.");
    return;
  }
  ui.quiz = { ...initialQuiz(), stage: "starting" };
  render();
}
