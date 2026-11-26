import { ui } from "./state.js";
import { statusMarkup } from "./status-view.js";
import { logMarkup } from "./log-view.js";
import { syncLobby } from "./lobby-view.js";
import { syncQuiz } from "./quiz-view.js";

export function render() {
  const lobby = document.getElementById("lobby");
  const screen = document.getElementById("quiz-screen");
  const playing = ui.quiz.stage !== "lobby";
  if (lobby) lobby.hidden = playing;
  if (screen) screen.hidden = !playing;
  syncLobby();
  const status = document.getElementById("status-container");
  if (status) status.innerHTML = statusMarkup();
  const activity = document.getElementById("activity-card");
  if (activity) activity.innerHTML = logMarkup();
  syncQuiz();
}
