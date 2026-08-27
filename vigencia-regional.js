(() => {
  "use strict";

  const state = { search: "", sort: "nombre" };
  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function sourceRows() {
    if (typeof vigenciaInstruments === "function") return vigenciaInstruments();
    return Array.isArray(window.VIGENCIA_CARTOGRAFICA?.instrumentos)
      ? window.VIGENCIA_CARTOGRAFICA.instrumentos
      : [];
  }

  function communeRows() {
    const rows = new Map();
    sourceRows().forEach(item => {
      const key = `${normalize(item.region)}|${normalize(item.comuna)}`;
      const current = rows.get(key) || {
        region: item.region || "Región sin identificar",
        comuna: item.comuna || "Comuna sin identificar",
        instrumentos: 0,
        actos: 0,
        alertas: 0,
      };
      current.instrumentos = Math.max(current.instrumentos, Number(item.cantidad_instrumentos || item.instrumentos?.length || 1));
      current.actos = Math.max(current.actos, Number(item.cantidad_actos || item.actos_normativos?.length || 0));
      current.alertas = Math.max(current.alertas, Number(item.actos_posteriores_pendientes || 0));
      rows.set(key, current);
    });
    return [...rows.values()];
  }

  function openCommune(commune) {
    const input = document.getElementById("vigenciaSearchInput");
    if (!input) return;
    input.value = commune;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => {
      const card = [...document.querySelectorAll("[data-vigencia-id]")]
        .find(item => normalize(item.textContent).includes(normalize(commune)));
      card?.click();
      document.querySelector(".vigencia-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function render() {
    const host = document.getElementById("vigenciaRegionGrid");
    if (!host) return;
    const query = normalize(state.search);
    const grouped = new Map();
    communeRows().forEach(row => {
      if (query && !normalize(`${row.region} ${row.comuna}`).includes(query)) return;
      if (!grouped.has(row.region)) grouped.set(row.region, []);
      grouped.get(row.region).push(row);
    });
    const regions = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
    host.innerHTML = regions.map(([region, communes]) => {
      const sorted = [...communes].sort((a, b) => {
        if (state.sort === "pendientes") return b.alertas - a.alertas || a.comuna.localeCompare(b.comuna, "es");
        if (state.sort === "instrumentos") return b.instrumentos - a.instrumentos || a.comuna.localeCompare(b.comuna, "es");
        return a.comuna.localeCompare(b.comuna, "es");
      });
      const instruments = sorted.reduce((sum, row) => sum + row.instrumentos, 0);
      const pending = sorted.filter(row => row.alertas > 0).length;
      return `<details class="vigencia-region">
        <summary><span><strong>${escape(region)}</strong><small>${sorted.length} comunas · ${instruments} instrumentos aplicables</small></span><span class="vigencia-region-summary"><b>${pending}</b> comunas con controles</span></summary>
        <div class="vigencia-region-body">${sorted.map(row => `<button type="button" data-vigencia-commune="${escape(row.comuna)}"><strong>${escape(row.comuna)}</strong><small>${row.instrumentos} IPT · ${row.actos} actos asociados</small><span>${row.alertas ? `${row.alertas} controles pendientes` : "Sin controles posteriores detectados"}</span></button>`).join("")}</div>
      </details>`;
    }).join("") || `<div class="capas-region-empty">No hay comunas para esta búsqueda.</div>`;
    const counter = document.getElementById("vigenciaRegionsCount");
    if (counter) counter.textContent = `${regions.length} regiones · ${regions.reduce((sum, [, rows]) => sum + rows.length, 0)} comunas`;
  }

  function bind() {
    const search = document.getElementById("vigenciaRegionSearch");
    const sort = document.getElementById("vigenciaRegionSort");
    if (search && !search.dataset.bound) {
      search.dataset.bound = "true";
      search.addEventListener("input", event => { state.search = event.target.value; render(); });
    }
    if (sort && !sort.dataset.bound) {
      sort.dataset.bound = "true";
      sort.addEventListener("change", event => { state.sort = event.target.value; render(); });
    }
    const host = document.getElementById("vigenciaRegionGrid");
    if (host && !host.dataset.bound) {
      host.dataset.bound = "true";
      host.addEventListener("click", event => {
        const button = event.target.closest("[data-vigencia-commune]");
        if (button) openCommune(button.dataset.vigenciaCommune);
      });
    }
  }

  window.renderVigenciaRegional = function renderVigenciaRegional() {
    bind();
    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.renderVigenciaRegional, { once: true });
  } else {
    window.renderVigenciaRegional();
  }
})();
