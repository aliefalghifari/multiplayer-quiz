import { ui } from "./state.js";
import { escapeHtml } from "./escape.js";
import { formatElapsed } from "./game-hud.js";
import { saveStoredHistory, clearStoredHistory } from "./history-storage.js";

const OUTCOME_META = {
  win: { label: "Win", badgeClass: "outcome-win", scoreClass: "is-win" },
  lose: { label: "Lose", badgeClass: "outcome-lose", scoreClass: "is-lose" },
  draw: { label: "Draw", badgeClass: "outcome-draw", scoreClass: "" },
  aborted: { label: "Terhenti", badgeClass: "outcome-aborted", scoreClass: "" },
};

function formatMatchDate(timestamp) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function recordMatchHistory(quiz) {
  if (quiz.historySaved || quiz.startedAt === null) return;

  const scoreEntries = Object.entries(quiz.scores);
  const ownEntry =
    scoreEntries.find(([playerId]) => playerId === quiz.playerId) ||
    (!quiz.playerId ? scoreEntries[0] : null);
  const opponentEntry = scoreEntries.find(
    ([playerId]) => playerId !== ownEntry?.[0],
  );

  const ownName = ownEntry
    ? quiz.players[ownEntry[0]] || ui.names[1]?.trim() || "Anda"
    : quiz.players[quiz.playerId] || ui.names[1]?.trim() || "Anda";
  const opponentName = opponentEntry
    ? quiz.players[opponentEntry[0]] || quiz.opponent || "Lawan"
    : quiz.opponent || "Lawan";

  const hasBothScores = Boolean(ownEntry && opponentEntry);
  const ownScore = ownEntry ? ownEntry[1] : 0;
  const opponentScore = opponentEntry ? opponentEntry[1] : 0;

  let outcome = "aborted";
  if (quiz.completed && hasBothScores) {
    if (ownScore > opponentScore) outcome = "win";
    else if (ownScore < opponentScore) outcome = "lose";
    else outcome = "draw";
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playedAt: quiz.endedAt ?? Date.now(),
    ownName,
    opponentName,
    ownScore,
    opponentScore,
    hasBothScores,
    outcome,
    duration: formatElapsed(quiz.startedAt, quiz.endedAt ?? Date.now()),
    questions: (quiz.questionLog || []).map((item) => ({ ...item })),
  };

  ui.history = [entry, ...ui.history].slice(0, 50);
  quiz.historySaved = true;
  saveStoredHistory(ui.history);
}

export function clearHistory() {
  ui.history = [];
  ui.expandedHistoryIds = [];
  clearStoredHistory();
}

export function toggleHistoryReview(entryId) {
  if (ui.expandedHistoryIds.includes(entryId)) {
    ui.expandedHistoryIds = ui.expandedHistoryIds.filter((id) => id !== entryId);
  } else {
    ui.expandedHistoryIds = [...ui.expandedHistoryIds, entryId];
  }
}

function reviewMarkup(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return `<div class="history-review-panel">
      <p class="history-review-answer">Detail soal tidak tersedia untuk pertandingan ini.</p>
    </div>`;
  }

  const items = questions
    .map((item, idx) => {
      const letter =
        typeof item.selectedAnswer === "number"
          ? String.fromCharCode(65 + item.selectedAnswer)
          : null;
      const chosenText =
        letter && Array.isArray(item.options) && item.options[item.selectedAnswer]
          ? `${letter}. ${item.options[item.selectedAnswer]}`
          : "Tidak terjawab";

      const correctLetter =
        typeof item.correctAnswer === "number"
          ? String.fromCharCode(65 + item.correctAnswer)
          : null;
      const correctText =
        correctLetter && Array.isArray(item.options) && item.options[item.correctAnswer]
          ? `${correctLetter}. ${item.options[item.correctAnswer]}`
          : null;

      const statusLabel =
        item.isCorrect === true
          ? "Benar (+100)"
          : item.isCorrect === false
            ? "Kurang tepat"
            : "Belum dinilai";
      const statusClass =
        item.isCorrect === true
          ? "status-success"
          : item.isCorrect === false
            ? "status-error"
            : "status-waiting";

      return `<div class="history-review-item">
        <div class="history-review-item-head">
          <span>SOAL ${idx + 1}</span>
          <span class="activity-tag ${statusClass}">${statusLabel}</span>
        </div>
        <strong>${escapeHtml(item.question)}</strong>
        <p class="history-review-answer">Jawaban Anda: ${escapeHtml(chosenText)}</p>
        ${
          correctText
            ? `<p class="history-review-correct" style="color: ${item.isCorrect === false ? '#e11d48' : '#059669'}; font-weight: 600; margin-top: 4px;">Jawaban Benar: ${escapeHtml(correctText)}</p>`
            : ""
        }
      </div>`;
    })
    .join("");

  return `<div class="history-review-panel">${items}</div>`;
}

