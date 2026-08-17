(() => {
  "use strict";
  const STATUS_CLASS = {
    APROBAR_A_01: "audit-ok",
    APROBAR_REFERENCIAL: "audit-okref",
    ACTUALIZAR_ANTES_DE_01: "audit-update",
    REEMPLAZAR_POR_VERSION_ACTUAL: "audit-replace",
    CONSOLIDAR_DUPLICADO: "audit-consolidate",
    REVISAR_FUENTE: "audit-review",
    REVISAR_FUENTE_CRS: "audit-reviewcrs",
    MANTENER_REFERENCIAL: "audit-ref",
    MANTENER_HISTORICO: "audit-historical",
  };
  const CATEGORY_ORDER = [
    "01 · Límites y escalas",
    "02 · Movilidad y transporte",
    "03 · Equipamiento y servicios",
    "04 · Infraestructura",
    "05 · Demografía y tejido urbano",
    "06 · Medio ambiente y riesgos",
    "07 · Propiedad y base territorial",
    "08 · Complementarias no normativas",
  ];
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const norm = value => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

  let filters = { q: "", status: "", category: "" };
  let rendering = false;

  function injectStyles() {
    if (document.getElementById("auditCatalogStyles")) return;
    const style = document.createElement("style");
    style.id = "auditCatalogStyles";
    style.textContent = `
      .audit-catalog-toolbar{margin:0 0 14px}
      .audit-status-chips{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-bottom:10px}
      .audit-status-chip{display:flex;align-items:center;gap:7px;padding:8px 9px;border:1px solid #e1e3e9;border-radius:10px;background:#fff;color:#596271;cursor:pointer;text-align:left;font:inherit;font-size:.56rem}
      .audit-status-chip strong{color:var(--transsa-navy);font-size:.95rem}.audit-status-chip.active{outline:2px solid var(--transsa-blue)}
      .audit-catalog-filters{display:grid;grid-template-columns:1.4fr .8fr .8fr auto;gap:8px;padding:10px;border-radius:11px;background:#f7f8fa}
      .audit-catalog-filters input,.audit-catalog-filters select,.audit-catalog-filters button{width:100%;min-height:39px;padding:8px 10px;border:1px solid #d8dbe3;border-radius:8px;background:#fff;color:#303946;font:inherit;font-size:.66rem}
      .audit-catalog-filters button{font-weight:700;cursor:pointer}
      .capas-catalog-grid.audit-mode{grid-template-columns:1fr}
      .audit-group{overflow:hidden;border:1px solid #e0e2e8;border-radius:14px;background:#fbfbfd}
      .audit-group>summary{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 16px;cursor:pointer;list-style:none}.audit-group>summary::-webkit-details-marker{display:none}
      .audit-group-title{display:flex;align-items:center;gap:9px}.audit-group-num{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--transsa-navy);color:#fff;font-size:.61rem;font-weight:750}
      .audit-group-title strong{color:var(--transsa-navy);font-size:.78rem}.audit-group-title small{display:block;margin-top:3px;color:#707987;font-size:.57rem}
      .audit-layer-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 12px 12px}
      .audit-layer{padding:11px;border:1px solid #e4e6eb;border-radius:10px;background:#fff}.audit-layer-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
      .audit-layer-name{color:var(--transsa-navy);font-size:.7rem;line-height:1.3}.audit-layer-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
      .audit-layer-meta span{display:block;padding:7px 8px;border:1px solid #e5e7ed;border-radius:8px;background:#fafbfc;color:#4e5867;font-size:.56rem;line-height:1.35}.audit-layer-meta b{display:block;margin-bottom:2px;color:#7a8290;font-size:.47rem;text-transform:uppercase}
      .audit-badge{flex:none;padding:5px 7px;border-radius:999px;font-size:.5rem;font-weight:750;white-space:nowrap}.audit-ok{background:#e4f5ec;color:#176342}.audit-okref{background:#e8f3ed;color:#2b6851}.audit-update{background:#fff3cf;color:#735110}.audit-replace{background:#fde8ea;color:#922f38}.audit-consolidate{background:#e7efff;color:#315a9e}.audit-review{background:#f2eaff;color:#6a4494}.audit-reviewcrs{background:#ffe9e0;color:#914a29}.audit-ref{background:#edf0f4;color:#596473}.audit-historical{background:#e6e8ec;color:#424a57}
      .audit-empty{padding:24px;border:1px dashed #d7d9e0;border-radius:12px;color:#707987;text-align:center;font-size:.68rem}
      @media(max-width:1000px){.audit-status-chips{grid-template-columns:repeat(3,1fr)}.audit-layer-list{grid-template-columns:1fr}.audit-catalog-filters{grid-template-columns:1fr 1fr}}
      @media(max-width:680px){.audit-status-chips,.audit-catalog-filters{grid-template-columns:1fr}.audit-layer-meta{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureToolbar(section, data) {
    let toolbar = document.getElementById("auditCatalogToolbar");
    if (toolbar) return toolbar;
    toolbar = document.createElement("div");
    toolbar.id = "auditCatalogToolbar";
    toolbar.className = "audit-catalog-toolbar";
    const counts = data.capas.reduce((acc, row) => { acc[row.s] = (acc[row.s] || 0) + 1; return acc; }, {});
    const statusEntries = Object.entries(data.estados).filter(([key]) => counts[key]);
    toolbar.innerHTML = `
      <div class="audit-status-chips">${statusEntries.map(([key,label]) => `<button type="button" class="audit-status-chip" data-audit-status="${esc(key)}"><strong>${counts[key]}</strong><span>${esc(label)}</span></button>`).join("")}</div>
      <div class="audit-catalog-filters">
        <input id="auditCatalogSearch" type="search" placeholder="Buscar capa, origen o fecha…">
        <select id="auditCatalogStatus"><option value="">Todos los estados (${data.capas.length})</option>${statusEntries.map(([key,label]) => `<option value="${esc(key)}">${esc(label)} (${counts[key]})</option>`).join("")}</select>
        <select id="auditCatalogCategory"><option value="">Todas las categorías</option>${CATEGORY_ORDER.map(c => `<option value="${esc(c)}">${esc(c.replace(/^\d+ · /,""))}</option>`).join("")}</select>
        <button id="auditCatalogClear" type="button">Limpiar</button>
      </div>`;
    const grid = document.getElementById("capasCatalogGrid");
    section.insertBefore(toolbar, grid);
    toolbar.querySelector("#auditCatalogSearch").addEventListener("input", e => { filters.q = e.target.value; render(); });
    toolbar.querySelector("#auditCatalogStatus").addEventListener("change", e => { filters.status = e.target.value; render(); });
    toolbar.querySelector("#auditCatalogCategory").addEventListener("change", e => { filters.category = e.target.value; render(); });
    toolbar.querySelector("#auditCatalogClear").addEventListener("click", () => {
      filters = { q:"", status:"", category:"" };
      toolbar.querySelector("#auditCatalogSearch").value = "";
      toolbar.querySelector("#auditCatalogStatus").value = "";
      toolbar.querySelector("#auditCatalogCategory").value = "";
      render();
    });
    toolbar.querySelector(".audit-status-chips").addEventListener("click", e => {
      const btn = e.target.closest("[data-audit-status]"); if (!btn) return;
      filters.status = filters.status === btn.dataset.auditStatus ? "" : btn.dataset.auditStatus;
      toolbar.querySelector("#auditCatalogStatus").value = filters.status;
      render();
    });
    return toolbar;
  }

  function render() {
    if (rendering) return;
    const data = window.CATALOGO_AUDITORIA_TUI;
    const grid = document.getElementById("capasCatalogGrid");
    const section = grid?.closest(".capas-catalog-section");
    if (!data?.capas?.length || !grid || !section) return;
    rendering = true;
    injectStyles();
    ensureToolbar(section, data);
    const heading = section.querySelector(".capas-section-heading > div:first-child");
    if (heading) heading.innerHTML = `<p class="eyebrow">BLOQUE 1 · CATÁLOGO NACIONAL</p><h3>Todas las capas y su estado de auditoría</h3><p>Las ${data.capas.length} capas permanecen visibles aunque estén aprobadas, en revisión, pendientes de actualización o por consolidar. Cada ficha muestra nombre normalizado, origen, fecha y estado QA.</p>`;
    const count = document.getElementById("capasCatalogCount");
    if (count) count.textContent = `${data.capas.length} capas · ${CATEGORY_ORDER.length} categorías`;
    const query = norm(filters.q);
    const rows = data.capas.filter(row =>
      (!filters.status || row.s === filters.status) &&
      (!filters.category || row.c === filters.category) &&
      (!query || norm([row.n,row.r,row.o,row.d,data.estados[row.s]].join(" ")).includes(query))
    );
    grid.classList.add("audit-mode");
    grid.dataset.auditCatalog = "1";
    grid.innerHTML = CATEGORY_ORDER.map(category => {
      const items = rows.filter(row => row.c === category);
      if (!items.length) return "";
      const num = category.slice(0,2), label = category.replace(/^\d+ · /,"");
      return `<details class="audit-group" open><summary><span class="audit-group-title"><span class="audit-group-num">${esc(num)}</span><span><strong>${esc(label)}</strong><small>${items.length} ${items.length === 1 ? "capa" : "capas"}</small></span></span></summary><div class="audit-layer-list">${items.map(row => `<article class="audit-layer" title="Dataset técnico: ${esc(row.r)}"><div class="audit-layer-top"><div><strong class="audit-layer-name">${esc(row.n)}</strong><div class="audit-layer-meta"><span><b>Origen</b>${esc(row.o)}</span><span><b>Fecha</b>${esc(row.d)}</span></div></div><span class="audit-badge ${STATUS_CLASS[row.s] || "audit-review"}">${esc(data.estados[row.s] || row.s)}</span></div></article>`).join("")}</div></details>`;
    }).join("") || `<div class="audit-empty">No hay capas para los filtros seleccionados.</div>`;
    document.querySelectorAll(".audit-status-chip").forEach(btn => btn.classList.toggle("active", btn.dataset.auditStatus === filters.status));
    rendering = false;
  }

  function init() {
    render();
    setTimeout(render, 250);
    setTimeout(render, 900);
    const grid = document.getElementById("capasCatalogGrid");
    if (grid) {
      const observer = new MutationObserver(() => {
        if (rendering) return;
        if (grid.dataset.auditCatalog !== "1" || !grid.querySelector(".audit-group")) setTimeout(render, 0);
      });
      observer.observe(grid, { childList:true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
