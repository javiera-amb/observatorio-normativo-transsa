(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La vista nacional IPT se cargó antes que el módulo de vigencia.");
    return;
  }

  const normalizeKey = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function injectStyles() {
    if (document.getElementById("vigenciaNacionalStyles")) return;
    const style = document.createElement("style");
    style.id = "vigenciaNacionalStyles";
    style.textContent = `
      .national-coverage-strip {
        display:grid;
        grid-template-columns:minmax(0,1.7fr) repeat(4,minmax(110px,.6fr));
        gap:10px;
        margin:16px 0 20px;
        padding:15px;
        border:1px solid var(--line);
        border-radius:16px;
        background:#fff;
      }
      .national-coverage-copy strong,.national-coverage-copy span { display:block; }
      .national-coverage-copy strong { color:var(--transsa-navy); font-size:.9rem; }
      .national-coverage-copy span { margin-top:4px; color:var(--muted); font-size:.73rem; line-height:1.4; }
      .national-coverage-stat { padding:10px 12px; border-radius:11px; background:var(--surface-soft); }
      .national-coverage-stat span,.national-coverage-stat strong { display:block; }
      .national-coverage-stat span { color:var(--muted); font-size:.62rem; text-transform:uppercase; letter-spacing:.04em; }
      .national-coverage-stat strong { margin-top:4px; color:var(--transsa-navy); font-size:.9rem; }
      .commune-act-coverage { margin:0 0 14px; padding:13px 14px; border:1px solid var(--line); border-radius:12px; background:#fff; }
      .commune-act-coverage strong { display:block; color:var(--transsa-navy); font-size:.82rem; }
      .commune-act-coverage p { margin:5px 0 0; color:var(--muted); font-size:.72rem; line-height:1.45; }
      .commune-act-coverage-grid { display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
      .commune-act-coverage-grid span { padding:5px 7px; border-radius:7px; background:var(--surface-soft); color:#4d5565; font-size:.66rem; }
      .additional-acts { margin-top:8px; border:1px dashed var(--line); border-radius:11px; background:#fff; }
      .additional-acts summary { cursor:pointer; padding:12px 14px; color:var(--transsa-blue); font-size:.75rem; font-weight:700; }
      .additional-acts-list { display:grid; gap:9px; padding:0 12px 12px; }

      .sig-commune-summary { margin:18px 0; padding:18px; border:1px solid var(--line); border-radius:16px; background:#fff; }
      .sig-commune-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
      .sig-commune-heading h4 { margin:0; color:var(--transsa-navy); font-size:1rem; }
      .sig-commune-heading p { margin:5px 0 0; color:var(--muted); font-size:.76rem; line-height:1.45; }
      .sig-viewer-pill { display:inline-flex; padding:7px 10px; border-radius:999px; font-size:.7rem; font-weight:700; white-space:nowrap; }
      .sig-viewer-pill.si { color:#176342; background:#e4f5ec; }
      .sig-viewer-pill.revisar { color:#76511c; background:#fff3cf; }
      .sig-viewer-pill.no { color:#922f38; background:#fde8ea; }
      .sig-commune-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-top:14px; }
      .sig-commune-stat { padding:10px 11px; border-radius:10px; background:var(--surface-soft); min-width:0; }
      .sig-commune-stat span,.sig-commune-stat strong { display:block; }
      .sig-commune-stat span { color:var(--muted); font-size:.62rem; text-transform:uppercase; letter-spacing:.03em; }
      .sig-commune-stat strong { margin-top:4px; color:var(--transsa-navy); font-size:.78rem; overflow-wrap:anywhere; }
      .sig-commune-reason { margin:12px 0 0; color:#4d5565; font-size:.76rem; line-height:1.5; }
      .sig-commune-details { margin-top:12px; border-top:1px solid var(--line); padding-top:10px; }
      .sig-commune-details summary { cursor:pointer; color:var(--transsa-blue); font-size:.74rem; font-weight:700; }
      .sig-later-acts { display:grid; gap:7px; margin-top:9px; }
      .sig-later-act { padding:9px 10px; border-radius:9px; background:var(--surface-soft); }
      .sig-later-act strong,.sig-later-act span { display:block; }
      .sig-later-act strong { color:var(--transsa-navy); font-size:.72rem; }
      .sig-later-act span { margin-top:3px; color:var(--muted); font-size:.66rem; }

      @media(max-width:900px){
        .national-coverage-strip{grid-template-columns:repeat(2,minmax(0,1fr));}
        .national-coverage-copy{grid-column:1/-1;}
        .sig-commune-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
      }
      @media(max-width:560px){
        .national-coverage-strip{grid-template-columns:1fr;}
        .sig-commune-grid{grid-template-columns:1fr;}
        .sig-commune-heading{display:block;}
        .sig-viewer-pill{margin-top:10px;}
      }
    `;
    document.head.appendChild(style);
  }

  function configureCommuneOnlySearch() {
    const input = document.getElementById("vigenciaSearchInput");
    if (!input) return;

    input.placeholder = "Buscar comuna…";
    input.setAttribute("aria-label", "Buscar comuna");
    input.setAttribute("autocomplete", "off");

    let datalist = document.getElementById("vigenciaCommuneOptions");
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.id = "vigenciaCommuneOptions";
      document.body.appendChild(datalist);
    }
    input.setAttribute("list", datalist.id);

    const names = [...new Set(vigenciaInstruments().map(item => item.comuna).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), "es"));
    datalist.innerHTML = names.map(name => `<option value="${escapeAttribute(name)}"></option>`).join("");

    filteredVigenciaInstruments = function filteredOnlyByCommune() {
      const q = normalizeKey(vigenciaState.search);
      return vigenciaInstruments()
        .filter(item => !vigenciaState.region || item.region === vigenciaState.region)
        .filter(item => !vigenciaState.type || (item.tipos_ipt || []).includes(vigenciaState.type))
        .filter(item => !vigenciaState.status || item.estado_alerta === vigenciaState.status)
        .filter(item => !q || normalizeKey(item.comuna).includes(q))
        .sort((a, b) => String(a.region).localeCompare(String(b.region), "es") || String(a.comuna).localeCompare(String(b.comuna), "es"));
    };
  }

  function addNationalStrip() {
    if (document.getElementById("nationalIptCoverage")) return;
    const summary = window.ACTOS_IPT_NACIONALES?.resumen;
    if (!summary) return;

    const metric = document.getElementById("vigenciaMetricTotal");
    const metricGrid = metric?.closest(".ipt-kpi-grid") || metric?.parentElement?.parentElement;
    if (!metricGrid) return;

    const states = summary.por_estado || {};
    const types = summary.por_tipo || {};
    const strip = document.createElement("section");
    strip.id = "nationalIptCoverage";
    strip.className = "national-coverage-strip";
    strip.innerHTML = `
      <div class="national-coverage-copy">
        <strong>Cobertura nacional de cambios normativos</strong>
        <span>La base histórica del Portal IPT se cruza con cada ficha comunal. Los vínculos por código de origen tienen mayor confianza; los vínculos por comuna y región siguen pendientes de validación documental.</span>
      </div>
      <div class="national-coverage-stat"><span>Actos fuente</span><strong>${Number(summary.total || 0).toLocaleString("es-CL")}</strong></div>
      <div class="national-coverage-stat"><span>Vigentes</span><strong>${Number(states.Vigente || 0).toLocaleString("es-CL")}</strong></div>
      <div class="national-coverage-stat"><span>Enmiendas</span><strong>${Number(types.Enmienda || 0).toLocaleString("es-CL")}</strong></div>
      <div class="national-coverage-stat"><span>Rectificaciones</span><strong>${Number(types["Rectificación"] || 0).toLocaleString("es-CL")}</strong></div>
    `;
    metricGrid.insertAdjacentElement("afterend", strip);
  }

  function addCommuneCoverage(item, detail) {
    const section = detail.querySelector(".commune-change-section");
    if (!section || section.querySelector(".commune-act-coverage")) return;

    const coverage = item.cobertura_actos || {};
    const box = document.createElement("div");
    box.className = "commune-act-coverage";
    box.innerHTML = `
      <strong>${Number(coverage.total || 0)} actos históricos asociados a la comuna</strong>
      <p>Los registros se incorporan a la línea de tiempo y al PRC consolidado según su nivel y tipo de IPT. La asociación por comuna no prueba por sí sola qué plano o zona fue modificada.</p>
      <div class="commune-act-coverage-grid">
        <span>${Number(coverage.vigentes || 0)} vigentes</span>
        <span>${Number(coverage.en_desarrollo || 0)} en desarrollo</span>
        <span>${Number(coverage.derogados || 0)} derogados</span>
        <span>${Number(coverage.vinculados_por_codigo || 0)} vinculados por código</span>
        <span>${Number(coverage.vinculados_por_comuna_region || 0)} por comuna/región</span>
      </div>
    `;
    section.querySelector(".commune-change-list")?.insertAdjacentElement("beforebegin", box);
  }

  function collapseLongActList(detail) {
    const list = detail.querySelector(".commune-change-list");
    if (!list || list.querySelector(".additional-acts")) return;

    const items = [...list.children].filter(element => element.classList.contains("commune-change-item"));
    const visibleLimit = 12;
    if (items.length <= visibleLimit) return;

    const details = document.createElement("details");
    details.className = "additional-acts";
    const summary = document.createElement("summary");
    summary.textContent = `Mostrar ${items.length - visibleLimit} actos adicionales`;
    const inner = document.createElement("div");
    inner.className = "additional-acts-list";

    items.slice(visibleLimit).forEach(item => inner.appendChild(item));
    details.append(summary, inner);
    list.appendChild(details);
  }

  function sigRecordFor(item) {
    const communes = window.CONSOLIDADO_SIG_COMUNAL?.comunas;
    if (!Array.isArray(communes)) return null;
    const region = normalizeKey(item.region);
    const commune = normalizeKey(item.comuna);
    return communes.find(record => normalizeKey(record.region) === region && normalizeKey(record.comuna) === commune) || null;
  }

  function addSigCommuneSummary(item, detail) {
    if (detail.querySelector(".sig-commune-summary")) return;
    const record = sigRecordFor(item);
    if (!record) return;

    const mainPrc = Array.isArray(record.prc) && record.prc.length ? record.prc[0] : null;
    const laterActs = mainPrc?.actos_posteriores || [];
    const apt = String(record.apto_para_visor || "REVISAR").toUpperCase();
    const aptClass = apt === "SI" ? "si" : apt === "NO" ? "no" : "revisar";
    const box = document.createElement("section");
    box.className = "sig-commune-summary";
    box.innerHTML = `
      <div class="sig-commune-heading">
        <div>
          <h4>Estado SIG consolidado para visor</h4>
          <p>${escapeHtml(record.estado_principal_label || "Estado SIG pendiente")}</p>
        </div>
        <span class="sig-viewer-pill ${aptClass}">Apto visor: ${escapeHtml(apt)}</span>
      </div>
      <div class="sig-commune-grid">
        <div class="sig-commune-stat">
          <span>PRC base</span>
          <strong>${escapeHtml(mainPrc ? (mainPrc.fecha_instrumento || "Sin fecha") : "No identificado")}</strong>
        </div>
        <div class="sig-commune-stat">
          <span>Actos posteriores</span>
          <strong>${Number(mainPrc?.cantidad_actos_posteriores || 0)}</strong>
        </div>
        <div class="sig-commune-stat">
          <span>Archivo recomendado</span>
          <strong>${escapeHtml(record.archivo_recomendado || "Pendiente")}</strong>
        </div>
        <div class="sig-commune-stat">
          <span>Capa</span>
          <strong>${escapeHtml(record.capa_recomendada || "Pendiente")}</strong>
        </div>
      </div>
      <p class="sig-commune-reason">${escapeHtml(record.motivo || "")}</p>
      ${laterActs.length ? `
        <details class="sig-commune-details">
          <summary>Ver ${laterActs.length} ${laterActs.length === 1 ? "acto posterior a revisar" : "actos posteriores a revisar"}</summary>
          <div class="sig-later-acts">
            ${laterActs.map(act => `
              <div class="sig-later-act">
                <strong>${escapeHtml(`${act.fecha || "Sin fecha"} · ${act.tipo_acto || "Modificación"}`)}</strong>
                <span>${escapeHtml(act.titulo || "Acto sin denominación")}</span>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
    `;

    const planSection = detail.querySelector(".commune-plan-section");
    const mapSection = detail.querySelector(".vigencia-map-section");
    if (planSection) planSection.insertAdjacentElement("afterend", box);
    else if (mapSection) mapSection.insertAdjacentElement("beforebegin", box);
    else detail.appendChild(box);
  }

  async function loadLocalSigConsolidated() {
    if (window.CONSOLIDADO_SIG_COMUNAL) return true;
    if (!['127.0.0.1', 'localhost'].includes(window.location.hostname)) return false;

    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = `_local/sig_ipt/consolidado_sig_comunal.js?v=${Date.now()}`;
      script.dataset.tuiLocalSig = "true";
      script.onload = () => {
        if (typeof renderVigencia === "function") renderVigencia();
        resolve(true);
      };
      script.onerror = () => {
        script.remove();
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderNationalVigenciaDetail() {
    originalRenderDetail();
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail) return;

    addCommuneCoverage(item, detail);
    collapseLongActList(detail);
    addSigCommuneSummary(item, detail);
  };

  injectStyles();
  configureCommuneOnlySearch();
  addNationalStrip();
  loadLocalSigConsolidated();
  if (typeof renderVigencia === "function") renderVigencia();
})();
