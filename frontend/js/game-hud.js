import { escapeHtml } from "./escape.js";

export function formatElapsed(startedAt, endedAt = Date.now()) {
  if (typeof startedAt !== "number") return "00:00";
  const elapsedSeconds = Math.floor(Math.max(0, endedAt - startedAt) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function gameHudMarkup(quiz) {
  const ownScore = quiz.playerId ? quiz.scores[quiz.playerId] || 0 : 0;
  const opponentEntry = Object.entries(quiz.scores).find(
    ([playerId]) => playerId !== quiz.playerId,
  );
  const opponent =
    quiz.opponent ||
    (opponentEntry ? quiz.players[opponentEntry[0]] : null) ||
    "Lawan";

  return `<div class="game-hud" role="group" aria-label="Skor pertandingan dan waktu">
    <div class="game-hud-player">
      <span>ANDA</span>
      <strong>${escapeHtml(ownScore)} <small>poin</small></strong>
    </div>
    <div class="game-hud-time">
      <span>WAKTU</span>
      <strong id="game-elapsed">${formatElapsed(quiz.startedAt)}</strong>
    </div>
    <div class="game-hud-player game-hud-opponent">
      <span>${escapeHtml(opponent)}</span>
      <strong>${escapeHtml(opponentEntry ? opponentEntry[1] : 0)} <small>poin</small></strong>
    </div>
  </div>`;
}
