import { escapeHtml } from "./escape.js";
import { gameHudMarkup } from "./game-hud.js";

export function startingMarkup(quiz) {
  const title = quiz.opponent ? `Bertemu ${quiz.opponent}` : "Room dibuat";
  return `<div class="quiz-layout">
    ${gameHudMarkup(quiz)}
    <section class="quiz-panel quiz-starting" aria-live="polite">
      <span class="quiz-kicker">MULTIPLAYER QUIZ</span>
      <h1>${escapeHtml(title)}</h1>
      <p>Menyiapkan soal...</p>
      <span class="quiz-loading-dot" aria-hidden="true"></span>
    </section>
  </div>`;
}
