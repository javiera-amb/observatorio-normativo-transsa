(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La lectura estratégica se cargó antes que el módulo de vigencia.");
    return;
  }

  function injectStyles() {
    if (document.getElementById("vigenciaEstrategicaStyles")) return;
    const style = document.createElement("style");
    style.id = "vigenciaEstrategicaStyles";
    style.textContent = `
      .strategic-reading-section,
      .version-comparison-section {
        margin-top:22px;
        padding:20px;
        border:1px solid var(--line);
        border-radius:16px;
        background:#fff;
      }
      .strategic-reading-section h4,
      .version-comparison-section h4 { margin:0 0 7px; color:var(--transsa-navy); }
      .strategic-reading-section > p,
      .version-comparison-section > p { margin:0 0 14px; color:var(--muted); font-size:.8rem; line-height:1.5; }
      .strategic-summary { color:var(--transsa-navy); font-size:.88rem; line-height:1.6; }
      .version-comparison-list { display:grid; gap:10px; }
      .version-comparison-card { padding:15px; border:1px solid var(--line); border-radius:12px; background:var(--surface-soft); }
      .version-comparison-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
      .version-comparison-head strong { display:block; color:var(--transsa-navy); font-size:.9rem; }
      .version-comparison-head small { display:block; margin-top:4px; color:var(--muted); }
      .comparison-statuses { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
      .comparison-chip { padding:6px 8px; border-radius:999px; font-size:.65rem; font-weight:700; white-space:nowrap; }
      .comparison-chip.pending { color:#76511c; background:#fff3d8; }
      .comparison-chip.validated { color:#176342; background:#e4f5ec; }
      .comparison-chip.no-incorporated { color:#922f38; background:#fde8ea; }
      .comparison-description { margin:11px 0 0; color:#434b5b; font-size:.79rem; line-height:1.55; }
      .comparison-topics { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .comparison-topic { padding:5px 7px; border-radius:7px; background:#fff; border:1px solid var(--line); color:var(--muted); font-size:.65rem; }
      .supporting-records-section { margin-top:22px; padding:0; border:0; background:transparent; }
      .supporting-detail { border:1px solid var(--line); border-radius:14px; background:#fff; overflow:hidden; }
      .supporting-detail summary { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:14px 16px; cursor:pointer; color:var(--transsa-navy); font-size:.82rem; font-weight:700; list-style:none; }
      .supporting-detail summary::-webkit-details-marker { display:none; }
      .supporting-detail summary::after { content:"+"; color:var(--transsa-blue); font-size:1rem; }
      .supporting-detail[open] summary::after { content:"−"; }
      .supporting-detail summary span { margin-left:auto; color:var(--muted); font-size:.68rem; font-weight:600; }
      .supporting-detail-body { padding:0 16px 16px; }
      .supporting-detail-body > p { margin:0 0 12px; color:var(--muted); font-size:.75rem; line-height:1.45; }
      .compact-normative-timeline .timeline-content > h4 { margin-top:5px; }
      .compact-normative-timeline .timeline-type { margin-bottom:0; }
      .timeline-source-links { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .timeline-source-links a { display:inline-flex; padding:5px 7px; border:1px solid #cfd3ff; border-radius:7px; background:#f5f5ff; color:var(--transsa-blue); font-size:.62rem; font-weight:700; text-decoration:none; }
      .timeline-source-links a:hover { text-decoration:underline; }
      @media(max-width:620px){
        .version-comparison-head{display:block;}
        .comparison-statuses{justify-content:flex-start;margin-top:9px;}
      }
    `;
    document.head.appendChild(style);
  }

  const year = value => /^\d{4}/.test(String(value || "")) ? String(value).slice(0, 4) : "sin fecha";

  const analysisLabel = status => ({
    validado: "Cambios validados",
    en_revision: "En revisión",
    en_revision_avanzada: "Revisión avanzada",
    pendiente_documentos: "Pendiente de documentos"
  }[status] || "Pendiente de documentos");

  const sigLabel = status => ({
    incorporado: "Incorporado en SIG",
    probablemente_incorporado: "Probable / parcial",
    no_incorporado: "No incorporado en SIG",
    no_aplica: "No aplica a SIG",
    pendiente_revision: "SIG pendiente"
  }[status] || "SIG pendiente");

  const isOfficialUrl = value => /^https?:\/\//i.test(String(value || "").trim());

  function officialLinks(event) {
    const links = [];
    const documents = Array.isArray(event.documentos_oficiales) ? event.documentos_oficiales : [];

    documents.forEach((document, index) => {
      const url = typeof document === "string" ? document : document?.url;
      if (!isOfficialUrl(url)) return;
      const label = typeof document === "object"
        ? (document.nombre || document.titulo || document.label)
        : "";
      links.push({ url, label: label || `Documento oficial ${index + 1}` });
    });

    if (isOfficialUrl(event.fuente) && !links.some(link => link.url === event.fuente)) {
      links.push({ url: event.fuente, label: links.length ? "Registro oficial" : "Consultar registro oficial" });
    }

    return [...new Map(links.map(link => [link.url, link])).values()];
  }

  function hasDetailedComparison(item) {
    return (item.comparaciones_versiones || []).some(comparison =>
      comparison?.id === "coquimbo-prc-2019-2026" &&
      Array.isArray(comparison.cambios) &&
      comparison.cambios.length
    );
  }

  function strategicTemplate(item) {
    const reading = item.lectura_estrategica || {};
    return `
      <section class="strategic-reading-section">
        <h4>Lectura estratégica</h4>
        <div class="strategic-summary">${escapeHtml(reading.resumen || item.resumen_alerta || "Lectura estratégica pendiente.")}</div>
      </section>
    `;
  }

  function comparisonTemplate(comparison) {
    const previous = comparison.instrumento_anterior || {};
    const current = comparison.instrumento_nuevo || {};
    const analysisClass = comparison.estado_analisis === "validado" ? "validated" : "pending";
    const sigClass = comparison.estado_sig === "no_incorporado"
      ? "no-incorporated"
      : comparison.estado_sig === "incorporado"
        ? "validated"
        : "pending";
    const topics = Array.isArray(comparison.materias_a_comparar) ? comparison.materias_a_comparar : [];

    return `
      <article class="version-comparison-card">
        <div class="version-comparison-head">
          <div>
            <strong>${escapeHtml(`${comparison.tipo_ipt || "IPT"} ${year(previous.fecha)} → ${year(current.fecha)}`)}</strong>
            <small>${escapeHtml(`${previous.nombre || "Versión anterior"} → ${current.nombre || "Versión nueva"}`)}</small>
          </div>
          <div class="comparison-statuses">
            <span class="comparison-chip ${analysisClass}">${escapeHtml(analysisLabel(comparison.estado_analisis))}</span>
            <span class="comparison-chip ${sigClass}">${escapeHtml(sigLabel(comparison.estado_sig))}</span>
          </div>
        </div>
        <p class="comparison-description">${escapeHtml(comparison.resumen_estrategico || "Comparación pendiente.")}</p>
        ${topics.length ? `
          <div class="comparison-topics">
            ${topics.map(topic => `<span class="comparison-topic">${escapeHtml(topic)}</span>`).join("")}
          </div>
        ` : ""}
      </article>
    `;
  }

  function comparisonsTemplate(item) {
    if (hasDetailedComparison(item)) return "";
    const comparisons = Array.isArray(item.comparaciones_versiones) ? item.comparaciones_versiones : [];
    if (!comparisons.length) return "";

    return `
      <section class="version-comparison-section">
        <h4>Comparación general entre versiones</h4>
        <p>Se muestra mientras no exista una comparación normativa detallada de esta comuna.</p>
        <div class="version-comparison-list">
          ${comparisons.map(comparisonTemplate).join("")}
        </div>
      </section>
    `;
  }

  function collapseSupportingRecords(detail, item) {
    const section = detail.querySelector(".commune-change-section");
    if (!section || section.classList.contains("supporting-records-section")) return;

    const list = section.querySelector(".commune-change-list");
    if (!list) return;

    const count = Number(item.cantidad_actos || (item.actos_normativos || []).length || 0);
    section.classList.add("supporting-records-section");
    section.innerHTML = `
      <details class="supporting-detail">
        <summary>
          Antecedentes, fuentes y revisión SIG
          <span>${count} ${count === 1 ? "acto" : "actos"}</span>
        </summary>
        <div class="supporting-detail-body">
          <p>Detalle de modificaciones, enmiendas y rectificaciones vinculadas a la comuna, con su fuente oficial y estado de revisión cartográfica.</p>
          ${list.outerHTML}
        </div>
      </details>
    `;
  }

  function compactTimeline(detail, item) {
    const section = detail.querySelector(".timeline-section");
    if (!section) return;
    const timeline = Array.isArray(item.linea_tiempo) ? item.linea_tiempo : [];

    section.classList.add("compact-normative-timeline");
    section.innerHTML = `
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">LÍNEA DE TIEMPO</p>
          <h3>Trayectoria normativa</h3>
        </div>
        <span class="result-count">${timeline.length} hitos</span>
      </div>
      <div class="timeline">
        ${timeline.length ? timeline.map(event => {
          const eventClass = typeof timelineEventClass === "function" ? timelineEventClass(event) : "pendiente";
          const act = [event.tipo, event.numero].filter(Boolean).join(" · ");
          const links = officialLinks(event);
          return `
            <article class="timeline-event ${escapeAttribute(eventClass)}">
              <div class="timeline-node"></div>
              <div class="timeline-content">
                <div class="timeline-topline"><span>${escapeHtml(/^\d{4}-\d{2}-\d{2}$/.test(String(event.fecha || "")) ? event.fecha : "Sin fecha informada")}</span></div>
                <h4>${escapeHtml(event.titulo || event.tipo || "Acto")}</h4>
                ${act ? `<p class="timeline-type">${escapeHtml(act)}</p>` : ""}
                ${links.length ? `<div class="timeline-source-links">${links.map(link => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} ↗</a>`).join("")}</div>` : ""}
              </div>
            </article>
          `;
        }).join("") : '<div class="empty-state"><p>No hay hitos normativos disponibles.</p></div>'}
      </div>
    `;
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderStrategicVigenciaDetail() {
    originalRenderDetail();
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    if (!item) return;

    const detail = document.getElementById("vigenciaDetail");
    if (!detail) return;

    const planSection = detail.querySelector(".commune-plan-section");
    const mapSection = detail.querySelector(".vigencia-map-section");
    const strategicAnchor = planSection || mapSection;

    if (strategicAnchor && !detail.querySelector(".strategic-reading-section")) {
      strategicAnchor.insertAdjacentHTML("beforebegin", strategicTemplate(item));
    }

    const comparisonHtml = comparisonsTemplate(item);
    const comparisonAnchor = detail.querySelector(".commune-change-section") || mapSection;
    if (comparisonHtml && comparisonAnchor && !detail.querySelector(".version-comparison-section")) {
      comparisonAnchor.insertAdjacentHTML("beforebegin", comparisonHtml);
    }

    collapseSupportingRecords(detail, item);
    compactTimeline(detail, item);
  };

  injectStyles();
  if (typeof renderVigencia === "function") renderVigencia();
})();
