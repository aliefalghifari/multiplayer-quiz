import { escapeHtml } from "./escape.js";
import { gameHudMarkup } from "./game-hud.js";

export function startingMarkup(quiz) {
  const title = quiz.opponent ? `Bertemu ${quiz.opponent}` : "Room dibuat";
  const skeletonRows = ["68%", "54%", "74%", "48%"]
    .map(
      (width) => `<div class="quiz-skeleton-option">
        <span class="skeleton-shimmer quiz-skeleton-badge"></span>
        <span class="skeleton-shimmer quiz-skeleton-text" style="width: ${width}"></span>
      </div>`,
    )
    .join("");

  return `<div class="quiz-layout">
    ${gameHudMarkup(quiz)}
    <section class="quiz-panel quiz-starting" aria-live="polite" aria-busy="true">
      <span class="quiz-kicker">MULTIPLAYER QUIZ</span>
      <h1>${escapeHtml(title)}</h1>
      <p>Menyiapkan soal...</p>
      <div class="quiz-skeleton-card" aria-hidden="true">
        <span class="skeleton-shimmer quiz-skeleton-progress"></span>
        <div class="quiz-skeleton-question">
          <span class="skeleton-shimmer"></span>
          <span class="skeleton-shimmer"></span>
        </div>
        <div class="quiz-skeleton-options">
          ${skeletonRows}
        </div>
      </div>
    </section>
  </div>`;
}
