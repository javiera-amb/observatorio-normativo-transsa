const reports = Array.isArray(window.REPORTES) ? [...window.REPORTES] : [];
const iptReports = Array.isArray(window.IPT_REPORTES) ? [...window.IPT_REPORTES] : [];

const $ = (id) => document.getElementById(id);
const state = { search: "", scale: "", category: "", status: "" };
const iptState = { search: "", region: "", status: "" };

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

  document.addEventListener("click", event => {
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
    $("iptRegionFilter"),
    [...new Set(iptAllChanges().map(change => change.region).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
  );

  renderMetrics();
  renderLatest();
  renderReports();
  renderIptMetrics();
  renderIptReports();
  bindEvents();

  const requestedModule = location.hash === "#ipt" ? "ipt" : "diario";
  switchModule(requestedModule);
}

init();
