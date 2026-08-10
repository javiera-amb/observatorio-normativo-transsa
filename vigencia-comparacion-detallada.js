(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La comparación normativa detallada se cargó antes que la vista IPT.");
    return;
  }

  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function injectStyles() {
    if (document.getElementById("detailedComparisonStyles")) return;
    const style = document.createElement("style");
    style.id = "detailedComparisonStyles";
    style.textContent = `
      .detailed-comparison-section{margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff}
      .detailed-comparison-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      .detailed-comparison-heading h4{margin:0;color:var(--transsa-navy)}
      .detailed-comparison-heading p{margin:5px 0 0;color:var(--muted);font-size:.78rem;line-height:1.5}
      .detailed-comparison-status{padding:7px 10px;border-radius:999px;background:#fff3cf;color:#735110;font-size:.67rem;font-weight:700;white-space:nowrap}
      .detailed-comparison-count{margin:0 0 14px;color:var(--muted);font-size:.72rem}
      .detailed-change-list{display:grid;gap:10px}
      .detailed-change-card{padding:15px;border:1px solid var(--line);border-radius:13px;background:var(--surface-soft)}
      .detailed-change-title{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
      .detailed-change-title strong{color:var(--transsa-navy);font-size:.88rem}
      .change-type-pill{padding:4px 7px;border-radius:7px;background:var(--transsa-pale);color:var(--transsa-blue);font-size:.64rem;font-weight:700}
      .detailed-change-zones{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      .detailed-change-zones span{padding:4px 7px;border-radius:7px;background:#fff;color:#4d5565;font-size:.64rem;border:1px solid var(--line)}
      .before-after-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}
      .before-after-box{padding:11px;border-radius:10px;background:#fff;border:1px solid var(--line)}
      .before-after-box span{display:block;margin-bottom:5px;color:var(--muted);font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
      .before-after-box p{margin:0;color:#424a59;font-size:.74rem;line-height:1.5}
      .detailed-impact{margin:10px 0 0;color:#303747;font-size:.75rem;line-height:1.55}
      .change-support-details,.comparison-validation-details{margin-top:10px;border-top:1px solid var(--line)}
      .change-support-details summary,.comparison-validation-details summary{padding-top:9px;cursor:pointer;color:var(--transsa-blue);font-size:.67rem;font-weight:700;list-style:none}
      .change-support-details summary::-webkit-details-marker,.comparison-validation-details summary::-webkit-details-marker{display:none}
      .change-support-details summary::after,.comparison-validation-details summary::after{content:" +"}
      .change-support-details[open] summary::after,.comparison-validation-details[open] summary::after{content:" −"}
      .change-support-body{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;color:var(--muted);font-size:.66rem;line-height:1.45}
      .change-support-body a{color:var(--transsa-blue);font-weight:600}
      .change-sig-pill{padding:5px 8px;border-radius:999px;font-size:.63rem;font-weight:700;white-space:nowrap}
      .change-sig-pill.pendiente_revision{background:#fff3cf;color:#735110}
      .change-sig-pill.no_aplica{background:#edf0f4;color:#56616f}
      .change-sig-pill.incorporado{background:#e4f5ec;color:#176342}
      .change-sig-pill.no_incorporado{background:#fde8ea;color:#922f38}
      .comparison-validation-details{margin-top:14px;padding-top:2px}
      .comparison-validation-details p{margin:8px 0 0;padding:11px 12px;border-left:3px solid #d7951f;border-radius:8px;background:#fff7e8;color:#6a5125;font-size:.71rem;line-height:1.5}
      @media(max-width:760px){
        .detailed-comparison-heading{display:block}
        .detailed-comparison-status{display:inline-flex;margin-top:8px}
        .before-after-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  const sigLabel = status => ({
    pendiente_revision: "SIG pendiente",
    no_aplica: "No aplica a SIG",
    incorporado: "Incorporado en SIG",
    no_incorporado: "No incorporado"
  }[status] || "SIG pendiente");

  const typeLabel = value => String(value || "Cambio")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());

  function comparisonTemplate(comparison) {
    const changes = Array.isArray(comparison.cambios) ? comparison.cambios : [];

    return `
      <section class="detailed-comparison-section">
        <div class="detailed-comparison-heading">
          <div>
            <h4>Cambios específicos del PRC 2019 → 2026</h4>
            <p>Comparación por zona y parámetro, mostrando una sola vez el cambio y su impacto urbano.</p>
          </div>
          <span class="detailed-comparison-status">Revisión documental avanzada</span>
        </div>
        <p class="detailed-comparison-count">${changes.length} ${changes.length === 1 ? "cambio identificado" : "cambios identificados"}</p>
        <div class="detailed-change-list">
          ${changes.map(change => `
            <article class="detailed-change-card">
              <div class="detailed-change-title">
                <span class="change-type-pill">${escape(typeLabel(change.tipo_cambio))}</span>
                <strong>${escape(change.materia)}</strong>
              </div>
              ${Array.isArray(change.zonas) && change.zonas.length ? `
                <div class="detailed-change-zones">
                  ${change.zonas.map(zone => `<span>${escape(zone)}</span>`).join("")}
                </div>
              ` : ""}
              <div class="before-after-grid">
                <div class="before-after-box"><span>PRC 2019</span><p>${escape(change.antes)}</p></div>
                <div class="before-after-box"><span>PRC 2026</span><p>${escape(change.despues)}</p></div>
              </div>
              <p class="detailed-impact"><strong>Impacto urbano:</strong> ${escape(change.impacto)}</p>
              <details class="change-support-details">
                <summary>Fuente y estado de revisión</summary>
                <div class="change-support-body">
                  <span class="change-sig-pill ${escape(change.estado_sig || "pendiente_revision")}">${escape(sigLabel(change.estado_sig))}</span>
                  ${change.evidencia ? `<span>${escape(change.evidencia)}</span>` : ""}
                  ${change.fuente ? `<a href="${escape(change.fuente)}" target="_blank" rel="noopener noreferrer">Abrir fuente →</a>` : ""}
                </div>
              </details>
            </article>
          `).join("")}
        </div>
        <details class="comparison-validation-details">
          <summary>Alcance y validaciones pendientes</summary>
          <p>Los cambios de catálogo y parámetros están documentados. La plataforma no asignará polígonos reemplazados ni superficies afectadas hasta comparar las láminas oficiales 2019 y 2026 y validar el resultado en SIG.</p>
        </details>
      </section>
    `;
  }

  function addDetailedComparison() {
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail || detail.querySelector(".detailed-comparison-section")) return;

    const comparison = (item.comparaciones_versiones || [])
      .find(candidate => candidate.id === "coquimbo-prc-2019-2026" && Array.isArray(candidate.cambios) && candidate.cambios.length);
    if (!comparison) return;

    const planSection = detail.querySelector(".commune-plan-section");
    const supportingSection = detail.querySelector(".supporting-records-section, .commune-change-section");
    const mapSection = detail.querySelector(".vigencia-map-section");

    if (supportingSection) {
      supportingSection.insertAdjacentHTML("beforebegin", comparisonTemplate(comparison));
    } else if (planSection) {
      planSection.insertAdjacentHTML("afterend", comparisonTemplate(comparison));
    } else if (mapSection) {
      mapSection.insertAdjacentHTML("beforebegin", comparisonTemplate(comparison));
    } else {
      detail.insertAdjacentHTML("beforeend", comparisonTemplate(comparison));
    }
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderDetailedComparison() {
    originalRenderDetail();
    addDetailedComparison();
  };

  injectStyles();
  if (typeof renderVigencia === "function") renderVigencia();
})();