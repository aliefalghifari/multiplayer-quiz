import { ui } from "./state.js";
import { escapeHtml } from "./escape.js";

export function setMessage(message) {
  ui.serverMessage = message;
}

export function statusMarkup() {
  const { status, message } = ui.serverMessage;
  return `<div class="status-message status-${status}"><span class="status-indicator"></span><p>${escapeHtml(message)}</p></div>`;
}
