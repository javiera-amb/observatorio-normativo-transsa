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

  function simplifyCommuneDetail() {
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail) return;

    detail.querySelector(".strategic-reading-section")?.remove();

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
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderSimplifiedCommuneDetail() {
    originalRenderDetail();
    simplifyCommuneDetail();
  };

  if (typeof renderVigencia === "function") renderVigencia();
})();
