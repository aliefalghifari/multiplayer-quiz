import { ui } from "./state.js";
import { escapeHtml } from "./escape.js";

export function setMessage(message) {
  ui.serverMessage = message;
}

export function statusMarkup() {
  const { status, message } = ui.serverMessage;
  const shimmer =
    status === "waiting"
      ? `<div class="status-shimmer-track" aria-hidden="true">
          <span class="skeleton-shimmer skeleton-line skeleton-line-sm"></span>
          <span class="skeleton-shimmer skeleton-line skeleton-line-sm"></span>
        </div>`
      : "";
  return `<div class="status-message status-${status}"${status === "waiting" ? ' aria-busy="true"' : ""}>
    <span class="status-indicator"></span>
    <div class="status-body">
      <p>${escapeHtml(message)}</p>
      ${shimmer}
    </div>
  </div>`;
}
