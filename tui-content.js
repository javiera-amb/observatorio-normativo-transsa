(() => {
  "use strict";

  const newsItems = Array.isArray(window.NOTICIAS) ? [...window.NOTICIAS] : [];
  let newsScope = "Chile";
  let newsSearch = "";

  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));

  function injectStyles() {
    if (document.getElementById("newsModuleStyles")) return;
    const style = document.createElement("style");
    style.id = "newsModuleStyles";
    style.textContent = `
      .news-toolbar { display:flex; flex-wrap:wrap; justify-content:space-between; gap:14px; margin-bottom:22px; }
      .news-tabs { display:flex; flex-wrap:wrap; gap:8px; }
      .news-tab { min-height:40px; padding:0 14px; border:1px solid var(--line); border-radius:999px; color:var(--muted); background:#fff; }
      .news-tab.active { color:#fff; border-color:var(--transsa-blue); background:var(--transsa-blue); }
      .news-search { width:min(380px,100%); }
      .news-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
      .news-card { display:flex; flex-direction:column; min-height:300px; padding:23px; border:1px solid var(--line); border-radius:18px; background:#fff; }
      .news-card-top { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; }
      .news-badge, .news-scope { display:inline-flex; padding:6px 9px; border-radius:999px; font-size:.7rem; font-weight:600; }
      .news-badge { color:var(--transsa-blue); background:var(--transsa-pale); }
      .news-scope { color:var(--muted); background:var(--surface-soft); }
      .news-card h3 { margin:18px 0 8px; color:var(--transsa-navy); font-size:1.16rem; line-height:1.25; }
      .news-card p { color:var(--muted); font-size:.9rem; }
      .news-meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:auto; padding-top:16px; }
      .news-meta span { padding:5px 8px; border-radius:8px; color:var(--muted); background:var(--surface-soft); font-size:.72rem; }
      .news-review-note { margin-top:14px; padding:12px 13px; border-left:4px solid #d0922f; border-radius:0 10px 10px 0; background:#fff7e8; color:#76511c !important; font-size:.78rem !important; }
      .news-card a { margin-top:15px; color:var(--transsa-blue); font-weight:500; font-size:.82rem; }
      @media (max-width:760px){ .news-grid{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(style);
  }

  function insertNewsModule() {
    if (document.getElementById("newsIntegratedSection")) return;
    const dailyModule = document.getElementById("module-diario");
    if (!dailyModule) return;
    const section = document.createElement("section");
    section.id = "newsIntegratedSection";
    section.className = "news-integrated-section";
    section.innerHTML = `
      <div class="section-heading"><div><p class="eyebrow">INTELIGENCIA TERRITORIAL</p><h2>Noticias consolidadas</h2><p>Noticias vinculadas directamente con desarrollo inmobiliario, mercado de suelo, normativa urbana, vivienda y desarrollo urbano. No reemplazan el acto oficial.</p></div></div>
      <section class="search-panel"><div class="news-toolbar"><div class="news-tabs" role="tablist" aria-label="Alcance de las noticias"><button class="news-tab active" data-news-scope="Chile">Chile</button><button class="news-tab" data-news-scope="Internacional">Internacional</button><button class="news-tab" data-news-scope="Todas">Todas</button></div><input id="newsSearchInput" class="news-search" type="search" placeholder="Buscar territorio, fuente o tema…"></div><div id="newsResultCount" class="result-count"></div></section>
      <section class="reports-section"><div id="newsGrid" class="news-grid"></div><div id="newsEmptyState" class="empty-state" hidden><div>⌕</div><h3>No hay noticias para esta búsqueda</h3><p>Cambia el alcance o prueba con otro término.</p></div></section>`;
    dailyModule.appendChild(section);
    section.querySelectorAll("[data-news-scope]").forEach(button => button.addEventListener("click", () => {
      newsScope = button.dataset.newsScope;
      section.querySelectorAll("[data-news-scope]").forEach(item => item.classList.toggle("active", item === button));
      renderNews();
    }));
    section.querySelector("#newsSearchInput")?.addEventListener("input", event => { newsSearch = event.target.value.trim().toLowerCase(); renderNews(); });
  }

  function filteredNews() {
    return newsItems.filter(item => newsScope === "Todas" || item.alcance === newsScope).filter(item => {
      if (!newsSearch) return true;
      return [item.titulo, item.resumen, item.fuente, item.pais, item.region, ...(item.comunas || []), item.categoria, item.subcategoria].join(" ").toLowerCase().includes(newsSearch);
    }).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  function renderNews() {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    const items = filteredNews();
    grid.innerHTML = items.map(item => {
      const territory = item.alcance === "Internacional" ? [item.pais, item.region, ...(item.comunas || [])].filter(Boolean).join(" · ") : [item.region, ...(item.comunas || [])].filter(Boolean).join(" · ");
      return `<article class="news-card"><div class="news-card-top"><span class="news-badge">${escapeText(item.categoria)}</span><span class="news-scope">${escapeText(item.alcance)}</span></div><h3>${escapeText(item.titulo)}</h3><p>${escapeText(item.resumen)}</p>${item.estado_revision === "requires_review" ? `<p class="news-review-note">${escapeText(item.nota_validacion)}</p>` : ""}<div class="news-meta"><span>${escapeText(item.fecha)}</span><span>${escapeText(item.fuente)}</span><span>${escapeText(territory)}</span></div><a href="${escapeText(item.fuente_url)}" target="_blank" rel="noopener noreferrer">Abrir publicación original →</a></article>`;
    }).join("");
    document.getElementById("newsResultCount").textContent = `${items.length} ${items.length === 1 ? "noticia" : "noticias"}`;
    document.getElementById("newsEmptyState").hidden = items.length !== 0;
  }

  function loadScript(src, marker) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-tui-module="${marker}"]`)) { resolve(); return; }
      const script = document.createElement("script");
      script.src = src;
      script.dataset.tuiModule = marker;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadTablasNormativas() {
    const release = "20260902-d39410445be6";
    try {
      await loadScript(`data/tablas_normativas_sharepoint.js?v=${release}`, "tablas-normativas-sharepoint-data");
      await loadScript(`tablas-normativas-ipt-v2.js?v=${release}`, "tablas-normativas-ipt-v2");
      await loadScript(`data/tablas_normativas_chiguayante_ui.js?v=${release}`, "tablas-normativas-chiguayante-ui");
      await loadScript(`tablas-normativas-fuentes.js?v=${release}`, "tablas-normativas-fuentes");
    } catch (error) {
      console.error("No se pudo cargar Tablas Normativas IPT.", error);
    }
  }

  function init() {
    injectStyles();
    insertNewsModule();
    renderNews();
    loadTablasNormativas();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();