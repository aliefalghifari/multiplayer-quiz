import { escapeHtml } from "./escape.js";
import { gameHudMarkup, formatCountdown } from "./game-hud.js";

function renderDots(resultsMap = {}, total = 5) {
  let html = "";
  for (let i = 0; i < total; i++) {
    const res = resultsMap[i];
    let cls = "hud-dot-empty";
    let icon = "";
    if (res === true) {
      cls = "hud-dot-correct";
      icon = "✓";
    } else if (res === false) {
      cls = "hud-dot-wrong";
      icon = "✕";
    }
    html += `<span class="hud-dot ${cls}">${escapeHtml(icon)}</span>`;
  }
  return `<div class="hud-dots">${html}</div>`;
}

export function waitingViewMarkup(quiz) {
  const opponentEntry = Object.entries(quiz.scores).find(
    ([playerId]) => playerId !== quiz.playerId,
  );
  const opponent =
    quiz.opponent ||
    (opponentEntry ? quiz.players[opponentEntry[0]] : null) ||
    "Lawan";
  const ownName = quiz.playerId && quiz.players[quiz.playerId] ? quiz.players[quiz.playerId] : "Anda";
  const ownInitial = (ownName || "A").trim().charAt(0).toUpperCase();
  const oppInitial = (opponent || "L").trim().charAt(0).toUpperCase();
  const totalQ = quiz.totalQuestions || 5;

  return `<div class="quiz-layout waiting-layout">
    <h2 class="waiting-header-title">Menunggu hasil lawan...</h2>
    <div class="waiting-card">
      <div class="waiting-user-row">
        <div class="hud-avatar hud-avatar-large hud-avatar-opponent">${escapeHtml(oppInitial)}</div>
        <div class="waiting-user-info">
          <strong>${escapeHtml(opponent)}</strong>
          ${renderDots(quiz.opponentResults, totalQ)}
        </div>
      </div>

      <div class="waiting-timer-badge">
        <span class="hud-clock-icon">⏱</span>
        <strong id="game-elapsed">${formatCountdown(quiz.startedAt)}</strong>
      </div>

      <div class="waiting-user-row">
        <div class="hud-avatar hud-avatar-large">${escapeHtml(ownInitial)}</div>
        <div class="waiting-user-info">
          <strong>${escapeHtml(ownName)}</strong>
          ${renderDots(quiz.playerResults, totalQ)}
        </div>
      </div>
    </div>
  </div>`;
}

export function questionMarkup(quiz) {
  if (quiz.waitingForOpponent) {
    return waitingViewMarkup(quiz);
  }

  const options = quiz.options
    .map((option, index) => {
      const selected = quiz.selectedAnswer === index;
      const resultClass = selected ? " is-selected" : "";
      const letter = String.fromCharCode(65 + index);
      return `<button class="quiz-option${resultClass}" type="button" data-option="${index}" ${quiz.answerSubmitted ? "disabled" : ""} aria-pressed="${selected}">
        <span class="quiz-option-letter">${letter}</span>
        <span>${escapeHtml(option)}</span>
      </button>`;
    })
    .join("");

  return `<div class="quiz-layout">
    ${gameHudMarkup(quiz)}
    <section class="quiz-panel" aria-live="polite">
      <div class="quiz-progress-row">
        <p class="quiz-progress">SOAL ${quiz.questionIndex + 1} / ${quiz.totalQuestions}</p>
      </div>
      <div class="quiz-progress-track" role="progressbar" aria-label="Kemajuan kuis" aria-valuemin="0" aria-valuemax="${quiz.totalQuestions}" aria-valuenow="${quiz.questionIndex + 1}">
        <span style="width: ${((quiz.questionIndex + 1) / quiz.totalQuestions) * 100}%"></span>
      </div>
      <h1 class="quiz-question">${escapeHtml(quiz.question)}</h1>
      <div class="quiz-options" role="group" aria-label="Pilihan jawaban">${options}</div>
      
      <div class="quiz-footer-action">
        <button
          class="quiz-next-button${quiz.selectedAnswer !== null && !quiz.answerSubmitted ? " is-active" : ""}"
          type="button"
          data-next-question
          ${quiz.selectedAnswer === null || quiz.answerSubmitted ? "disabled" : ""}
        >
          Selanjutnya
        </button>
      </div>
    </section>
  </div>`;
}
