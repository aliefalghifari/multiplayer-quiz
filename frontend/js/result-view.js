import { escapeHtml } from "./escape.js";
import { formatElapsed } from "./game-hud.js";

function playerMarkup(name, side, outcomeClass = "") {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const stateClass = outcomeClass ? ` ${outcomeClass}` : "";
  return `<div class="quiz-result-player quiz-result-player-${side}${stateClass}" role="columnheader">
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

  const durations = quiz.durations || {};
  const ownDurSecs = ownEntry ? durations[ownEntry[0]] : 999999;
  const oppDurSecs = opponentEntry ? durations[opponentEntry[0]] : 999999;

  let ownWon = false;
  let opponentWon = false;

  if (hasBothScores && ownScore !== null && opponentScore !== null) {
    if (ownScore > opponentScore) {
      ownWon = true;
    } else if (opponentScore > ownScore) {
      opponentWon = true;
    } else {
      if (ownDurSecs <= oppDurSecs) {
        ownWon = true;
      } else {
        opponentWon = true;
      }
    }
  }

  const isTie = false;
  const canCompareScores = quiz.completed && hasBothScores;
  const ownOutcome = canCompareScores ? (ownWon ? "is-winner" : "is-loser") : "";
  const opponentOutcome = canCompareScores ? (opponentWon ? "is-winner" : "is-loser") : "";
  const ownOutcomeClass = ownOutcome ? ` ${ownOutcome}` : "";
  const opponentOutcomeClass = opponentOutcome ? ` ${opponentOutcome}` : "";
  const title =
    quiz.completed && hasBothScores
      ? quiz.winnerText || (ownWon ? "Kamu menang!" : "Kamu kalah!")
      : quiz.winnerText || "Game selesai";
  const ownStatus = !quiz.completed
    ? "Terhenti"
    : !canCompareScores
      ? "Selesai"
      : ownWon
        ? "Menang"
        : "Kalah";
  const opponentStatus = !quiz.completed
    ? "Terhenti"
    : !canCompareScores
      ? "Selesai"
      : opponentWon
        ? "Menang"
        : "Kalah";
  const scoreValue = (score) =>
    score === null ? "Belum tersedia" : `${escapeHtml(score)} poin`;
  const duration = formatElapsed(quiz.startedAt, quiz.endedAt ?? Date.now());
  const formatSecs = (secs) => {
    if (typeof secs !== "number") return duration;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  const ownDurationText = formatSecs(ownDurSecs);
  const oppDurationText = formatSecs(oppDurSecs);

  return `<section class="quiz-panel quiz-result" aria-live="polite">
    <span class="quiz-kicker">MULTIPLAYER QUIZ</span>
    <h1>${escapeHtml(title)}</h1>
    <div class="quiz-result-board" role="table" aria-label="Ringkasan pertandingan">
      <div class="quiz-result-columns" role="row">
        ${playerMarkup(ownName, "you", ownOutcome)}
        <span class="quiz-result-column-label" role="columnheader">HASIL</span>
        ${playerMarkup(opponentName, "opponent", opponentOutcome)}
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value${ownOutcomeClass}" role="cell">${scoreValue(ownScore)}</strong>
        <span class="quiz-result-label" role="rowheader">Skor</span>
        <strong class="quiz-result-value${opponentOutcomeClass}" role="cell">${scoreValue(opponentScore)}</strong>
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value${ownOutcomeClass}" role="cell">${escapeHtml(ownDurationText)}</strong>
        <span class="quiz-result-label" role="rowheader">Durasi Selesai</span>
        <strong class="quiz-result-value${opponentOutcomeClass}" role="cell">${escapeHtml(oppDurationText)}</strong>
      </div>
      <div class="quiz-result-row" role="row">
        <strong class="quiz-result-value quiz-result-status${ownOutcomeClass}" role="cell">${ownStatus}</strong>
        <span class="quiz-result-label" role="rowheader">Status</span>
        <strong class="quiz-result-value quiz-result-status${opponentOutcomeClass}" role="cell">${opponentStatus}</strong>
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
