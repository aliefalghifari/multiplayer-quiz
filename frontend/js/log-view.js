import { ui } from "./state.js";
import { escapeHtml } from "./escape.js";

export function addLog(player, message, status = "info") {
  ui.logs.unshift({
    id: Date.now() + Math.random(),
    player,
    message,
    status,
  });
}

export function logMarkup() {
  if (ui.logs.length === 0) {
    return `<div class="empty-state"><strong>No activity yet</strong><p>Connection events will appear here.</p></div>`;
  }
  const rows = ui.logs
    .map(
      (log) => `<div class="activity-row">
        <span class="activity-indicator status-${log.status}"></span>
        <div class="activity-details">
          <strong>${escapeHtml(log.player)}</strong>
          <span>${escapeHtml(log.message)}</span>
        </div>
        <span class="activity-tag status-${log.status}">${escapeHtml(log.status)}</span>
      </div>`,
    )
    .join("");
  return `<div class="activity-list">${rows}</div>`;
}
