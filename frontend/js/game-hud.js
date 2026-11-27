import { escapeHtml } from "./escape.js";

export function formatElapsed(startedAt, endedAt = Date.now()) {
  if (typeof startedAt !== "number") return "00:00";
  const elapsedSeconds = Math.floor(Math.max(0, endedAt - startedAt) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatCountdown(startedAt) {
  if (typeof startedAt !== "number") return "05:00";
  const totalMs = 300 * 1000;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, totalMs - elapsed);
  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

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

export function gameHudMarkup(quiz) {
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

  return `<div class="game-hud-new" role="group" aria-label="Status pertandingan dan waktu">
    <div class="hud-profile-side">
      <div class="hud-avatar">${escapeHtml(ownInitial)}</div>
      ${renderDots(quiz.playerResults, totalQ)}
    </div>
    <div class="hud-timer-center">
      <div class="hud-timer-badge">
        <span class="hud-clock-icon">⏱</span>
        <strong id="game-elapsed">${formatCountdown(quiz.startedAt)}</strong>
      </div>
    </div>
    <div class="hud-profile-side hud-opponent-side">
      <div class="hud-avatar hud-avatar-opponent">${escapeHtml(oppInitial)}</div>
      ${renderDots(quiz.opponentResults, totalQ)}
    </div>
  </div>`;
}
