const reports = Array.isArray(window.REPORTES) ? [...window.REPORTES] : [];
const iptReports = Array.isArray(window.IPT_REPORTES) ? [...window.IPT_REPORTES] : [];
const annualReports = Array.isArray(window.HISTORICOS) ? [...window.HISTORICOS] : [];
const vigenciaData = window.VIGENCIA_CARTOGRAFICA && typeof window.VIGENCIA_CARTOGRAFICA === "object"
  ? window.VIGENCIA_CARTOGRAFICA
  : { resumen: {}, instrumentos: [], word_url: "", csv_url: "" };

const $ = (id) => document.getElementById(id);
const state = { search: "", scale: "", category: "", status: "" };
const iptState = { search: "", region: "", status: "" };
const annualState = { search: "", month: "", module: "", region: "" };
const mapState = { search: "", module: "", period: "", region: "", selectedRegion: "" };
const vigenciaState = { search: "", region: "", type: "", status: "", selectedId: "" };
let territorialMap = null;
let territorialLayer = null;
let vigenciaMap = null;
let vigenciaBaseLayer = null;
let vigenciaOverlayLayer = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function formatDate(value, short = false) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-CL", short
    ? { day: "2-digit", month: "short" }
    : { day: "numeric", month: "long", year: "numeric" }
  ).format(date);
}

function formatPeriod(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || "—";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 15));
}

function uniqueValues(items, key) {
  return [...new Set(items.map(item => item[key]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));
}

function addOptions(select, values) {
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function switchModule(moduleName) {
  document.querySelectorAll(".module-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.module === moduleName);
  });

  document.querySelectorAll(".module-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `module-${moduleName}`);
  });

  history.replaceState(null, "", `#${moduleName}`);
  if (moduleName === "mapa") {
    setTimeout(renderTerritorialMap, 80);
    setTimeout(() => territorialMap?.invalidateSize({ pan: false }), 350);
  }
  if (moduleName === "vigencia") {
    setTimeout(() => {
      renderVigencia();
      vigenciaMap?.invalidateSize({ pan: false });
    }, 80);
  }
  if (moduleName === "seguimiento" && typeof window.renderSeguimientoNormativo === "function") {
    setTimeout(window.renderSeguimientoNormativo, 40);
  }
  if (moduleName === "capas" && typeof window.renderCapasTerritoriales === "function") {
    setTimeout(window.renderCapasTerritoriales, 40);
  }
}

