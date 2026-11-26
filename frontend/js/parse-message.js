import { setMessage } from "./status-view.js";
import { addLog } from "./log-view.js";
import { applyEvent } from "./apply-event.js";
import { render } from "./render.js";

const STATUSES = ["waiting", "success", "error", "info"];

export function onMessage(playerName, raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const message = {
      type: "error",
      status: "error",
      message: "Invalid message received from the server.",
    };
    setMessage(message);
    addLog(playerName, message.message, message.status);
    render();
    return;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return;
  }
  const eventType =
    typeof parsed.type === "string"
      ? parsed.type
      : typeof parsed.event === "string"
        ? parsed.event
        : "message";
  const status = STATUSES.includes(parsed.status) ? parsed.status : "info";
  const message = {
    type: eventType,
    status,
    message: typeof parsed.message === "string" ? parsed.message : raw,
  };
  setMessage(message);
  addLog(playerName, message.message, message.status);
  applyEvent(eventType, parsed, message);
  render();
}
