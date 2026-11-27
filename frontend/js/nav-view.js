import { ui } from "./state.js";
import { render } from "./render.js";

const VALID_TABS = new Set(["hero", "connect", "history"]);
let noticeTimer = null;

export function showNavNotice(message) {
  ui.navNotice = message;
  if (noticeTimer !== null) {
    window.clearTimeout(noticeTimer);
  }
  noticeTimer = window.setTimeout(() => {
    ui.navNotice = "";
    noticeTimer = null;
    render();
  }, 3200);
  render();
}

export function clearNavNotice() {
  if (noticeTimer !== null) {
    window.clearTimeout(noticeTimer);
    noticeTimer = null;
  }
  ui.navNotice = "";
}

export function navigateTo(tab, { focusName = false } = {}) {
  if (ui.quiz.stage !== "lobby") {
    showNavNotice("Anda tidak dapat berpindah halaman pada saat kuis berlangsung.");
    return;
  }
  if (!VALID_TABS.has(tab)) return;
  ui.activeTab = tab;
  clearNavNotice();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (focusName) {
    window.requestAnimationFrame(() => {
      const input = document.getElementById("player-name");
      if (input instanceof HTMLInputElement && !input.disabled) {
        input.focus();
      }
    });
  }
}

export function syncNavbar() {
  const locked = ui.quiz.stage !== "lobby";
  document.querySelectorAll("[data-nav]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const isActive = button.dataset.nav === ui.activeTab;
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-locked", locked);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
    if (locked) {
      button.setAttribute("aria-disabled", "true");
    } else {
      button.removeAttribute("aria-disabled");
    }
  });

  document.querySelectorAll(".tab-view[data-view]").forEach((view) => {
    if (!(view instanceof HTMLElement)) return;
    view.hidden = view.dataset.view !== ui.activeTab;
  });

  const notice = document.getElementById("nav-notice");
  if (notice) {
    notice.hidden = !ui.navNotice;
    notice.textContent = ui.navNotice;
  }
}