function filteredReports() {
  const q = state.search.trim().toLowerCase();

  return reports
    .filter(r => !state.scale || r.escala === state.scale)
    .filter(r => !state.category || r.categoria === state.category)
    .filter(r => !state.status || r.estado === state.status)
    .filter(r => {
      if (!q) return true;
      return [
        r.titulo, r.region, r.comuna, r.organismo, r.tipo_norma,
        r.numero, r.categoria, r.resumen, r.implicancia, r.impactados
      ].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function renderMetrics() {
  const withChanges = reports.filter(r => r.estado === "Con novedades").length;
  const communes = new Set(reports.map(r => r.comuna).filter(Boolean)).size;
  const latestDate = reports.map(r => r.fecha).sort().reverse()[0];

  $("metricTotal").textContent = reports.length;
  $("metricChanges").textContent = withChanges;
  $("metricCommunes").textContent = communes;
  $("metricDate").textContent = latestDate ? formatDate(latestDate, true) : "—";
}

function renderLatest() {
  const latest = [...reports].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (!latest) return;

  $("latestCard").innerHTML = `
    <span class="latest-label">ÚLTIMO REPORTE · ${formatDate(latest.fecha).toUpperCase()}</span>
    <h3>${escapeHtml(latest.titulo)}</h3>
    <p>${escapeHtml(latest.resumen)}</p>
    <div class="latest-meta">
      <div><span>Escala</span><strong>${escapeHtml(latest.escala)}</strong></div>
      <div><span>Materia</span><strong>${escapeHtml(latest.categoria)}</strong></div>
      <div><span>Territorio</span><strong>${escapeHtml(latest.comuna || latest.region)}</strong></div>
    </div>
    <button class="open-report" data-daily-index="${reports.indexOf(latest)}">
      Leer reporte completo
    </button>
  `;
}

function dailyCardTemplate(report) {
  const index = reports.indexOf(report);
  const noChanges = report.estado === "Sin novedades";

  return `
    <article class="report-card">
      <div class="card-top">
        <span class="status-pill ${noChanges ? "none" : "change"}">
          ${escapeHtml(report.estado)}
        </span>
        <span class="scale-pill">${escapeHtml(report.escala)}</span>
      </div>
      <h3>${escapeHtml(report.titulo)}</h3>
      <p class="card-date">${formatDate(report.fecha)}</p>
      <p class="card-summary">${escapeHtml(report.resumen)}</p>
      <div class="card-footer">
        <span>${escapeHtml(report.comuna || report.region || "Chile")}</span>
        <button data-daily-index="${index}">Ver detalle →</button>
      </div>
    </article>
  `;
}

function renderReports() {
  const filtered = filteredReports();
  $("reportGrid").innerHTML = filtered.map(dailyCardTemplate).join("");
  $("resultCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`;
  $("emptyState").hidden = filtered.length !== 0;
}

function showDailyReport(index) {
  const r = reports[Number(index)];
  if (!r) return;

  $("dialogContent").innerHTML = `
    <div class="dialog-header">
      <span class="status-pill ${r.estado === "Sin novedades" ? "none" : "change"}">
        ${escapeHtml(r.estado)}
      </span>
      <h2>${escapeHtml(r.titulo)}</h2>
      <p class="card-date">${formatDate(r.fecha)}</p>
    </div>

    <div class="detail-grid">
      <div class="detail-item"><span>Escala territorial</span><strong>${escapeHtml(r.escala)}</strong></div>
      <div class="detail-item"><span>Materia</span><strong>${escapeHtml(r.categoria)}</strong></div>
      <div class="detail-item"><span>Organismo</span><strong>${escapeHtml(r.organismo)}</strong></div>
      <div class="detail-item"><span>Tipo y número</span><strong>${escapeHtml([r.tipo_norma, r.numero].filter(Boolean).join(" · "))}</strong></div>
      <div class="detail-item"><span>Región</span><strong>${escapeHtml(r.region || "—")}</strong></div>
      <div class="detail-item"><span>Comuna</span><strong>${escapeHtml(r.comuna || "—")}</strong></div>
    </div>

    <div class="dialog-section">
      <h3>Qué se publicó</h3>
      <p>${escapeHtml(r.resumen)}</p>
    </div>
    <div class="dialog-section">
      <h3>Implicancia práctica</h3>
      <p>${escapeHtml(r.implicancia)}</p>
    </div>
    <div class="dialog-section">
      <h3>A quién podría impactar</h3>
      <p>${escapeHtml(r.impactados)}</p>
    </div>

    ${(r.word_url || r.source_url) ? `
      <div class="dialog-actions">
        ${r.word_url ? `
          <a class="dialog-primary-link" href="${escapeAttribute(r.word_url)}" download>
            Descargar reporte Word
          </a>
        ` : ""}
        ${r.source_url ? `
          <a class="dialog-secondary-link" href="${escapeAttribute(r.source_url)}"
             target="_blank" rel="noopener noreferrer">
            Ver fuente oficial
          </a>
        ` : ""}
      </div>
    ` : ""}
  `;

  $("reportDialog").showModal();
}

function iptAllChanges() {
  return iptReports.flatMap(report =>
    (Array.isArray(report.cambios) ? report.cambios : []).map(change => ({
      ...change,
      periodo: report.periodo,
      reportIndex: iptReports.indexOf(report)
    }))
  );
}

function filteredIptReports() {
  const q = iptState.search.trim().toLowerCase();

  return iptReports
    .map((report, reportIndex) => {
      const changes = (Array.isArray(report.cambios) ? report.cambios : [])
        .filter(change => !iptState.region || change.region === iptState.region)
        .filter(change => !iptState.status || change.estado === iptState.status)
        .filter(change => {
          if (!q) return true;
          return [
            report.periodo, report.resumen_ejecutivo,
            change.region, change.comuna, change.tipo_ipt, change.acto,
            change.estado, change.resumen, change.fuente
          ].join(" ").toLowerCase().includes(q);
        });

      const reportMatchesText = !q || [
        report.periodo,
        report.titulo,
        report.resumen_ejecutivo
      ].join(" ").toLowerCase().includes(q);

      if ((q || iptState.region || iptState.status) && changes.length === 0 && !reportMatchesText) {
        return null;
      }

      return { ...report, cambiosFiltrados: changes, originalIndex: reportIndex };
    })
    .filter(Boolean)
    .sort((a, b) => b.periodo.localeCompare(a.periodo));
}

function renderIptMetrics() {
  const allChanges = iptAllChanges();
  const communes = new Set(allChanges.map(change => change.comuna).filter(Boolean)).size;
  const latestPeriod = iptReports.map(report => report.periodo).filter(Boolean).sort().reverse()[0];

  $("iptMetricReports").textContent = iptReports.length;
  $("iptMetricChanges").textContent = allChanges.length;
  $("iptMetricCommunes").textContent = communes;
  $("iptMetricPeriod").textContent = latestPeriod ? formatPeriod(latestPeriod) : "—";
}

function iptCardTemplate(report) {
  const changes = report.cambiosFiltrados || report.cambios || [];
  const communes = new Set(changes.map(change => change.comuna).filter(Boolean)).size;
  const regions = new Set(changes.map(change => change.region).filter(Boolean)).size;

  return `
    <article class="ipt-report-card">
      <div class="ipt-card-header">
        <div>
          <span class="ipt-period">${escapeHtml(formatPeriod(report.periodo))}</span>
          <h3>${escapeHtml(report.titulo || `Actualizaciones IPT · ${formatPeriod(report.periodo)}`)}</h3>
          <p>${escapeHtml(report.resumen_ejecutivo || "Reporte mensual de cambios en instrumentos de planificación territorial.")}</p>
        </div>

        <div class="ipt-card-kpis">
          <div class="ipt-mini-kpi">
            <span>Cambios</span>
            <strong>${changes.length}</strong>
          </div>
          <div class="ipt-mini-kpi">
            <span>Comunas</span>
            <strong>${communes}</strong>
          </div>
          <div class="ipt-mini-kpi">
            <span>Regiones</span>
            <strong>${regions}</strong>
          </div>
        </div>
      </div>

      <div class="ipt-card-actions">
        <button class="ipt-detail-button" data-ipt-index="${report.originalIndex}">
          Ver consolidado
        </button>
        ${report.word_url ? `
          <a class="ipt-download-link" href="${escapeAttribute(report.word_url)}" download>
            Descargar Word
          </a>
        ` : ""}
        ${report.csv_url ? `
          <a class="ipt-download-link" href="${escapeAttribute(report.csv_url)}" download>
            Abrir en Excel (.csv)
          </a>
        ` : ""}
        ${report.excel_url ? `
          <a class="ipt-download-link" href="${escapeAttribute(report.excel_url)}" download>
            Descargar Excel
          </a>
        ` : ""}
      </div>
    </article>
  `;
}

function renderIptReports() {
  const filtered = filteredIptReports();
  $("iptReportGrid").innerHTML = filtered.map(iptCardTemplate).join("");
  $("iptResultCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "reporte" : "reportes"}`;
  $("iptEmptyState").hidden = filtered.length !== 0;
}

function showIptReport(index) {
  const report = iptReports[Number(index)];
  if (!report) return;

  const changes = Array.isArray(report.cambios) ? report.cambios : [];

  const rows = changes.map(change => `
    <tr>
      <td>${escapeHtml(change.region || "—")}</td>
      <td>${escapeHtml(change.comuna || "—")}</td>
      <td>${escapeHtml(change.tipo_ipt || "—")}</td>
      <td>${escapeHtml(change.acto || "—")}</td>
      <td>${escapeHtml(change.estado || "—")}</td>
      <td>${escapeHtml(change.resumen || "—")}</td>
      <td>
        ${change.fuente ? `
          <a class="ipt-source-link" href="${escapeAttribute(change.fuente)}"
             target="_blank" rel="noopener noreferrer">Fuente</a>
        ` : "—"}
      </td>
    </tr>
  `).join("");

  $("iptDialogContent").innerHTML = `
    <div class="dialog-header">
      <span class="ipt-period">${escapeHtml(formatPeriod(report.periodo))}</span>
      <h2>${escapeHtml(report.titulo || "Actualizaciones IPT")}</h2>
      <p>${escapeHtml(report.resumen_ejecutivo || "")}</p>
    </div>

    <div class="detail-grid">
      <div class="detail-item"><span>Cambios registrados</span><strong>${changes.length}</strong></div>
      <div class="detail-item"><span>Comunas con cambios</span><strong>${new Set(changes.map(c => c.comuna).filter(Boolean)).size}</strong></div>
      <div class="detail-item"><span>Regiones cubiertas</span><strong>${new Set(changes.map(c => c.region).filter(Boolean)).size}</strong></div>
      <div class="detail-item"><span>Fecha de generación</span><strong>${escapeHtml(report.fecha_generacion || "—")}</strong></div>
    </div>

    ${changes.length ? `
      <div class="dialog-section">
        <h3>Consolidado nacional</h3>
        <div class="table-scroll">
          <table class="ipt-change-table">
            <thead>
              <tr>
                <th>Región</th>
                <th>Comuna</th>
                <th>IPT</th>
                <th>Acto</th>
                <th>Estado</th>
                <th>Resumen</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    ` : `
      <div class="dialog-section">
        <h3>Resultado</h3>
        <p>No se registraron cambios pertinentes durante el período.</p>
      </div>
    `}

    <div class="dialog-actions">
      ${report.word_url ? `
        <a class="dialog-primary-link" href="${escapeAttribute(report.word_url)}" download>
          Descargar Word
        </a>
      ` : ""}
      ${report.csv_url ? `
        <a class="dialog-secondary-link" href="${escapeAttribute(report.csv_url)}" download>
          Consolidado para Excel (.csv)
        </a>
      ` : ""}
      ${report.excel_url ? `
        <a class="dialog-secondary-link" href="${escapeAttribute(report.excel_url)}" download>
          Descargar Excel
        </a>
      ` : ""}
    </div>
  `;

  $("iptDialog").showModal();
}


function annualItems() {
  return annualReports.flatMap(report =>
    (Array.isArray(report.items) ? report.items : []).map(item => ({
      ...item,
      annualYear: report.year,
      annualIndex: annualReports.indexOf(report)
    }))
  );
}

function annualMonthLabel(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || "—";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 15));
}

function filteredAnnualItems() {
  const q = annualState.search.trim().toLowerCase();

  return annualItems()
    .filter(item => !annualState.month || item.periodo === annualState.month)
    .filter(item => !annualState.module || item.modulo === annualState.module)
    .filter(item => !annualState.region || item.region === annualState.region)
    .filter(item => {
      if (!q) return true;
      return [
        item.periodo, item.modulo, item.fecha, item.region, item.comuna,
        item.categoria, item.tipo_norma, item.numero, item.organismo,
        item.titulo, item.resumen, item.implicancia, item.estado, item.fuente
      ].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => String(b.fecha || b.periodo).localeCompare(String(a.fecha || a.periodo)));
}

function renderAnnualMetrics() {
  const items = annualItems();
  const communes = new Set(items.map(item => item.comuna).filter(Boolean)).size;
  const regions = new Set(items.map(item => item.region).filter(Boolean)).size;
  const years = annualReports.map(report => report.year).filter(Boolean).sort().reverse();

  $("annualMetricItems").textContent = items.length;
  $("annualMetricCommunes").textContent = communes;
  $("annualMetricRegions").textContent = regions;
  $("annualMetricYear").textContent = years[0] || "—";
}

function annualCardTemplate(item) {
  return `
    <article class="annual-item-card">
      <div class="card-top">
        <span class="annual-module-pill">${escapeHtml(item.modulo || "Histórico")}</span>
        <span class="scale-pill">${escapeHtml(item.estado || item.escala || "Registro")}</span>
      </div>

      <p class="card-date">${escapeHtml(annualMonthLabel(item.periodo))}</p>
      <h3>${escapeHtml(item.titulo || item.resumen || "Actualización normativa")}</h3>
      <p class="card-summary">${escapeHtml(item.resumen || "")}</p>

      <div class="annual-item-meta">
        <span>${escapeHtml(item.region || "Chile")}</span>
        <span>${escapeHtml(item.comuna || item.categoria || "")}</span>
      </div>

      <div class="card-footer">
        <span>${escapeHtml(item.tipo_norma || item.categoria || "")}</span>
        ${item.fuente ? `
          <a class="annual-source-link" href="${escapeAttribute(item.fuente)}"
             target="_blank" rel="noopener noreferrer">Fuente oficial →</a>
        ` : ""}
      </div>
    </article>
  `;
}

function renderAnnualReports() {
  const items = filteredAnnualItems();
  $("annualReportGrid").innerHTML = items.map(annualCardTemplate).join("");
  $("annualResultCount").textContent =
    `${items.length} ${items.length === 1 ? "registro" : "registros"}`;
  $("annualEmptyState").hidden = items.length !== 0;

  const report = annualReports[0];
  if (report && items.length) {
    const downloads = `
      <article class="annual-download-card">
        <div>
          <p class="eyebrow">DESCARGAS</p>
          <h3>${escapeHtml(report.titulo || `Reporte anual ${report.year}`)}</h3>
          <p>${escapeHtml(report.resumen_ejecutivo || "")}</p>
        </div>
        <div class="annual-download-actions">
          ${report.word_url ? `
            <a href="${escapeAttribute(report.word_url)}" download>Descargar Word</a>
          ` : ""}
          ${report.csv_url ? `
            <a href="${escapeAttribute(report.csv_url)}" download>Consolidado para Excel</a>
          ` : ""}
        </div>
      </article>
    `;
    $("annualReportGrid").insertAdjacentHTML("afterbegin", downloads);
  }
}


const REGION_CENTERS = {
  "Arica y Parinacota": [-18.47, -70.31],
  "Tarapacá": [-20.22, -70.14],
  "Antofagasta": [-23.65, -70.40],
  "Atacama": [-27.37, -70.33],
  "Coquimbo": [-29.91, -71.25],
  "Valparaíso": [-33.05, -71.62],
  "Metropolitana de Santiago": [-33.45, -70.67],
  "Región Metropolitana": [-33.45, -70.67],
  "O'Higgins": [-34.17, -70.74],
  "Libertador General Bernardo O'Higgins": [-34.17, -70.74],
  "Maule": [-35.43, -71.67],
  "Ñuble": [-36.61, -72.10],
  "Biobío": [-36.83, -73.05],
  "La Araucanía": [-38.74, -72.59],
  "Los Ríos": [-39.82, -73.24],
  "Los Lagos": [-41.47, -72.94],
  "Aysén": [-45.57, -72.07],
  "Aysén del General Carlos Ibáñez del Campo": [-45.57, -72.07],
  "Magallanes y de la Antártica Chilena": [-53.16, -70.91],
  "Chile": [-33.45, -70.67]
};

function normalizeRegionName(value = "") {
  const region = String(value).trim();

  const aliases = {
    "RM": "Metropolitana de Santiago",
    "Metropolitana": "Metropolitana de Santiago",
    "Región Metropolitana de Santiago": "Metropolitana de Santiago",
    "Libertador Bernardo O'Higgins": "O'Higgins",
    "Libertador General Bernardo O’Higgins": "O'Higgins",
    "Aysén del General Carlos Ibáñez del Campo": "Aysén"
  };

  return aliases[region] || region;
}

function mapItems() {
  const daily = reports.map(item => ({
    source: "Diario Oficial",
    period: item.fecha ? String(item.fecha).slice(0, 7) : "",
    date: item.fecha || "",
    region: normalizeRegionName(item.region || "Chile"),
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
      region: normalizeRegionName(item.region || "Chile"),
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
      region: normalizeRegionName(item.region || "Chile"),
      commune: item.comuna || "",
      title: item.titulo || "",
      summary: item.resumen || "",
      category: item.categoria || item.tipo_norma || "",
      status: item.estado || "",
      sourceUrl: item.fuente || "",
      itemType: "historic"
    }))
  );

  return [...daily, ...ipt, ...historic]
    .filter(item => item.region && REGION_CENTERS[item.region]);
}

function filteredMapItems() {
  const q = mapState.search.trim().toLowerCase();

  return mapItems()
    .filter(item => !mapState.module || item.source === mapState.module)
    .filter(item => !mapState.period || item.period === mapState.period)
    .filter(item => !mapState.region || item.region === mapState.region)
    .filter(item => !mapState.selectedRegion || item.region === mapState.selectedRegion)
    .filter(item => {
      if (!q) return true;
      return [
        item.source, item.period, item.date, item.region, item.commune,
        item.title, item.summary, item.category, item.status
      ].join(" ").toLowerCase().includes(q);
    });
}

function mapMarkerSize(count) {
  if (count >= 10) return 42;
  if (count >= 6) return 36;
  if (count >= 3) return 30;
  return 24;
}

function initTerritorialMap() {
  if (territorialMap || typeof L === "undefined") return;

  territorialMap = L.map("territorialMap", {
    zoomControl: true,
    scrollWheelZoom: false,
    minZoom: 3,
    maxZoom: 10,
    zoomSnap: 0.25,
    preferCanvas: true
  });

  territorialMap.fitBounds(
    [[-56.2, -76.2], [-17.2, -66.0]],
    { padding: [24, 24] }
  );

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(territorialMap);

  territorialLayer = L.layerGroup().addTo(territorialMap);
}

function renderTerritorialMap() {
  initTerritorialMap();
  if (!territorialMap || !territorialLayer) return;

  const items = filteredMapItems();
  territorialLayer.clearLayers();

  const grouped = new Map();

  items.forEach(item => {
    if (!grouped.has(item.region)) grouped.set(item.region, []);
    grouped.get(item.region).push(item);
  });

  grouped.forEach((regionItems, region) => {
    const center = REGION_CENTERS[region];
    if (!center) return;

    const size = mapMarkerSize(regionItems.length);
    const communes = new Set(regionItems.map(item => item.commune).filter(Boolean)).size;

    const icon = L.divIcon({
      className: "",
      html: `<div class="region-marker" style="width:${size}px;height:${size}px">${regionItems.length}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    const marker = L.marker(center, { icon }).addTo(territorialLayer);

    marker.bindPopup(`
      <div class="map-popup">
        <h4>${escapeHtml(region)}</h4>
        <p><strong>${regionItems.length}</strong> registros visibles</p>
        <p><strong>${communes}</strong> comunas identificadas</p>
        <button type="button" data-map-region="${escapeAttribute(region)}">
          Ver detalle territorial
        </button>
      </div>
    `);
  });

  renderMapResults();

  if (mapState.region && REGION_CENTERS[mapState.region]) {
    territorialMap.setView(REGION_CENTERS[mapState.region], 6);
  } else if (mapState.selectedRegion && REGION_CENTERS[mapState.selectedRegion]) {
    territorialMap.setView(REGION_CENTERS[mapState.selectedRegion], 6);
  } else {
    territorialMap.fitBounds(
      [[-56.2, -76.2], [-17.2, -66.0]],
      { padding: [24, 24] }
    );
  }

  requestAnimationFrame(() => {
    territorialMap.invalidateSize({ pan: false });
  });
  setTimeout(() => territorialMap.invalidateSize({ pan: false }), 250);
}

function mapResultTemplate(item) {
  const territory = [item.commune, item.region].filter(Boolean).join(" · ");
  const dateOrPeriod = item.date || item.period || "";

  return `
    <article class="map-result-item">
      <span class="map-result-source">${escapeHtml(item.source)}</span>
      <div class="map-result-content">
        <h4>${escapeHtml(item.title || item.category || "Actualización normativa")}</h4>
        <p>${escapeHtml(item.summary || "")}</p>
      </div>
      <div class="map-result-territory">
        <strong>${escapeHtml(territory)}</strong><br>
        <span>${escapeHtml(dateOrPeriod)}</span>
      </div>
    </article>
  `;
}

function renderMapResults() {
  const items = filteredMapItems();
  const regions = new Set(items.map(item => item.region).filter(Boolean)).size;
  const communes = new Set(items.map(item => item.commune).filter(Boolean)).size;

  $("mapMetricItems").textContent = items.length;
  $("mapMetricRegions").textContent = regions;
  $("mapMetricCommunes").textContent = communes;
  $("mapResultCount").textContent =
    `${items.length} ${items.length === 1 ? "registro" : "registros"}`;

  const titleRegion = mapState.selectedRegion || mapState.region;
  $("mapResultsTitle").textContent = titleRegion || "Todos los territorios";

  $("mapResultsList").innerHTML = items.slice(0, 100).map(mapResultTemplate).join("");
  $("mapEmptyState").hidden = items.length !== 0;
}

function populateMapFilters() {
  const items = mapItems();

  addOptions(
    $("mapPeriodFilter"),
    [...new Set(items.map(item => item.period).filter(Boolean))].sort().reverse()
  );

  addOptions(
    $("mapRegionFilter"),
    [...new Set(items.map(item => item.region).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );
}


function vigenciaInstruments() {
  const legacy = Array.isArray(vigenciaData.instrumentos) ? [...vigenciaData.instrumentos] : [];
  const rows = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
    ? window.SEGUIMIENTO_NORMATIVO.comunas
    : [];
  if (!rows.length) return legacy;
  const byCommune = new Map(legacy.map(item => [`${item.region}|${item.comuna}`, item]));
  const statusFor = row => {
    const source = String(row.estado_fuente || "");
    if (source.includes("Sin cartografía") || source.includes("Sin información") || source.includes("Sin PRC/LU")) return "Sin cartografía";
    if (source.includes("Vigente · sin cambios") || source.includes("Probablemente actualizado")) return "Probablemente actualizado";
    return "Revisión necesaria";
  };
  return rows.map(row => {
    const key = `${row.region}|${row.comuna}`;
    const existing = byCommune.get(key) || {};
    return {
      ...existing,
      id: existing.id || `seguimiento-${row.region}-${row.comuna}`,
      region: row.region,
      comuna: row.comuna,
      tipo_ipt: existing.tipo_ipt || (row.prc_nombre ? "PRC" : "IPT sin identificar"),
      nombre: row.prc_nombre || existing.nombre || "Instrumento no identificado",
      estado_alerta: statusFor(row),
      confianza: existing.confianza || (row.apto_para_visor === "SI" ? "preliminar" : "baja"),
      resumen_alerta: row.motivo || existing.resumen_alerta || "La fuente comunal está pendiente de revisión.",
      actos_posteriores_pendientes: Number(row.actos_posteriores || existing.actos_posteriores_pendientes || 0),
      fecha_instrumento_base: row.prc_fecha || existing.fecha_instrumento_base || "",
      archivo_geojson: existing.archivo_geojson || row.archivo_recomendado || "",
      notas: existing.notas || "Estado derivado del consolidado nacional de Seguimiento PRC."
    };
  });
}

function vigenciaStatusClass(status = "") {
  const classes = {
    "Actualizado": "actualizado",
    "Probablemente actualizado": "probable",
    "Revisión necesaria": "revision",
    "Desactualizado": "desactualizado",
    "Sin cartografía": "sin-cartografia"
  };
  return classes[status] || "sin-cartografia";
}

function filteredVigenciaInstruments() {
  const q = vigenciaState.search.trim().toLowerCase();

  return vigenciaInstruments()
    .filter(item => !vigenciaState.region || item.region === vigenciaState.region)
    .filter(item => !vigenciaState.type || item.tipo_ipt === vigenciaState.type)
    .filter(item => !vigenciaState.status || item.estado_alerta === vigenciaState.status)
    .filter(item => {
      if (!q) return true;
      return [
        item.region, item.comuna, item.tipo_ipt, item.nombre,
        item.estado_alerta, item.resumen_alerta, item.notas,
        ...(item.zonas_presentes || []),
        ...(item.linea_tiempo || []).flatMap(event => [
          event.fecha, event.tipo, event.titulo, event.numero,
          event.estado, event.resumen, ...(event.zonas_afectadas || [])
        ])
      ].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const order = {
        "Desactualizado": 0,
        "Revisión necesaria": 1,
        "Sin cartografía": 2,
        "Probablemente actualizado": 3,
        "Actualizado": 4
      };
      return (order[a.estado_alerta] ?? 9) - (order[b.estado_alerta] ?? 9)
        || String(a.region).localeCompare(String(b.region), "es")
        || String(a.comuna).localeCompare(String(b.comuna), "es");
    });
}

function renderVigenciaMetrics() {
  /*
   * The old vigencia builder has its own (and now stale) summary.  The
   * national source of truth is the same one used by Seguimiento PRC, so the
   * headline numbers must be derived from it here as well.  This prevents a
   * valid zero in the legacy dataset from being shown as if the national
   * audit had no records.
   */
  const rows = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
    ? window.SEGUIMIENTO_NORMATIVO.comunas
    : [];
  const sourceSummary = window.SEGUIMIENTO_NORMATIVO?.resumen || {};
  const isUpdatedOrProbable = row =>
    String(row.estado_fuente || "").includes("Vigente · sin cambios posteriores detectados")
    || String(row.estado_fuente || "").includes("Probablemente actualizado");
  const isMissing = row =>
    ["Sin cartografía SIG vinculada", "Sin información comunal consolidada", "Sin PRC/LU vigente identificado"]
      .some(label => String(row.estado_fuente || "").includes(label));
  const syncedSummary = {
    instrumentos: rows.length || sourceSummary.total || 0,
    actualizados: rows.filter(row => String(row.estado_fuente || "").includes("Vigente · sin cambios posteriores detectados")).length,
    probablemente_actualizados: rows.filter(row => String(row.estado_fuente || "").includes("Probablemente actualizado")).length,
    revision_necesaria: rows.filter(row => !isUpdatedOrProbable(row) && !isMissing(row)).length,
    sin_cartografia: rows.filter(isMissing).length,
  };
  const summary = rows.length ? syncedSummary : (vigenciaData.resumen || {});
  $("vigenciaMetricTotal").textContent = summary.instrumentos || 0;
  $("vigenciaMetricOk").textContent =
    (summary.actualizados || 0) + (summary.probablemente_actualizados || 0);
  $("vigenciaMetricReview").textContent = summary.revision_necesaria || 0;
  $("vigenciaMetricAlert").textContent = summary.sin_cartografia || 0;

  const links = [];
  if (vigenciaData.word_url) {
    links.push(`
      <a href="${escapeAttribute(vigenciaData.word_url)}" download>
        Descargar Word
      </a>
    `);
  }
  if (vigenciaData.csv_url) {
    links.push(`
      <a href="${escapeAttribute(vigenciaData.csv_url)}" download>
        Abrir alertas en Excel
      </a>
    `);
  }
  $("vigenciaDownloads").innerHTML = links.join("");
}

function vigenciaCardTemplate(item) {
  const statusClass = vigenciaStatusClass(item.estado_alerta);
  const selected = vigenciaState.selectedId === item.id ? "selected" : "";

  return `
    <button class="vigencia-instrument-card ${selected}" data-vigencia-id="${escapeAttribute(item.id)}">
      <div class="vigencia-card-heading">
        <span class="vigencia-status ${statusClass}"></span>
        <div>
          <strong>${escapeHtml(item.comuna || "Territorio sin comuna")}</strong>
          <span>${escapeHtml(item.region || "")}</span>
        </div>
      </div>
      <div class="vigencia-card-body">
        <span class="vigencia-type-pill">${escapeHtml(item.tipo_ipt || "IPT")}</span>
        <p>${escapeHtml(item.nombre || item.tipo_ipt || "Instrumento")}</p>
      </div>
      <div class="vigencia-card-footer">
        <span class="vigencia-alert-label ${statusClass}">
          ${escapeHtml(item.estado_alerta || "Sin clasificación")}
        </span>
        <span>${Number(item.actos_posteriores_pendientes || 0)} pendientes</span>
      </div>
    </button>
  `;
}

function renderVigenciaList() {
  const items = filteredVigenciaInstruments();
  $("vigenciaInstrumentList").innerHTML = items.map(vigenciaCardTemplate).join("");
  $("vigenciaResultCount").textContent =
    `${items.length} ${items.length === 1 ? "instrumento" : "instrumentos"}`;
  $("vigenciaEmptyState").hidden = items.length !== 0;

  if (items.length && !items.some(item => item.id === vigenciaState.selectedId)) {
    vigenciaState.selectedId = items[0].id;
  }

  renderVigenciaDetail();
}

function timelineEventClass(event) {
  const incorporation = event.incorporacion || "";
  if (incorporation === "incorporado" || incorporation === "base" || incorporation === "shape") {
    return "incorporado";
  }
  if (incorporation === "no_incorporado") return "no-incorporado";
  if (incorporation === "probablemente_incorporado") return "probable";
  return "pendiente";
}

function timelineTemplate(event) {
  const eventClass = timelineEventClass(event);
  const zones = Array.isArray(event.zonas_afectadas) && event.zonas_afectadas.length
    ? `<p class="timeline-zones">Zonas: ${escapeHtml(event.zonas_afectadas.join(", "))}</p>`
    : "";

  return `
    <article class="timeline-event ${eventClass}">
      <div class="timeline-node"></div>
      <div class="timeline-content">
        <div class="timeline-topline">
          <span>${escapeHtml(event.fecha || "Sin fecha")}</span>
          <span class="timeline-incorporation ${eventClass}">
            ${escapeHtml(String(event.incorporacion || "sin verificar").replaceAll("_", " "))}
          </span>
        </div>
        <h4>${escapeHtml(event.titulo || event.tipo || "Acto")}</h4>
        <p class="timeline-type">
          ${escapeHtml([event.tipo, event.numero, event.estado].filter(Boolean).join(" · "))}
        </p>
        ${event.resumen ? `<p>${escapeHtml(event.resumen)}</p>` : ""}
        ${zones}
        ${event.fuente ? `
          <a href="${escapeAttribute(event.fuente)}" target="_blank" rel="noopener noreferrer">
            Ver fuente oficial
          </a>
        ` : ""}
      </div>
    </article>
  `;
}

function spatialResultTemplate(result) {
  const stateClass = result.estado === "incorporado"
    ? "actualizado"
    : result.estado === "no_incorporado"
      ? "desactualizado"
      : "revision";

  return `
    <article class="spatial-result">
      <span class="vigencia-status ${stateClass}"></span>
      <div>
        <strong>${escapeHtml(result.acto || "Comparación espacial")}</strong>
        <p>${escapeHtml(result.observacion || "")}</p>
      </div>
      <span class="spatial-percentage">
        ${result.coincidencia_porcentaje === null || result.coincidencia_porcentaje === undefined
          ? "—"
          : `${Number(result.coincidencia_porcentaje).toFixed(1)}%`}
      </span>
    </article>
  `;
}

function initVigenciaMap() {
  const mapElement = $("vigenciaComparisonMap");
  if (!mapElement || typeof L === "undefined") return;

  if (vigenciaMap) {
    vigenciaMap.remove();
  }

  vigenciaMap = L.map(mapElement, {
    zoomControl: true,
    scrollWheelZoom: false,
    minZoom: 3,
    maxZoom: 16,
    preferCanvas: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(vigenciaMap);

  vigenciaBaseLayer = L.layerGroup().addTo(vigenciaMap);
  vigenciaOverlayLayer = L.layerGroup().addTo(vigenciaMap);
}

async function fetchGeoJson(reference) {
  if (!reference) return null;
  try {
    const response = await fetch(reference);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("No se pudo cargar GeoJSON:", reference, error);
    return null;
  }
}

function geoJsonStyle(kind, incorporation = "") {
  if (kind === "base") {
    return {
      color: "#4a4cfb",
      weight: 2,
      fillColor: "#4a4cfb",
      fillOpacity: 0.16
    };
  }

  if (incorporation === "no_incorporado") {
    return {
      color: "#c84d55",
      weight: 3,
      fillColor: "#c84d55",
      fillOpacity: 0.26
    };
  }

  if (incorporation === "incorporado") {
    return {
      color: "#2b7a5a",
      weight: 3,
      fillColor: "#2b7a5a",
      fillOpacity: 0.22
    };
  }

  return {
    color: "#c18a23",
    weight: 3,
    dashArray: "7 5",
    fillColor: "#e9b44c",
    fillOpacity: 0.22
  };
}

async function renderVigenciaMap(item) {
  const mapContainer = $("vigenciaComparisonMap");
  if (!mapContainer) return;

  initVigenciaMap();
  if (!vigenciaMap) return;

  vigenciaBaseLayer.clearLayers();
  vigenciaOverlayLayer.clearLayers();

  const bounds = [];
  const baseReference = item.mapa?.base_geojson || item.archivo_geojson || "";
  const baseData = await fetchGeoJson(baseReference);

  if (baseData) {
    const layer = L.geoJSON(baseData, {
      style: () => geoJsonStyle("base"),
      onEachFeature: (feature, featureLayer) => {
        const properties = feature.properties || {};
        const zoneField = item.campo_zona || "";
        const zoneValue = zoneField ? properties[zoneField] : "";
        if (zoneValue) {
          featureLayer.bindTooltip(String(zoneValue), { sticky: true });
        }
      }
    }).addTo(vigenciaBaseLayer);
    if (layer.getBounds().isValid()) bounds.push(layer.getBounds());
  }

  const overlayList = item.mapa?.capas_modificaciones || [];
  for (const overlay of overlayList) {
    const overlayData = await fetchGeoJson(overlay.archivo_geojson);
    if (!overlayData) continue;

    const layer = L.geoJSON(overlayData, {
      style: () => geoJsonStyle("overlay", overlay.incorporacion),
      onEachFeature: (_feature, featureLayer) => {
        featureLayer.bindPopup(`
          <div class="map-popup">
            <h4>${escapeHtml(overlay.titulo || "Modificación")}</h4>
            <p>${escapeHtml(String(overlay.incorporacion || "sin verificar").replaceAll("_", " "))}</p>
            ${overlay.zona_esperada ? `<p>Zona esperada: ${escapeHtml(overlay.zona_esperada)}</p>` : ""}
          </div>
        `);
      }
    }).addTo(vigenciaOverlayLayer);
    if (layer.getBounds().isValid()) bounds.push(layer.getBounds());
  }

  if (bounds.length) {
    const combined = bounds.reduce((current, next) => current.extend(next));
    vigenciaMap.fitBounds(combined, { padding: [24, 24], maxZoom: 14 });
    $("vigenciaMapNotice").textContent =
      "Azul: shape base. Verde: modificación incorporada. Amarillo: sin verificar. Rojo: no incorporada.";
  } else {
    const center = REGION_CENTERS[normalizeRegionName(item.region)] || [-35.6, -71.5];
    vigenciaMap.setView(center, item.comuna ? 7 : 5);
    L.marker(center).addTo(vigenciaOverlayLayer).bindPopup(
      `<div class="map-popup"><h4>${escapeHtml(item.comuna || item.region || "Chile")}</h4><p>No hay GeoJSON registrado para comparar.</p></div>`
    );
    $("vigenciaMapNotice").textContent =
      "No hay geometría cargada. Exporta el shape y las modificaciones a GeoJSON y regístralos en config/cartografia_ipt.json.";
  }

  requestAnimationFrame(() => vigenciaMap.invalidateSize({ pan: false }));
  setTimeout(() => vigenciaMap?.invalidateSize({ pan: false }), 250);
}

function renderVigenciaDetail() {
  const item = vigenciaInstruments().find(
    instrument => instrument.id === vigenciaState.selectedId
  );

  if (!item) {
    $("vigenciaDetail").className = "vigencia-detail-empty";
    $("vigenciaDetail").innerHTML = `
      <div class="vigencia-empty-symbol">↗</div>
      <h3>Selecciona un instrumento</h3>
      <p>Aquí se mostrará su línea de tiempo y la comparación cartográfica.</p>
    `;
    return;
  }

  const statusClass = vigenciaStatusClass(item.estado_alerta);
  const timeline = item.linea_tiempo || [];
  const spatial = item.comparaciones_espaciales || [];
  const alerts = item.alertas || [];

  $("vigenciaDetail").className = "vigencia-detail-content";
  $("vigenciaDetail").innerHTML = `
    <div class="vigencia-detail-header">
      <div>
        <div class="vigencia-title-row">
          <span class="vigencia-status large ${statusClass}"></span>
          <div>
            <p class="eyebrow">${escapeHtml(item.tipo_ipt || "IPT")}</p>
            <h3>${escapeHtml(item.comuna || "Territorio sin comuna")}</h3>
          </div>
        </div>
        <p class="vigencia-instrument-name">${escapeHtml(item.nombre || item.tipo_ipt || "")}</p>
      </div>
      <div class="vigencia-alert-box ${statusClass}">
        <strong>${escapeHtml(item.estado_alerta || "")}</strong>
        <span>Confianza ${escapeHtml(item.confianza || "sin definir")}</span>
      </div>
    </div>

    <p class="vigencia-summary-text">${escapeHtml(item.resumen_alerta || "")}</p>

    <div class="detail-grid">
      <div class="detail-item">
        <span>Región</span>
        <strong>${escapeHtml(item.region || "—")}</strong>
      </div>
      <div class="detail-item">
        <span>Instrumento base</span>
        <strong>${escapeHtml(item.fecha_instrumento_base || "Sin fecha")}</strong>
      </div>
      <div class="detail-item">
        <span>Versión cartográfica</span>
        <strong>${escapeHtml(item.fecha_version_cartografica || "No registrada")}</strong>
      </div>
      <div class="detail-item">
        <span>Actos pendientes</span>
        <strong>${Number(item.actos_posteriores_pendientes || 0)}</strong>
      </div>
    </div>

    ${alerts.length ? `
      <section class="vigencia-alert-list">
        <h4>Alertas detectadas</h4>
        ${alerts.map(alert => `
          <article class="vigencia-alert-row ${alert.nivel || "medio"}">
            <strong>${escapeHtml(alert.tipo || "Alerta")}</strong>
            <p>${escapeHtml(alert.mensaje || "")}</p>
          </article>
        `).join("")}
      </section>
    ` : ""}

    <section class="vigencia-map-section">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">COMPARACIÓN ESPACIAL</p>
          <h3>Shape y modificaciones</h3>
        </div>
        ${item.fuente_cartografia ? `
          <a class="annual-source-link" href="${escapeAttribute(item.fuente_cartografia)}"
             target="_blank" rel="noopener noreferrer">Fuente cartográfica</a>
        ` : ""}
      </div>
      <div id="vigenciaComparisonMap" class="vigencia-comparison-map"></div>
      <p id="vigenciaMapNotice" class="vigencia-map-notice"></p>
    </section>

    ${spatial.length ? `
      <section class="spatial-results-section">
        <h4>Resultados espaciales</h4>
        <div class="spatial-results-list">
          ${spatial.map(spatialResultTemplate).join("")}
        </div>
      </section>
    ` : ""}

    <section class="timeline-section">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">LÍNEA DE TIEMPO</p>
          <h3>Instrumento, modificaciones y enmiendas</h3>
        </div>
        <span class="result-count">${timeline.length} hitos</span>
      </div>
      <div class="timeline">
        ${timeline.length
          ? timeline.map(timelineTemplate).join("")
          : `<div class="empty-state"><p>No hay hitos normativos disponibles.</p></div>`}
      </div>
    </section>

    ${item.zonas_presentes?.length ? `
      <section class="vigencia-zones-section">
        <h4>Zonas presentes en el shape</h4>
        <div class="vigencia-zone-list">
          ${item.zonas_presentes.map(zone => `<span>${escapeHtml(zone)}</span>`).join("")}
        </div>
      </section>
    ` : ""}

    ${item.notas ? `<p class="vigencia-notes">${escapeHtml(item.notas)}</p>` : ""}
  `;

  renderVigenciaMap(item);
}

function renderVigencia() {
  renderVigenciaMetrics();
  renderVigenciaList();
}

function populateVigenciaFilters() {
  const items = vigenciaInstruments();

  addOptions(
    $("vigenciaRegionFilter"),
    [...new Set(items.map(item => item.region).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );

  addOptions(
    $("vigenciaTypeFilter"),
    [...new Set(items.map(item => item.tipo_ipt).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );
}

function bindEvents() {
  document.querySelectorAll(".module-tab").forEach(button => {
    button.addEventListener("click", () => switchModule(button.dataset.module));
  });

  document.querySelectorAll("[data-module-jump]").forEach(button => {
    button.addEventListener("click", () => {
      switchModule(button.dataset.moduleJump);
      document.querySelector(`#module-${button.dataset.moduleJump}`)
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });

  $("searchInput").addEventListener("input", event => {
    state.search = event.target.value;
    renderReports();
  });
  $("scaleFilter").addEventListener("change", event => {
    state.scale = event.target.value;
    renderReports();
  });
  $("categoryFilter").addEventListener("change", event => {
    state.category = event.target.value;
    renderReports();
  });
  $("statusFilter").addEventListener("change", event => {
    state.status = event.target.value;
    renderReports();
  });
  $("clearFilters").addEventListener("click", () => {
    Object.assign(state, { search: "", scale: "", category: "", status: "" });
    $("searchInput").value = "";
    $("scaleFilter").value = "";
    $("categoryFilter").value = "";
    $("statusFilter").value = "";
    renderReports();
  });

  $("iptSearchInput").addEventListener("input", event => {
    iptState.search = event.target.value;
    renderIptReports();
  });
  $("iptRegionFilter").addEventListener("change", event => {
    iptState.region = event.target.value;
    renderIptReports();
  });
  $("iptStateFilter").addEventListener("change", event => {
    iptState.status = event.target.value;
    renderIptReports();
  });
  $("clearIptFilters").addEventListener("click", () => {
    Object.assign(iptState, { search: "", region: "", status: "" });
    $("iptSearchInput").value = "";
    $("iptRegionFilter").value = "";
    $("iptStateFilter").value = "";
    renderIptReports();
  });


  $("annualSearchInput").addEventListener("input", event => {
    annualState.search = event.target.value;
    renderAnnualReports();
  });
  $("annualMonthFilter").addEventListener("change", event => {
    annualState.month = event.target.value;
    renderAnnualReports();
  });
  $("annualModuleFilter").addEventListener("change", event => {
    annualState.module = event.target.value;
    renderAnnualReports();
  });
  $("annualRegionFilter").addEventListener("change", event => {
    annualState.region = event.target.value;
    renderAnnualReports();
  });
  $("clearAnnualFilters").addEventListener("click", () => {
    Object.assign(annualState, { search: "", month: "", module: "", region: "" });
    $("annualSearchInput").value = "";
    $("annualMonthFilter").value = "";
    $("annualModuleFilter").value = "";
    $("annualRegionFilter").value = "";
    renderAnnualReports();
  });


  $("mapModuleFilter").addEventListener("change", event => {
    mapState.module = event.target.value;
    mapState.selectedRegion = "";
    renderTerritorialMap();
  });

  $("mapPeriodFilter").addEventListener("change", event => {
    mapState.period = event.target.value;
    mapState.selectedRegion = "";
    renderTerritorialMap();
  });

  $("mapRegionFilter").addEventListener("change", event => {
    mapState.region = event.target.value;
    mapState.selectedRegion = "";
    renderTerritorialMap();
  });

  $("mapSearchInput").addEventListener("input", event => {
    mapState.search = event.target.value;
    renderTerritorialMap();
  });

  $("clearMapFilters").addEventListener("click", () => {
    Object.assign(mapState, {
      search: "",
      module: "",
      period: "",
      region: "",
      selectedRegion: ""
    });

    $("mapModuleFilter").value = "";
    $("mapPeriodFilter").value = "";
    $("mapRegionFilter").value = "";
    $("mapSearchInput").value = "";

    renderTerritorialMap();
  });


  $("vigenciaSearchInput").addEventListener("input", event => {
    vigenciaState.search = event.target.value;
    renderVigenciaList();
  });
  $("vigenciaRegionFilter").addEventListener("change", event => {
    vigenciaState.region = event.target.value;
    renderVigenciaList();
  });
  $("vigenciaTypeFilter").addEventListener("change", event => {
    vigenciaState.type = event.target.value;
    renderVigenciaList();
  });
  $("vigenciaStatusFilter").addEventListener("change", event => {
    vigenciaState.status = event.target.value;
    renderVigenciaList();
  });
  $("clearVigenciaFilters").addEventListener("click", () => {
    Object.assign(vigenciaState, {
      search: "",
      region: "",
      type: "",
      status: "",
      selectedId: ""
    });
    $("vigenciaSearchInput").value = "";
    $("vigenciaRegionFilter").value = "";
    $("vigenciaTypeFilter").value = "";
    $("vigenciaStatusFilter").value = "";
    renderVigenciaList();
  });

  document.addEventListener("click", event => {
    const vigenciaButton = event.target.closest("[data-vigencia-id]");
    if (vigenciaButton) {
      vigenciaState.selectedId = vigenciaButton.dataset.vigenciaId;
      renderVigenciaList();
      document.querySelector(".vigencia-detail-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    const mapRegionButton = event.target.closest("[data-map-region]");
    if (mapRegionButton) {
      mapState.selectedRegion = mapRegionButton.dataset.mapRegion;
      $("mapRegionFilter").value = mapState.selectedRegion;
      mapState.region = mapState.selectedRegion;
      renderTerritorialMap();
      territorialMap?.closePopup();
      return;
    }

    const dailyButton = event.target.closest("[data-daily-index]");
    if (dailyButton) {
      showDailyReport(dailyButton.dataset.dailyIndex);
      return;
    }

    const iptButton = event.target.closest("[data-ipt-index]");
    if (iptButton) {
      showIptReport(iptButton.dataset.iptIndex);
    }
  });
}

function init() {
  addOptions($("scaleFilter"), uniqueValues(reports, "escala"));
  addOptions($("categoryFilter"), uniqueValues(reports, "categoria"));
  addOptions(
    $("annualMonthFilter"),
    [...new Set(annualItems().map(item => item.periodo).filter(Boolean))]
      .sort()
  );
  addOptions(
    $("annualRegionFilter"),
    [...new Set(annualItems().map(item => item.region).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );

  addOptions(
    $("iptRegionFilter"),
    [...new Set(iptAllChanges().map(change => change.region).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );

  renderMetrics();
  renderLatest();
  renderReports();
  renderIptMetrics();
  renderIptReports();
  renderAnnualMetrics();
  renderAnnualReports();
  populateMapFilters();
  populateVigenciaFilters();
  renderVigenciaMetrics();
  bindEvents();

  const requestedModule = location.hash === "#ipt"
    ? "ipt"
    : location.hash === "#historico"
      ? "historico"
      : location.hash === "#mapa"
        ? "mapa"
        : location.hash === "#vigencia"
          ? "vigencia"
          : location.hash === "#seguimiento"
            ? "seguimiento"
            : location.hash === "#capas"
              ? "capas"
              : "diario";
  switchModule(requestedModule);
  if (requestedModule === "mapa") renderTerritorialMap();
  if (requestedModule === "vigencia") renderVigencia();
  if (requestedModule === "seguimiento" && typeof window.renderSeguimientoNormativo === "function") {
    window.renderSeguimientoNormativo();
  }
  if (requestedModule === "capas" && typeof window.renderCapasTerritoriales === "function") {
    window.renderCapasTerritoriales();
  }
}

init();
