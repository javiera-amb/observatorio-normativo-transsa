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
      .detailed-comparison-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}
      .detailed-comparison-heading h4{margin:0;color:var(--transsa-navy)}
      .detailed-comparison-heading p{margin:5px 0 0;color:var(--muted);font-size:.8rem;line-height:1.5}
      .detailed-comparison-status{padding:7px 10px;border-radius:999px;background:#fff3cf;color:#735110;font-size:.68rem;font-weight:700;white-space:nowrap}
      .detailed-comparison-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 15px}
      .detailed-comparison-summary div{padding:10px 12px;border-radius:10px;background:var(--surface-soft)}
      .detailed-comparison-summary span,.detailed-comparison-summary strong{display:block}
      .detailed-comparison-summary span{color:var(--muted);font-size:.62rem;text-transform:uppercase;letter-spacing:.04em}
      .detailed-comparison-summary strong{margin-top:4px;color:var(--transsa-navy);font-size:.82rem}
      .detailed-change-list{display:grid;gap:10px}
      .detailed-change-card{padding:15px;border:1px solid var(--line);border-radius:13px;background:var(--surface-soft)}
      .detailed-change-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .detailed-change-title{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
      .detailed-change-title strong{color:var(--transsa-navy);font-size:.88rem}
      .change-type-pill{padding:4px 7px;border-radius:7px;background:var(--transsa-pale);color:var(--transsa-blue);font-size:.65rem;font-weight:700}
      .change-sig-pill{padding:5px 8px;border-radius:999px;font-size:.64rem;font-weight:700;white-space:nowrap}
      .change-sig-pill.pendiente_revision{background:#fff3cf;color:#735110}
      .change-sig-pill.no_aplica{background:#edf0f4;color:#56616f}
      .change-sig-pill.incorporado{background:#e4f5ec;color:#176342}
      .detailed-change-zones{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      .detailed-change-zones span{padding:4px 7px;border-radius:7px;background:#fff;color:#4d5565;font-size:.65rem;border:1px solid var(--line)}
      .before-after-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}
      .before-after-box{padding:11px;border-radius:10px;background:#fff;border:1px solid var(--line)}
      .before-after-box span{display:block;margin-bottom:5px;color:var(--muted);font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
      .before-after-box p{margin:0;color:#424a59;font-size:.74rem;line-height:1.5}
      .detailed-impact{margin:10px 0 0;color:#303747;font-size:.75rem;line-height:1.55}
      .detailed-evidence{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:9px;color:var(--muted);font-size:.66rem}
      .detailed-evidence a{color:var(--transsa-blue);font-weight:600}
      .detailed-comparison-note{margin-top:12px;padding:11px 12px;border-left:3px solid #d7951f;border-radius:8px;background:#fff7e8;color:#6a5125;font-size:.72rem;line-height:1.5}
      @media(max-width:760px){
        .detailed-comparison-heading{display:block}
        .detailed-comparison-status{display:inline-flex;margin-top:8px}
        .detailed-comparison-summary,.before-after-grid{grid-template-columns:1fr}
        .detailed-change-top{display:block}
        .change-sig-pill{display:inline-flex;margin-top:7px}
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
    const pendingSig = changes.filter(change => change.estado_sig === "pendiente_revision").length;
    const documented = changes.filter(change => String(change.estado_documental || "").startsWith("validado")).length;

    return `
      <section class="detailed-comparison-section">
        <div class="detailed-comparison-heading">
          <div>
            <h4>Cambios específicos del PRC 2019 → 2026</h4>
            <p>Comparación documental por zona y parámetro. Cada cambio mantiene separado su estado documental y su verificación cartográfica.</p>
          </div>
          <span class="detailed-comparison-status">Revisión documental avanzada</span>
        </div>
        <div class="detailed-comparison-summary">
          <div><span>Cambios identificados</span><strong>${changes.length}</strong></div>
          <div><span>Con respaldo documental</span><strong>${documented}</strong></div>
          <div><span>Pendientes de SIG</span><strong>${pendingSig}</strong></div>
        </div>
        <div class="detailed-change-list">
          ${changes.map(change => `
            <article class="detailed-change-card">
              <div class="detailed-change-top">
                <div class="detailed-change-title">
                  <span class="change-type-pill">${escape(typeLabel(change.tipo_cambio))}</span>
                  <strong>${escape(change.materia)}</strong>
                </div>
                <span class="change-sig-pill ${escape(change.estado_sig || "pendiente_revision")}">${escape(sigLabel(change.estado_sig))}</span>
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
              <div class="detailed-evidence">
                ${change.evidencia ? `<span>${escape(change.evidencia)}</span>` : ""}
                ${change.fuente ? `<a href="${escape(change.fuente)}" target="_blank" rel="noopener noreferrer">Abrir fuente →</a>` : ""}
              </div>
            </article>
          `).join("")}
        </div>
        <div class="detailed-comparison-note">
          Los cambios de catálogo y parámetros ya están documentados. La plataforma no declarará qué polígono fue reemplazado ni cuántas hectáreas afecta hasta comparar las láminas oficiales 2019 y 2026 y validar el resultado en SIG.
        </div>
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

    const headings = [...detail.querySelectorAll("h3,h4")];
    const comparisonHeading = headings.find(heading => heading.textContent.includes("Comparación entre versiones"));
    const comparisonSection = comparisonHeading?.closest("section") || comparisonHeading?.parentElement?.parentElement;
    const fallback = detail.querySelector(".commune-change-section, .vigencia-map-section");

    if (comparisonSection) {
      comparisonSection.insertAdjacentHTML("afterend", comparisonTemplate(comparison));
    } else if (fallback) {
      fallback.insertAdjacentHTML("beforebegin", comparisonTemplate(comparison));
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
