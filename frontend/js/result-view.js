import { escapeHtml } from "./escape.js";
import { formatElapsed } from "./game-hud.js";

function playerMarkup(name, side) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return `<div class="quiz-result-player quiz-result-player-${side}" role="columnheader">
    <span class="quiz-result-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
    <strong>${escapeHtml(name)}</strong>
  </div>`;
}

export function resultMarkup(quiz, canFindAgain) {
  const scoreEntries = Object.entries(quiz.scores);
  const ownEntry =
    scoreEntries.find(([playerId]) => playerId === quiz.playerId) ||
    (!quiz.playerId ? scoreEntries[0] : null);
  const opponentEntry = scoreEntries.find(
    ([playerId]) => playerId !== ownEntry?.[0],
  );
  const ownName = ownEntry
    ? quiz.players[ownEntry[0]] || "Anda"
    : quiz.players[quiz.playerId] || "Anda";
  const opponentName = opponentEntry
    ? quiz.players[opponentEntry[0]] || quiz.opponent || "Lawan"
    : quiz.opponent || "Lawan";
  const hasBothScores = Boolean(ownEntry && opponentEntry);
  const ownScore = ownEntry ? ownEntry[1] : null;
  const opponentScore = opponentEntry ? opponentEntry[1] : null;
  const isTie = hasBothScores && ownScore === opponentScore;
  const ownWon = hasBothScores && ownScore > opponentScore;
  const opponentWon = hasBothScores && opponentScore > ownScore;
  const canCompareScores = quiz.completed && hasBothScores;
  const title =
    quiz.completed && hasBothScores
      ? isTie
        ? "Hasil seri!"
        : ownWon
          ? "Kamu menang!"
          : "Kamu kalah!"
      : quiz.winnerText || "Game selesai";
  const ownStatus = !quiz.completed
    ? "Terhenti"
    : !canCompareScores
      ? "Selesai"
      : isTie
        ? "Seri"
        : ownWon
          ? "Menang"
          : "Kalah";
  const opponentStatus = !quiz.completed
    ? "Terhenti"
    : !canCompareScores
      ? "Selesai"
      : isTie
        ? "Seri"
        : opponentWon
          ? "Menang"
          : "Kalah";
  const scoreValue = (score) =>
    score === null ? "Belum tersedia" : `${escapeHtml(score)} poin`;
  const duration = formatElapsed(quiz.startedAt, quiz.endedAt ?? Date.now());

  return `<section class="quiz-panel quiz-result" aria-live="polite">
    <span class="quiz-kicker">MULTIPLAYER QUIZ</span>
    <h1>${escapeHtml(title)}</h1>
    <div class="quiz-result-board" role="table" aria-label="Ringkasan pertandingan">
      <div class="quiz-result-columns" role="row">
        ${playerMarkup(ownName, "you")}
        <span class="quiz-result-column-label" role="columnheader">HASIL</span>
        ${playerMarkup(opponentName, "opponent")}
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value" role="cell">${scoreValue(ownScore)}</strong>
        <span class="quiz-result-label" role="rowheader">Skor</span>
        <strong class="quiz-result-value" role="cell">${scoreValue(opponentScore)}</strong>
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value" role="cell">${duration}</strong>
        <span class="quiz-result-label" role="rowheader">Durasi</span>
        <strong class="quiz-result-value" role="cell">${duration}</strong>
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value quiz-result-status" role="cell">${ownStatus}</strong>
        <span class="quiz-result-label" role="rowheader">Status</span>
        <strong class="quiz-result-value quiz-result-status" role="cell">${opponentStatus}</strong>
      </div>
    </div>
  </section>
  <div class="quiz-result-action">
    <button class="quiz-replay-button" type="button" data-replay ${canFindAgain ? "" : "disabled"}>Cari lawan lagi</button>
  </div>
  <div class="quiz-result-action">
    <button class="quiz-home-button" type="button" data-home>Kembali ke halaman utama</button>
  </div>`;
}
