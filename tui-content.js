(() => {
  "use strict";

  const newsItems = Array.isArray(window.NOTICIAS) ? [...window.NOTICIAS] : [];
  let newsScope = "Chile";
  let newsSearch = "";

  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));

  function normalizedRegion(value = "") {
    let region = String(value).trim();
    if (!region) return "Chile";

    const directAliases = {
      "RM": "Metropolitana de Santiago",
      "Metropolitana": "Metropolitana de Santiago",
      "Región Metropolitana": "Metropolitana de Santiago",
      "Región Metropolitana de Santiago": "Metropolitana de Santiago",
      "Metropolitana de Santiago": "Metropolitana de Santiago",
      "Libertador Bernardo O'Higgins": "O'Higgins",
      "Libertador General Bernardo O'Higgins": "O'Higgins",
      "Libertador General Bernardo O’Higgins": "O'Higgins",
      "Región del Libertador General Bernardo O'Higgins": "O'Higgins",
      "Región del Libertador General Bernardo O’Higgins": "O'Higgins",
      "Aysén del General Carlos Ibáñez del Campo": "Aysén",
      "Región de Aysén del General Carlos Ibáñez del Campo": "Aysén",
      "Región de Magallanes y de la Antártica Chilena": "Magallanes y de la Antártica Chilena"
    };
    if (directAliases[region]) return directAliases[region];

    region = region
      .replace(/^Región\s+de\s+la\s+/i, "")
      .replace(/^Región\s+de\s+los\s+/i, "Los ")
      .replace(/^Región\s+del\s+/i, "")
      .replace(/^Región\s+de\s+/i, "")
      .replace(/^Región\s+/i, "")
      .trim();

    const aliases = {
      "la Araucanía": "La Araucanía",
      "Araucanía": "La Araucanía",
      "Maule": "Maule",
      "Ñuble": "Ñuble",
      "Biobío": "Biobío",
      "Los Ríos": "Los Ríos",
      "Los Lagos": "Los Lagos",
      "Coquimbo": "Coquimbo",
      "Valparaíso": "Valparaíso",
      "Antofagasta": "Antofagasta",
      "Atacama": "Atacama",
      "Tarapacá": "Tarapacá",
      "Arica y Parinacota": "Arica y Parinacota",
      "Magallanes y de la Antártica Chilena": "Magallanes y de la Antártica Chilena"
    };
    return aliases[region] || region;
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .territorial-map { display:block !important; min-height:560px !important; background:#eef0f7; }
      .map-loading, .map-fallback { min-height:560px; display:grid; place-items:center; padding:32px; text-align:center; color:var(--muted); background:linear-gradient(160deg,#f8f8ff,#eef0f7); }
      .map-fallback strong { display:block; margin-bottom:8px; color:var(--transsa-navy); font-size:1.1rem; }
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
      @media (max-width:760px){ .news-grid{grid-template-columns:1fr;} .territorial-map,.map-loading,.map-fallback{min-height:440px !important;} }
    `;
    document.head.appendChild(style);
  }

  function insertNewsModule() {
    if (document.getElementById("module-noticias")) return;

    const mapTab = document.querySelector('[data-module="mapa"]');
    const nav = document.querySelector(".module-nav");
    const newsTab = document.createElement("button");
    newsTab.className = "module-tab";
    newsTab.dataset.module = "noticias";
    newsTab.textContent = "Noticias";
    nav?.insertBefore(newsTab, mapTab || null);

    const mapModule = document.getElementById("module-mapa");
    const section = document.createElement("section");
    section.id = "module-noticias";
    section.className = "module-panel";
    section.innerHTML = `
      <div class="module-header">
        <div>
          <p class="eyebrow">INTELIGENCIA TERRITORIAL</p>
          <h2>Noticias consolidadas</h2>
          <p>Contexto de mercado, infraestructura y planificación. Las noticias no reemplazan el acto oficial ni determinan vigencia normativa.</p>
        </div>
      </div>
      <section class="search-panel">
        <div class="news-toolbar">
          <div class="news-tabs" role="tablist" aria-label="Alcance de las noticias">
            <button class="news-tab active" data-news-scope="Chile">Chile</button>
            <button class="news-tab" data-news-scope="Internacional">Internacional</button>
            <button class="news-tab" data-news-scope="Todas">Todas</button>
          </div>
          <input id="newsSearchInput" class="news-search" type="search" placeholder="Buscar territorio, fuente o tema…">
        </div>
        <div id="newsResultCount" class="result-count"></div>
      </section>
      <section class="reports-section">
        <div id="newsGrid" class="news-grid"></div>
        <div id="newsEmptyState" class="empty-state" hidden>
          <div>⌕</div>
          <h3>No hay noticias para esta búsqueda</h3>
          <p>Cambia el alcance o prueba con otro término.</p>
        </div>
      </section>
    `;
    mapModule?.parentNode?.insertBefore(section, mapModule);

    newsTab.addEventListener("click", () => {
      if (typeof switchModule === "function") switchModule("noticias");
      renderNews();
    });

    section.querySelectorAll("[data-news-scope]").forEach(button => {
      button.addEventListener("click", () => {
        newsScope = button.dataset.newsScope;
        section.querySelectorAll("[data-news-scope]").forEach(item => item.classList.toggle("active", item === button));
        renderNews();
      });
    });

    section.querySelector("#newsSearchInput")?.addEventListener("input", event => {
      newsSearch = event.target.value.trim().toLowerCase();
      renderNews();
    });
  }

  function filteredNews() {
    return newsItems
      .filter(item => newsScope === "Todas" || item.alcance === newsScope)
      .filter(item => {
        if (!newsSearch) return true;
        return [
          item.titulo, item.resumen, item.fuente, item.pais, item.region,
          ...(item.comunas || []), item.categoria, item.subcategoria
        ].join(" ").toLowerCase().includes(newsSearch);
      })
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  function renderNews() {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    const items = filteredNews();
    grid.innerHTML = items.map(item => {
      const territory = item.alcance === "Internacional"
        ? [item.pais, item.region, ...(item.comunas || [])].filter(Boolean).join(" · ")
        : [item.region, ...(item.comunas || [])].filter(Boolean).join(" · ");
      return `
        <article class="news-card">
          <div class="news-card-top">
            <span class="news-badge">${escapeText(item.categoria)}</span>
            <span class="news-scope">${escapeText(item.alcance)}</span>
          </div>
          <h3>${escapeText(item.titulo)}</h3>
          <p>${escapeText(item.resumen)}</p>
          ${item.estado_revision === "requires_review" ? `<p class="news-review-note">${escapeText(item.nota_validacion)}</p>` : ""}
          <div class="news-meta">
            <span>${escapeText(item.fecha)}</span>
            <span>${escapeText(item.fuente)}</span>
            <span>${escapeText(territory)}</span>
          </div>
          <a href="${escapeText(item.fuente_url)}" target="_blank" rel="noopener noreferrer">Abrir publicación original →</a>
        </article>
      `;
    }).join("");
    document.getElementById("newsResultCount").textContent = `${items.length} ${items.length === 1 ? "noticia" : "noticias"}`;
    document.getElementById("newsEmptyState").hidden = items.length !== 0;
  }

  function patchMapData() {
    if (typeof REGION_CENTERS === "undefined") return;

    normalizeRegionName = normalizedRegion;

    mapItems = function mapItemsPatched() {
      const daily = reports.map(item => ({
        source: "Diario Oficial",
        period: item.fecha ? String(item.fecha).slice(0, 7) : "",
        date: item.fecha || "",
        region: normalizedRegion(item.region || "Chile"),
        commune: item.comuna || "",
        title: item.titulo || "",
        summary: item.resumen || "",
        category: item.categoria || "",
        status: item.estado || "",
        sourceUrl: item.source_url || "",
        itemType: "daily"
      }));

      const ipt = iptReports.flatMap(report =>
        (Array.isArray(report.cambios) ? report.cambios : []).map(item => ({
          source: "IPT",
          period: report.periodo || "",
          date: item.fecha_publicacion || "",
          region: normalizedRegion(item.region || "Chile"),
          commune: item.comuna || "",
          title: [item.tipo_ipt, item.acto].filter(Boolean).join(" · "),
          summary: item.resumen || "",
          category: item.tipo_ipt || "",
          status: item.estado || "",
          sourceUrl: item.fuente || "",
          itemType: "ipt"
        }))
      );

      const historic = annualReports.flatMap(report =>
        (Array.isArray(report.items) ? report.items : []).map(item => ({
          source: "Histórico",
          period: item.periodo || "",
          date: item.fecha || "",
          region: normalizedRegion(item.region || "Chile"),
          commune: item.comuna || "",
          title: item.titulo || "",
          summary: item.resumen || "",
          category: item.categoria || item.tipo_norma || "",
          status: item.estado || "",
          sourceUrl: item.fuente || "",
          itemType: "historic"
        }))
      );

      const news = newsItems
        .filter(item => item.alcance === "Chile")
        .map(item => ({
          source: "Noticias",
          period: item.fecha ? String(item.fecha).slice(0, 7) : "",
          date: item.fecha || "",
          region: normalizedRegion(item.region || "Chile"),
          commune: (item.comunas || []).join(", "),
          title: item.titulo || "",
          summary: item.resumen || "",
          category: item.categoria || "",
          status: item.estado_revision || "preliminary",
          sourceUrl: item.fuente_url || "",
          itemType: "news"
        }));

      return [...daily, ...ipt, ...historic, ...news]
        .filter(item => item.region && REGION_CENTERS[item.region]);
    };

    const originalInit = initTerritorialMap;
    initTerritorialMap = function initTerritorialMapPatched() {
      const container = document.getElementById("territorialMap");
      if (!container) return;
      container.style.display = "block";
      container.style.minHeight = "560px";

      if (typeof L === "undefined") {
        container.innerHTML = `
          <div class="map-fallback">
            <div><strong>No se pudo cargar la librería del mapa.</strong><span>Revisa la conexión a internet y vuelve a abrir esta sección. Los registros territoriales siguen disponibles en el listado inferior.</span></div>
          </div>
        `;
        renderMapResults();
        return;
      }

      container.innerHTML = "";
      originalInit();
    };

    const originalRender = renderTerritorialMap;
    renderTerritorialMap = function renderTerritorialMapPatched() {
      const container = document.getElementById("territorialMap");
      if (container) {
        container.style.display = "block";
        container.style.visibility = "visible";
        container.style.minHeight = "560px";
      }
      originalRender();
      setTimeout(() => territorialMap?.invalidateSize({ pan: false }), 80);
      setTimeout(() => territorialMap?.invalidateSize({ pan: false }), 420);
      setTimeout(() => territorialMap?.invalidateSize({ pan: false }), 900);
    };

    populateMapFilters();
    if (location.hash === "#mapa" || document.getElementById("module-mapa")?.classList.contains("active")) {
      renderTerritorialMap();
    }
  }

  function bindMapTabAgain() {
    document.querySelectorAll('[data-module="mapa"], [data-module-jump="mapa"]').forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(() => renderTerritorialMap(), 60);
      });
    });
  }

  function init() {
    injectStyles();
    insertNewsModule();
    renderNews();
    patchMapData();
    bindMapTabAgain();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