export function syncHistoryCount() {
  const count = document.getElementById("history-count");
  if (count) {
    const total = ui.history.length;
    count.textContent = `${total} ${total === 1 ? "MATCH" : "MATCHES"}`;
  }
  const clearBtn = document.querySelector("[data-clear-history]");
  if (clearBtn) {
    clearBtn.disabled = ui.history.length === 0;
  }
}

export function historyMarkup() {
  if (ui.history.length === 0) {
    return `<div class="activity-card">
      <div class="empty-state">
        <strong>Belum ada riwayat pertandingan</strong>
        <p>Selesaikan duel kuis 1v1 terlebih dahulu untuk melihat catatan kemenangan dan pembahasan soal di sini.</p>
        <div class="history-empty-action">
          <button class="hero-play-button" type="button" data-go-connect>Mulai Bermain</button>
        </div>
      </div>
    </div>`;
  }

  const cards = ui.history
    .map((entry) => {
      const meta = OUTCOME_META[entry.outcome] || OUTCOME_META.aborted;
      const initial = (entry.opponentName || "?").trim().charAt(0).toUpperCase() || "?";
      const isExpanded = ui.expandedHistoryIds.includes(entry.id);
      const scoreSummary = entry.hasBothScores
        ? `${entry.ownScore} vs ${entry.opponentScore} poin`
        : `${entry.ownScore} poin`;
      const pointsDelta = entry.ownScore > 0 ? `+${entry.ownScore}` : `${entry.ownScore}`;
      const questionCount = Array.isArray(entry.questions) ? entry.questions.length : 0;

      return `<article class="history-card">
        <div class="history-card-main">
          <div class="history-card-top">
            <span class="history-mode-badge">✦ Multiplayer Quiz</span>
            <span class="history-date">${escapeHtml(formatMatchDate(entry.playedAt))}</span>
          </div>
          <div class="history-matchup">
            <span class="history-vs">VS</span>
            <span class="history-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
            <div class="history-opponent-info">
              <strong>${escapeHtml(entry.opponentName || "Lawan")}</strong>
              <span>Pemain: ${escapeHtml(entry.ownName || "Anda")} • Durasi ${escapeHtml(entry.duration || "00:00")}</span>
            </div>
          </div>
          <div class="history-stats">
            <span class="history-outcome-badge ${meta.badgeClass}">${meta.label}</span>
            <span class="history-score-summary">
              <span>${escapeHtml(scoreSummary)}</span>
              <span class="history-score-points ${meta.scoreClass}">(${escapeHtml(pointsDelta)} pts)</span>
            </span>
          </div>
        </div>
        <div class="history-card-footer">
          <button
            class="history-review-button"
            type="button"
            data-toggle-review="${escapeHtml(entry.id)}"
            aria-expanded="${isExpanded ? "true" : "false"}"
          >
            ${isExpanded ? "Tutup Pembahasan" : "Lihat Pembahasan"}
          </button>
          <span class="history-date">${questionCount} soal</span>
        </div>
        ${isExpanded ? reviewMarkup(entry.questions) : ""}
      </article>`;
    })
    .join("");

  return `<p class="history-period">Riwayat Pertandingan Terbaru</p>
  <div class="history-list">${cards}</div>`;
}
