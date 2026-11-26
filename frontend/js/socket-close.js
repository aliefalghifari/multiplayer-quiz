import { ui, refs } from "./state.js";
import { setMessage } from "./status-view.js";
import { addLog } from "./log-view.js";
import { render } from "./render.js";

export function onClose(playerId, name, socket, event) {
  if (refs.sockets[playerId] === socket) {
    refs.sockets[playerId] = null;
    ui.connected[playerId] = false;
    const normal = event.code === 1000;
    setMessage({
      type: normal ? "info" : "error",
      status: normal ? "info" : "error",
      message: normal
        ? `${name} disconnected.`
        : `${name}'s connection closed (code ${event.code}).`,
    });
  }
  if (refs.activeSocket === socket) {
    refs.activeSocket = null;
    refs.activePlayerId = null;
    ui.canFindAgain = false;
    const stage = ui.quiz.stage;
    if (stage === "question" || stage === "starting") {
      ui.quiz.stage = "result";
      ui.quiz.endedAt = Date.now();
      ui.quiz.winnerText = "Koneksi ke server terputus.";
    }
  }
  addLog(
    name,
    `Connection closed (code ${event.code}).`,
    event.code === 1000 ? "info" : "error",
  );
  render();
}
