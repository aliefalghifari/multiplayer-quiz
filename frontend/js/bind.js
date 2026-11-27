import { ui } from "./state.js";
import { connectPlayer } from "./connect.js";
import { disconnectPlayer, returnToLobby } from "./disconnect.js";
import { submitAnswer, confirmAnswer, findMatchAgain } from "./actions.js";
import { navigateTo } from "./nav-view.js";
import { clearHistory, toggleHistoryReview } from "./history-view.js";
import { syncLobby } from "./lobby-view.js";
import { render } from "./render.js";

export function bindPage() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const navBtn = target.closest("[data-nav]");
    if (navBtn instanceof HTMLElement) {
      navigateTo(navBtn.dataset.nav);
      return;
    }
    if (target.closest("[data-go-connect]")) {
      navigateTo("connect", { focusName: true });
      return;
    }
    const reviewBtn = target.closest("[data-toggle-review]");
    if (reviewBtn instanceof HTMLElement) {
      toggleHistoryReview(reviewBtn.dataset.toggleReview);
      render();
      return;
    }
    if (target.closest("[data-clear-history]")) {
      clearHistory();
      render();
      return;
    }
    const disconnect = target.closest("[data-disconnect]");
    if (disconnect) {
      disconnectPlayer(Number(disconnect.dataset.disconnect));
      return;
    }
    if (target.closest("[data-home]")) {
      returnToLobby();
      return;
    }
    const option = target.closest("[data-option]");
    if (option) {
      submitAnswer(Number(option.dataset.option));
      return;
    }
    if (target.closest("[data-next-question]")) {
      confirmAnswer();
      return;
    }
    if (target.closest("[data-replay]")) findMatchAgain();
    else if (target.closest("[data-clear-log]")) {
      ui.logs = [];
      render();
    }
  });
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-player-form]")) return;
    event.preventDefault();
    connectPlayer(1);
  });
  document.addEventListener("input", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (!field.matches("[data-name]")) return;
    ui.names[Number(field.dataset.name)] = field.value;
    syncLobby();
  });
}
