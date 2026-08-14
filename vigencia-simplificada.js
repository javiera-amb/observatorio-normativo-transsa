(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La simplificación comunal se cargó antes que la vista IPT.");
    return;
  }

  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  const planDate = plan => validDate(plan?.fecha) ? plan.fecha : "0000-00-00";

  function injectStyles() {
    if (document.getElementById("vigenciaSimplificadaStyles")) return;
    const style = document.createElement("style");
    style.id = "vigenciaSimplificadaStyles";
    style.textContent = `
      .vigencia-workspace { grid-template-columns:minmax(360px,.95fr) minmax(0,1.55fr); }
      .compact-normative-timeline .timeline { display:grid; grid-template-columns:1fr; gap:0; margin:0 0 0 9px; position:relative; }
      .compact-normative-timeline .timeline::before { display:block; top:8px; bottom:8px; left:7px; }
      .compact-normative-timeline .timeline-event { display:grid; grid-template-columns:16px minmax(0,1fr); gap:15px; min-width:0; padding:0 0 18px; border:0; border-radius:0; background:transparent; }
      .compact-normative-timeline .timeline-event:last-child { padding-bottom:0; }
      .compact-normative-timeline .timeline-node { width:16px; height:16px; margin-top:3px; border-width:3px; }
      .compact-normative-timeline .timeline-content { min-width:0; padding:0 0 16px; border-bottom:1px solid var(--line); }
      .compact-normative-timeline .timeline-event:last-child .timeline-content { padding-bottom:0; border-bottom:0; }
      .compact-normative-timeline .timeline-content h4 { margin:4px 0 0; font-size:.78rem; line-height:1.4; }
      .compact-normative-timeline .timeline-topline { font-size:.65rem; }
      .compact-normative-timeline .timeline-type { font-size:.66rem; line-height:1.4; }
      .normative-change-empty { padding:16px; border:1px dashed #cfd3e1; border-radius:12px; background:var(--surface-soft); }
      .normative-change-empty strong { display:block; color:var(--transsa-navy); font-size:.82rem; }
      .normative-change-empty p { margin:7px 0 0; color:var(--muted); font-size:.75rem; line-height:1.5; }
      .normative-change-pending-list { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
      .normative-change-pending-list span { padding:5px 7px; border:1px solid var(--line); border-radius:7px; background:#fff; color:var(--muted); font-size:.64rem; }
      @media(max-width:980px){ .vigencia-workspace{grid-template-columns:1fr;} .vigencia-list-panel{position:static;} }
      @media(max-width:560px){ .compact-normative-timeline .timeline{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(style);
  }

  function roleForPlan(plan, latestByType) {
    const type = String(plan?.tipo_ipt || "IPT").trim();
    const isLatest = latestByType.get(type) === plan;
    if (!isLatest) return `Versión anterior de ${type} registrada`;
    if (type === "PRC") return "Último PRC registrado";
    if (type === "PS") return "Plan seccional aplicable en su ámbito";
    if (["PRI", "PRM", "PRDU"].includes(type)) return "Normativa superior o intercomunal aplicable";
    if (type === "LU") return "Límite urbano aplicable";
    return `Último ${type} registrado`;
  }

  function genericFrameworkTemplate(item) {
    const plans = Array.isArray(item.instrumentos) ? [...item.instrumentos] : [];
    if (!plans.length) return "";

    const latestByType = new Map();
    plans.forEach(plan => {
      const type = String(plan?.tipo_ipt || "IPT").trim();
      const current = latestByType.get(type);
      if (!current || planDate(plan) > planDate(current)) latestByType.set(type, plan);
    });

    plans.sort((a, b) => {
      const aLatest = latestByType.get(String(a?.tipo_ipt || "IPT").trim()) === a ? 1 : 0;
      const bLatest = latestByType.get(String(b?.tipo_ipt || "IPT").trim()) === b ? 1 : 0;
      return bLatest - aLatest || planDate(b).localeCompare(planDate(a)) || String(a?.tipo_ipt || "").localeCompare(String(b?.tipo_ipt || ""), "es");
    });

    return `
      <section class="normative-framework-section normative-framework-general">
        <h4>Normativa aplicable y versiones</h4>
        <p class="section-helper">Se ordenan los últimos instrumentos registrados y sus versiones anteriores. La condición definitiva de vigencia se confirma en la auditoría documental.</p>
        <div class="normative-framework-grid">
          ${plans.map(plan => {
            const type = String(plan?.tipo_ipt || "IPT").trim();
            const isLatest = latestByType.get(type) === plan;
            const cardClass = isLatest && type === "PRC" ? "current" : isLatest ? "context" : "replaced";
            return `
              <article class="normative-role-card ${cardClass}">
                <span>${escape(roleForPlan(plan, latestByType))}</span>
                <strong>${escape(plan.nombre || type)}</strong>
                <small>${escape([type, plan.fecha].filter(Boolean).join(" · "))}</small>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function hasComparableGeometry(item) {
    const base = item?.mapa?.base_geojson || item?.archivo_geojson;
    const overlays = Array.isArray(item?.mapa?.capas_modificaciones)
      ? item.mapa.capas_modificaciones.some(layer => layer?.archivo_geojson)
      : false;
    const results = Array.isArray(item?.comparaciones_espaciales) && item.comparaciones_espaciales.length > 0;
    return Boolean(base || overlays || results);
  }

  function ensureFramework(detail, item) {
    if (detail.querySelector(".normative-framework-section")) return true;
    const html = genericFrameworkTemplate(item);
    if (!html) return false;
    const anchor = detail.querySelector(
      ".version-comparison-section, .supporting-records-section, .commune-change-section, .vigencia-map-section, .timeline-section"
    );
    if (anchor) anchor.insertAdjacentHTML("beforebegin", html);
    else detail.insertAdjacentHTML("beforeend", html);
    return true;
  }

  const changeTypeLabel = value => String(value || "Cambio normativo")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());

  const comparisonYear = (comparison, key, fallback) => {
    const date = comparison?.[key]?.fecha;
    return /^\d{4}/.test(String(date || "")) ? String(date).slice(0, 4) : fallback;
  };

  function normativeChangesTemplate(item) {
    const comparisons = Array.isArray(item?.comparaciones_versiones) ? item.comparaciones_versiones : [];
    const changes = comparisons.flatMap(comparison =>
      (Array.isArray(comparison?.cambios) ? comparison.cambios : [])
        .map(change => ({ change, comparison }))
    );

    if (!changes.length) {
      const topics = [...new Set(comparisons.flatMap(comparison =>
        Array.isArray(comparison?.materias_a_comparar) ? comparison.materias_a_comparar : []
      ))];
      return `
        <section class="detailed-comparison-section normative-change-detail-section">
          <div class="detailed-comparison-heading">
            <div>
              <h4>Detalle de cambios normativos</h4>
              <p>Comparación por zona, uso y parámetro urbanístico.</p>
            </div>
            <span class="detailed-comparison-status">Comparación pendiente</span>
          </div>
          <div class="normative-change-empty">
            <strong>Aún no hay cambios específicos validados para esta transición.</strong>
            <p>La plataforma no declarará una zona como creada, eliminada, absorbida o subdividida —ni informará variaciones de densidad, altura u otros parámetros— hasta contrastar las ordenanzas y los planos oficiales.</p>
            ${topics.length ? `<div class="normative-change-pending-list">${topics.map(topic => `<span>${escape(topic)}</span>`).join("")}</div>` : ""}
          </div>
        </section>
      `;
    }

    return `
      <section class="detailed-comparison-section normative-change-detail-section">
        <div class="detailed-comparison-heading">
          <div>
            <h4>Detalle de cambios normativos</h4>
            <p>Zonas creadas, eliminadas, absorbidas, subdivididas o recodificadas, junto con sus cambios completos de norma.</p>
          </div>
          <span class="detailed-comparison-status">${changes.length} ${changes.length === 1 ? "cambio documentado" : "cambios documentados"}</span>
        </div>
        <div class="detailed-change-list">
          ${changes.map(({ change, comparison }) => {
            const previousYear = comparisonYear(comparison, "instrumento_anterior", "Antes");
            const currentYear = comparisonYear(comparison, "instrumento_nuevo", "Después");
            return `
              <article class="detailed-change-card">
                <div class="detailed-change-title">
                  <span class="change-type-pill">${escape(changeTypeLabel(change.tipo_cambio))}</span>
                  <strong>${escape(change.materia || "Cambio normativo")}</strong>
                </div>
                ${Array.isArray(change.zonas) && change.zonas.length ? `<div class="detailed-change-zones">${change.zonas.map(zone => `<span>${escape(zone)}</span>`).join("")}</div>` : ""}
                <div class="before-after-grid">
                  <div class="before-after-box"><span>${escape(previousYear)}</span><p>${escape(change.antes || "Sin antecedente documentado.")}</p></div>
                  <div class="before-after-box"><span>${escape(currentYear)}</span><p>${escape(change.despues || "Sin resultado documentado.")}</p></div>
                </div>
                ${change.impacto ? `<p class="detailed-impact"><strong>Impacto urbano:</strong> ${escape(change.impacto)}</p>` : ""}
                <details class="change-support-details">
                  <summary>Evidencia y estado de revisión</summary>
                  <div class="change-support-body">
                    ${change.estado_sig ? `<span class="change-sig-pill ${escape(change.estado_sig)}">${escape(change.estado_sig.replaceAll("_", " "))}</span>` : ""}
                    ${change.evidencia ? `<span>${escape(change.evidencia)}</span>` : ""}
                    ${change.fuente ? `<a href="${escape(change.fuente)}" target="_blank" rel="noopener noreferrer">Abrir documento oficial ↗</a>` : ""}
                  </div>
                </details>
              </article>
            `;
          }).join("")}
        </div>
        <details class="comparison-validation-details">
          <summary>Alcance de la comparación</summary>
          <p>Los cambios documentales se distinguen de su aplicación espacial. La asignación de superficies y polígonos se cerrará únicamente después de comparar cartografía oficial y ejecutar el QA SIG.</p>
        </details>
      </section>
    `;
  }

  function ensureNormativeChanges(detail, item) {
    detail.querySelector(".normative-change-detail-section")?.remove();
    detail.insertAdjacentHTML("beforeend", normativeChangesTemplate(item));
  }

  function simplifyCommuneDetail() {
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail) return;

    detail.querySelector(".strategic-reading-section")?.remove();

    // La cabecera extensa repetía la información que ahora resume la tarjeta
    // de la comuna seleccionada en la columna izquierda.
    detail.querySelector(".vigencia-detail-header")?.remove();
    detail.querySelector(".vigencia-summary-text")?.remove();
    detail.querySelector(".detail-grid")?.remove();
    detail.querySelector(".vigencia-alert-list")?.remove();

    const frameworkReady = ensureFramework(detail, item);
    if (frameworkReady) detail.querySelector(".commune-plan-section")?.remove();

    const mapSection = detail.querySelector(".vigencia-map-section");
    if (mapSection && !hasComparableGeometry(item)) {
      // Se conserva el nodo para que la carga asíncrona de Leaflet no intente
      // escribir sobre elementos eliminados, pero no ocupa espacio en la ficha.
      mapSection.hidden = true;
      mapSection.setAttribute("aria-hidden", "true");
    }

    const timeline = detail.querySelector(".timeline-section");
    const firstDetailedSection = detail.querySelector(
      ".transition-package-section, .source-audit-section, .coquimbo-audit-package, .normative-framework-section, .version-comparison-section, .supporting-records-section, .commune-change-section, .spatial-results-section, .vigencia-zones-section"
    );
    if (timeline && firstDetailedSection && timeline !== firstDetailedSection) {
      firstDetailedSection.insertAdjacentElement("beforebegin", timeline);
    }

    ensureNormativeChanges(detail, item);
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderSimplifiedCommuneDetail() {
    originalRenderDetail();
    simplifyCommuneDetail();
  };

  injectStyles();
  if (typeof renderVigencia === "function") renderVigencia();
})();
