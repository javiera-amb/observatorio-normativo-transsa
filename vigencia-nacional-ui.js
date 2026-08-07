(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La vista nacional IPT se cargó antes que el módulo de vigencia.");
    return;
  }

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
      @media(max-width:900px){
        .national-coverage-strip{grid-template-columns:repeat(2,minmax(0,1fr));}
        .national-coverage-copy{grid-column:1/-1;}
      }
      @media(max-width:560px){.national-coverage-strip{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(style);
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

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderNationalVigenciaDetail() {
    originalRenderDetail();
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail) return;

    addCommuneCoverage(item, detail);
    collapseLongActList(detail);
  };

  injectStyles();
  addNationalStrip();
  if (typeof renderVigencia === "function") renderVigencia();
})();
