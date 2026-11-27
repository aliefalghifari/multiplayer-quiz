const PARTS = [
  ["slot-hero", "partials/hero.html"],
  ["slot-players", "partials/players.html"],
  ["slot-status", "partials/status.html"],
  ["slot-log", "partials/log.html"],
  ["slot-history", "partials/history.html"],
];

export async function loadPartials() {
  await Promise.all(
    PARTS.map(async ([id, url]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal memuat ${url}`);
      }
      el.innerHTML = await response.text();
    }),
  );
}
