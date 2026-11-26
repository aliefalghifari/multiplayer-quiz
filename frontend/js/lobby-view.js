import { ui, refs } from "./state.js";

export function syncLobby() {
  const id = 1;
  const input = document.querySelector(`[data-name="${id}"]`);
  const connect = document.querySelector(`[data-connect="${id}"]`);
  const disconnect = document.querySelector(`[data-disconnect="${id}"]`);
  const indicator = document.querySelector(`[data-indicator="${id}"]`);
  if (!input || !connect || !disconnect || !indicator) return;
  if (input.value !== ui.names[id]) input.value = ui.names[id];
  input.disabled = ui.connected[id];
  connect.disabled = ui.connected[id] || !ui.names[id].trim();
  disconnect.disabled = !ui.connected[id];
  const online = ui.connected[id];
  indicator.className = `connection-indicator ${online ? "is-connected" : "is-disconnected"}`;
  const label = indicator.querySelector("[data-indicator-label]");
  if (label) label.textContent = online ? "Connected" : "Offline";
}
