import { loadPartials } from "./partials.js";
import { bindPage } from "./bind.js";
import { render } from "./render.js";

async function boot() {
  await loadPartials();
  bindPage();
  render();
}

boot().catch((error) => {
  document.body.textContent = error instanceof Error ? error.message : "Gagal memuat halaman.";
});
