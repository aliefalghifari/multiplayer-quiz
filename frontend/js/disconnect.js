import { ui, refs, initialQuiz } from "./state.js";
import { addLog } from "./log-view.js";
import { clearNavNotice } from "./nav-view.js";
import { render } from "./render.js";

export function disconnectPlayer(playerId) {
  const socket = refs.sockets[playerId];
  if (!socket) return;
  const open = socket.readyState === WebSocket.OPEN;
  const opening = socket.readyState === WebSocket.CONNECTING;
  if (open || opening) socket.close(1000, "Disconnected by user");
  refs.sockets[playerId] = null;
  if (refs.activeSocket === socket) {
    refs.activeSocket = null;
    refs.activePlayerId = null;
  }
  ui.canFindAgain = false;
  ui.connected[playerId] = false;
  ui.quiz = initialQuiz();
  clearNavNotice();
  addLog(ui.names[playerId], "Disconnect requested.", "info");
  render();
}

export function returnToLobby() {
  if (refs.activePlayerId !== null) {
    disconnectPlayer(refs.activePlayerId);
    return;
  }
  ui.quiz = initialQuiz();
  ui.canFindAgain = false;
  clearNavNotice();
  render();
}
