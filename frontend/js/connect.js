import { ui, refs } from "./state.js";
import { socketUrl } from "./socket-url.js";
import { setMessage } from "./status-view.js";
import { addLog } from "./log-view.js";
import { onMessage } from "./parse-message.js";
import { onClose } from "./socket-close.js";
import { render } from "./render.js";

export function connectPlayer(playerId) {
  const name = ui.names[playerId].trim();
  if (!name) {
    setMessage({
      type: "error",
      status: "error",
      message: "Player name cannot be empty.",
    });
    render();
    return;
  }
  if (refs.activePlayerId !== null && refs.activePlayerId !== playerId) return;
  const existing = refs.sockets[playerId];
  const busy = WebSocket.OPEN;
  const opening = WebSocket.CONNECTING;
  if (existing && (existing.readyState === busy || existing.readyState === opening)) {
    return;
  }
  const socket = new WebSocket(socketUrl(name));
  refs.sockets[playerId] = socket;
  refs.activeSocket = socket;
  refs.activePlayerId = playerId;
  setMessage({
    type: "info",
    status: "waiting",
    message: `${name} is connecting to the server...`,
  });
  addLog(name, "Connecting to server.", "waiting");
  render();
  socket.onopen = () => {
    ui.connected[playerId] = true;
    ui.canFindAgain = true;
    setMessage({
      type: "success",
      status: "success",
      message: `${name} connected to the server.`,
    });
    addLog(name, "WebSocket connection established.", "success");
    render();
  };
  socket.onmessage = (event) => onMessage(name, event.data);
  socket.onerror = () => {
    setMessage({
      type: "error",
      status: "error",
      message: `WebSocket error for ${name}. Check the backend server.`,
    });
    addLog(name, "WebSocket error.", "error");
    render();
  };
  socket.onclose = (event) => onClose(playerId, name, socket, event);
}
