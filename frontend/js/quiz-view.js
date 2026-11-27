import { ui } from "./state.js";
import { startingMarkup } from "./starting-view.js";
import { questionMarkup } from "./question-view.js";
import { resultMarkup } from "./result-view.js";
import { formatCountdown } from "./game-hud.js";
import { render } from "./render.js";

let stamp = "";
let timerInterval = null;

function syncElapsedTimer() {
  const isRunning =
    ui.quiz.stage !== "lobby" &&
    ui.quiz.startedAt !== null &&
    ui.quiz.endedAt === null;
  if (isRunning && timerInterval === null) {
    timerInterval = window.setInterval(updateElapsed, 1000);
  } else if (!isRunning && timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
  updateElapsed();
}

function updateElapsed() {
  const timer = document.getElementById("game-elapsed");
  if (timer && ui.quiz.startedAt !== null && ui.quiz.endedAt === null) {
    const text = formatCountdown(ui.quiz.startedAt);
    timer.textContent = text;
    if (text === "00:00" && ui.quiz.stage === "question" && !ui.quiz.waitingForOpponent && !ui.quiz.completed) {
      ui.quiz.waitingForOpponent = true;
      render();
    }
  }
}

export function syncQuiz() {
  const root = document.getElementById("quiz-root");
  if (!root || ui.quiz.stage === "lobby") {
    stamp = "";
    if (root) root.innerHTML = "";
    syncElapsedTimer();
    return;
  }
  const next = JSON.stringify(ui.quiz) + String(ui.canFindAgain);
  if (next !== stamp) {
    stamp = next;
    if (ui.quiz.stage === "starting") root.innerHTML = startingMarkup(ui.quiz);
    else if (ui.quiz.stage === "question") root.innerHTML = questionMarkup(ui.quiz);
    else root.innerHTML = resultMarkup(ui.quiz, ui.canFindAgain);
  }
  syncElapsedTimer();
}
