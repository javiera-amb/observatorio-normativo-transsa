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
      .version-comparison-section h4 { margin:0 0 5px; color:var(--transsa-navy); }
      .strategic-reading-section > p,
      .version-comparison-section > p { margin:0 0 15px; color:var(--muted); font-size:.82rem; }
      .strategic-summary { padding:15px; border-radius:12px; background:var(--surface-soft); color:var(--transsa-navy); font-size:.86rem; line-height:1.55; }
      .strategic-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:10px; margin-top:12px; }
      .strategic-stat { padding:13px; border:1px solid var(--line); border-radius:12px; background:#fff; }
      .strategic-stat span,.strategic-stat strong { display:block; }
      .strategic-stat span { color:var(--muted); font-size:.68rem; text-transform:uppercase; letter-spacing:.04em; }
      .strategic-stat strong { margin-top:5px; color:var(--transsa-navy); font-size:.88rem; }
      .strategic-warning { margin:12px 0 0; padding:11px 13px; border-left:3px solid #d99b27; border-radius:8px; background:#fff8eb; color:#76511c; font-size:.75rem; line-height:1.45; }
      .consolidated-prc { margin-top:14px; padding:15px; border:1px solid var(--line); border-radius:13px; background:var(--surface-soft); }
      .consolidated-prc-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
      .consolidated-prc-head h5 { margin:0; color:var(--transsa-navy); font-size:.88rem; }
      .consolidated-prc-head p { margin:4px 0 0; color:var(--muted); font-size:.73rem; line-height:1.45; }
      .consolidated-prc-badge { padding:6px 8px; border-radius:999px; background:#e8edff; color:var(--transsa-blue); font-size:.65rem; font-weight:700; white-space:nowrap; }
      .prc-base-card { margin-top:12px; padding:12px; border:1px solid var(--line); border-radius:10px; background:#fff; }
      .prc-base-card span,.prc-base-card strong,.prc-base-card small { display:block; }
      .prc-base-card span { color:var(--muted); font-size:.65rem; text-transform:uppercase; letter-spacing:.04em; }
      .prc-base-card strong { margin-top:4px; color:var(--transsa-navy); font-size:.83rem; }
      .prc-base-card small { margin-top:4px; color:var(--muted); font-size:.7rem; }
      .sectional-overlay-list { display:grid; gap:8px; margin-top:10px; }
      .sectional-overlay-item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; padding:11px 12px; border:1px solid var(--line); border-radius:10px; background:#fff; }
      .sectional-overlay-item strong,.sectional-overlay-item span { display:block; }
      .sectional-overlay-item strong { color:var(--transsa-navy); font-size:.78rem; }
      .sectional-overlay-item span { margin-top:3px; color:var(--muted); font-size:.69rem; line-height:1.4; }
      .sectional-overlay-status { align-self:start; padding:5px 7px; border-radius:999px; color:#76511c; background:#fff3d8; font-size:.62rem; font-weight:700; white-space:nowrap; }
      .consolidated-prc-empty { margin-top:10px; padding:10px; border:1px dashed var(--line); border-radius:9px; color:var(--muted); background:#fff; font-size:.72rem; }
      .version-comparison-list { display:grid; gap:12px; }
      .version-comparison-card { padding:16px; border:1px solid var(--line); border-radius:13px; background:var(--surface-soft); }
      .version-comparison-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
      .version-comparison-head strong { display:block; color:var(--transsa-navy); font-size:.92rem; }
      .version-comparison-head small { display:block; margin-top:4px; color:var(--muted); }
      .comparison-statuses { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
      .comparison-chip { padding:6px 8px; border-radius:999px; font-size:.66rem; font-weight:700; white-space:nowrap; }
      .comparison-chip.pending { color:#76511c; background:#fff3d8; }
      .comparison-chip.validated { color:#176342; background:#e4f5ec; }
      .comparison-chip.no-incorporated { color:#922f38; background:#fde8ea; }
      .comparison-description { margin:12px 0; color:#434b5b; font-size:.8rem; line-height:1.5; }
      .comparison-change-list { display:grid; gap:9px; }
      .comparison-change { padding:12px; border-radius:10px; background:#fff; border:1px solid var(--line); }
      .comparison-change strong { color:var(--transsa-navy); font-size:.8rem; }
      .comparison-columns { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
      .comparison-column { padding:9px; border-radius:8px; background:var(--surface-soft); font-size:.73rem; }
      .comparison-column span { display:block; margin-bottom:3px; color:var(--muted); font-size:.63rem; text-transform:uppercase; }
      .comparison-impact { margin:8px 0 0; color:#434b5b; font-size:.75rem; }
      .comparison-topics { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .comparison-topic { padding:5px 7px; border-radius:7px; background:#fff; border:1px solid var(--line); color:var(--muted); font-size:.66rem; }
      @media(max-width:620px){
        .comparison-columns{grid-template-columns:1fr;}
        .version-comparison-head,.consolidated-prc-head{display:block;}
        .comparison-statuses{justify-content:flex-start;margin-top:9px;}
        .consolidated-prc-badge{display:inline-flex;margin-top:8px;}
        .sectional-overlay-item{grid-template-columns:1fr;}
      }
    `;
    document.head.appendChild(style);
  }

  const year = value => /^\d{4}/.test(String(value || "")) ? String(value).slice(0, 4) : "sin fecha";

  function planLabel(plan) {
    if (!plan) return "No identificado";
    return `${plan.tipo_ipt || "IPT"} ${year(plan.fecha)}`;
  }

  function consolidatedPrcTemplate(item) {
    const consolidated = item.marco_comunal_consolidado || {};
    const base = consolidated.prc_base || null;
    const sectionals = Array.isArray(consolidated.seccionales) ? consolidated.seccionales : [];

    return `
      <div class="consolidated-prc">
        <div class="consolidated-prc-head">
          <div>
            <h5>PRC consolidado para análisis</h5>
            <p>El PRC se usa como base. Los planes seccionales no se tratan como versiones del PRC: se incorporan como normativa sectorial que lo reemplaza dentro de su propio ámbito.</p>
          </div>
          <span class="consolidated-prc-badge">${sectionals.length} ${sectionals.length === 1 ? "seccional integrado" : "seccionales integrados"}</span>
        </div>

        ${base ? `
          <article class="prc-base-card">
            <span>PRC base vigente</span>
            <strong>${escapeHtml(base.nombre || "Plan Regulador Comunal")}</strong>
            <small>${escapeHtml([base.fecha || "Sin fecha", base.registro ? `Registro ${base.registro}` : ""].filter(Boolean).join(" · "))}</small>
          </article>
        ` : `
          <div class="consolidated-prc-empty">No se ha identificado un PRC base vigente. Los seccionales se mantienen visibles, pero la consolidación queda pendiente.</div>
        `}

        ${sectionals.length ? `
          <div class="sectional-overlay-list">
            ${sectionals.map(plan => `
              <article class="sectional-overlay-item">
                <div>
                  <strong>${escapeHtml(plan.nombre || "Plan seccional")}</strong>
                  <span>${escapeHtml([plan.fecha || "Sin fecha", plan.registro ? `Registro ${plan.registro}` : ""].filter(Boolean).join(" · "))}</span>
                  <span>${escapeHtml(plan.descripcion_relacion || "Reemplaza la normativa del PRC dentro de su ámbito territorial de aplicación.")}</span>
                </div>
                <span class="sectional-overlay-status">Integración SIG pendiente</span>
              </article>
            `).join("")}
          </div>
        ` : `
          <div class="consolidated-prc-empty">No se registran planes seccionales vigentes para integrar al PRC de esta comuna.</div>
        `}
      </div>
    `;
  }

  function strategicTemplate(item) {
    const reading = item.lectura_estrategica || {};
    return `
      <section class="strategic-reading-section">
        <h4>Lectura estratégica para el desarrollo urbano</h4>
        <p>Resume qué marco normativo aplica, qué transiciones deben analizarse y qué validaciones siguen pendientes.</p>
        <div class="strategic-summary">${escapeHtml(reading.resumen || item.resumen_alerta || "Lectura estratégica pendiente.")}</div>
        <div class="strategic-grid">
          <article class="strategic-stat">
            <span>PRC base</span>
            <strong>${escapeHtml(planLabel(reading.instrumento_comunal_principal))}</strong>
          </article>
          <article class="strategic-stat">
            <span>Marco intercomunal</span>
            <strong>${escapeHtml(planLabel(reading.instrumento_intercomunal_principal))}</strong>
          </article>
          <article class="strategic-stat">
            <span>Seccionales integrados</span>
            <strong>${Number(reading.seccionales_integrados || 0)}</strong>
          </article>
          <article class="strategic-stat">
            <span>Comparaciones pendientes</span>
            <strong>${Number(reading.comparaciones_pendientes || 0)}</strong>
          </article>
          <article class="strategic-stat">
            <span>Revisiones SIG pendientes</span>
            <strong>${Number(reading.verificaciones_sig_pendientes || 0)}</strong>
          </article>
        </div>
        ${consolidatedPrcTemplate(item)}
        <p class="strategic-warning">${escapeHtml(reading.advertencia || "Los impactos deben respaldarse con evidencia documental y cartográfica.")}</p>
      </section>
    `;
  }

  const analysisLabel = status => ({
    validado: "Cambios validados",
    en_revision: "En revisión",
    pendiente_documentos: "Pendiente de documentos"
  }[status] || "Pendiente de documentos");

  const sigLabel = status => ({
    incorporado: "Incorporado en SIG",
    probablemente_incorporado: "Probable / parcial",
    no_incorporado: "No incorporado en SIG",
    no_aplica: "No aplica a SIG",
    pendiente_revision: "SIG pendiente"
  }[status] || "SIG pendiente");

  function changeTemplate(change) {
    return `
      <article class="comparison-change">
        <strong>${escapeHtml(change.materia || "Cambio normativo")}</strong>
        <div class="comparison-columns">
          <div class="comparison-column"><span>Antes</span>${escapeHtml(change.antes || "Sin antecedente registrado")}</div>
          <div class="comparison-column"><span>Después</span>${escapeHtml(change.despues || "Sin antecedente registrado")}</div>
        </div>
        ${change.impacto ? `<p class="comparison-impact"><strong>Impacto urbano:</strong> ${escapeHtml(change.impacto)}</p>` : ""}
        ${change.fuente ? `<a class="commune-plan-source" href="${escapeAttribute(change.fuente)}" target="_blank" rel="noopener noreferrer">Ver evidencia →</a>` : ""}
      </article>
    `;
  }

  function comparisonTemplate(comparison) {
    const previous = comparison.instrumento_anterior || {};
    const current = comparison.instrumento_nuevo || {};
    const analysisClass = comparison.estado_analisis === "validado" ? "validated" : "pending";
    const sigClass = comparison.estado_sig === "no_incorporado" ? "no-incorporated" : comparison.estado_sig === "incorporado" ? "validated" : "pending";
    const changes = Array.isArray(comparison.cambios) ? comparison.cambios : [];
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
        ${changes.length ? `
          <div class="comparison-change-list">${changes.map(changeTemplate).join("")}</div>
        ` : `
          <div class="comparison-topics">
            ${topics.map(topic => `<span class="comparison-topic">${escapeHtml(topic)}</span>`).join("")}
          </div>
        `}
      </article>
    `;
  }

  function comparisonsTemplate(item) {
    const comparisons = Array.isArray(item.comparaciones_versiones) ? item.comparaciones_versiones : [];
    return `
      <section class="version-comparison-section">
        <h4>Comparación entre versiones del IPT</h4>
        <p>Solo se comparan versiones que pertenecen al mismo instrumento. Los planes seccionales distintos se mantienen separados y se integran al PRC como normativa sectorial.</p>
        <div class="version-comparison-list">
          ${comparisons.length
            ? comparisons.map(comparisonTemplate).join("")
            : '<div class="commune-change-empty">No se detectó otra versión del mismo instrumento dentro de la base cargada.</div>'}
        </div>
      </section>
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

    const comparisonAnchor = detail.querySelector(".commune-change-section") || mapSection;
    if (comparisonAnchor && !detail.querySelector(".version-comparison-section")) {
      comparisonAnchor.insertAdjacentHTML("beforebegin", comparisonsTemplate(item));
    }
  };

  injectStyles();
  if (typeof renderVigencia === "function") renderVigencia();
})();
