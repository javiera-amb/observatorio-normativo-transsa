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
      .normative-consolidation-rule { margin:0 0 16px; padding:14px 15px; border-left:5px solid #2b7a5a; border-radius:0 12px 12px 0; background:#edf7f2; }
      .normative-consolidation-rule strong { display:block; color:var(--transsa-navy); font-size:.8rem; }
      .normative-consolidation-rule p { margin:5px 0 0; color:#315c4d; font-size:.72rem; line-height:1.5; }
      .normative-framework-group + .normative-framework-group { margin-top:16px; padding-top:16px; border-top:1px solid var(--line); }
      .normative-framework-group h5 { margin:0 0 9px; color:var(--transsa-navy); font-size:.76rem; }
      .normative-framework-group > p { margin:-3px 0 10px; color:var(--muted); font-size:.69rem; line-height:1.45; }
      .normative-role-card.sectional { border-left:4px solid #2c8aa8; background:#f1f8fb; }
      @media(max-width:980px){ .vigencia-workspace{grid-template-columns:1fr;} .vigencia-list-panel{position:static;} }
      @media(max-width:560px){ .compact-normative-timeline .timeline{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(style);
  }

  function roleForPlan(plan, latestByType) {
    const type = String(plan?.tipo_ipt || "IPT").trim();
    if (type === "PS") return "Integra el consolidado · reemplaza al PRC en su polígono";
    const isLatest = latestByType.get(type) === plan;
    if (!isLatest) return `Versión anterior de ${type} registrada`;
    if (type === "PRC") return "PRC base del consolidado comunal";
    if (["PRI", "PRIN", "PRM", "PRDU"].includes(type)) return "Escala superior · no reemplaza la zonificación del PRC";
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

    const currentPrc = latestByType.get("PRC") || null;
    const sectionals = plans
      .filter(plan => String(plan?.tipo_ipt || "").trim() === "PS")
      .sort((a, b) => planDate(a).localeCompare(planDate(b)));
    const historicPrc = plans
      .filter(plan => String(plan?.tipo_ipt || "").trim() === "PRC" && plan !== currentPrc)
      .sort((a, b) => planDate(b).localeCompare(planDate(a)));
    const contextPlans = plans
      .filter(plan => !["PRC", "PS"].includes(String(plan?.tipo_ipt || "").trim()))
      .sort((a, b) => planDate(b).localeCompare(planDate(a)));

    const card = (plan, cardClass) => {
      const type = String(plan?.tipo_ipt || "IPT").trim();
      return `
        <article class="normative-role-card ${cardClass}">
          <span>${escape(roleForPlan(plan, latestByType))}</span>
          <strong>${escape(plan.nombre || type)}</strong>
          <small>${escape([type, plan.fecha].filter(Boolean).join(" · "))}</small>
        </article>
      `;
    };

    return `
      <section class="normative-framework-section normative-framework-general">
        <h4>Normativa aplicable y versiones</h4>
        <p class="section-helper">Se separa el producto normativo comunal de los instrumentos históricos, superiores o complementarios.</p>
        <div class="normative-consolidation-rule">
          <strong>Consolidado comunal a entregar: PRC + ${sectionals.length} ${sectionals.length === 1 ? "plan seccional" : "planes seccionales"}</strong>
          <p>Dentro de cada polígono seccional prevalecen sus zonas y normas; fuera de esos polígonos continúa aplicando el PRC base. Los seccionales de sectores distintos se superponen al PRC, pero no se reemplazan entre sí.</p>
        </div>
        <div class="normative-framework-group">
          <h5>Consolidado normativo comunal</h5>
          <p>Componentes que deben entregarse juntos, conservando la geometría y trazabilidad de cada instrumento.</p>
          <div class="normative-framework-grid">
            ${currentPrc ? card(currentPrc, "current") : ""}
            ${sectionals.map(plan => card(plan, "sectional")).join("")}
          </div>
        </div>
        ${historicPrc.length ? `
          <div class="normative-framework-group">
            <h5>Versiones históricas del PRC</h5>
            <div class="normative-framework-grid">${historicPrc.map(plan => card(plan, "replaced")).join("")}</div>
          </div>
        ` : ""}
        ${contextPlans.length ? `
          <div class="normative-framework-group">
            <h5>Escalas superiores y otros instrumentos</h5>
            <p>Se consultan como contexto o condicionantes, pero no se fusionan como reemplazos de la zonificación comunal.</p>
            <div class="normative-framework-grid">${contextPlans.map(plan => card(plan, "context")).join("")}</div>
          </div>
        ` : ""}
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
    const comparisonChanges = comparisons.flatMap(comparison =>
      (Array.isArray(comparison?.cambios) ? comparison.cambios : [])
        .map(change => ({ change, comparison }))
    );
    const sectionals = Array.isArray(item?.marco_comunal_consolidado?.seccionales)
      ? item.marco_comunal_consolidado.seccionales
      : (Array.isArray(item?.instrumentos) ? item.instrumentos.filter(plan => plan.tipo_ipt === "PS") : []);
    const detailedSectionalRegisters = new Set(
      comparisons
        .filter(comparison => String(comparison?.tipo_ipt || "") === "PS" && Array.isArray(comparison?.cambios) && comparison.cambios.length)
        .map(comparison => Number(comparison?.instrumento_nuevo?.registro))
        .filter(Number.isFinite)
    );
    const sectionalChanges = sectionals.flatMap(plan => {
      if (detailedSectionalRegisters.has(Number(plan.registro))) return [];
      const planChanges = Array.isArray(plan.cambios_normativos) && plan.cambios_normativos.length
        ? plan.cambios_normativos
        : [{
            tipo_cambio: "sustitucion_normativa_sectorial",
            materia: plan.nombre || "Plan seccional",
            zonas: [],
            etiqueta_antes: "PRC base",
            etiqueta_despues: validDate(plan.fecha) ? `PS ${plan.fecha.slice(0, 4)}` : "Plan seccional",
            antes: "Normativa del PRC base aplicable al sector. Falta identificar los códigos y parámetros específicos reemplazados.",
            despues: "Las zonas y normas del plan seccional prevalecen dentro de su polígono. Falta transcribir y comparar los parámetros del expediente oficial.",
            impacto: "Sustituye la normativa del PRC dentro del ámbito del plan seccional.",
            estado_revision: "pendiente_documental",
            estado_sig: "pendiente_revision",
            evidencia: plan.registro ? `Registro Portal IPT ${plan.registro}` : "Registro del plan seccional",
            fuente: plan.fuente || "https://portalipt.minvu.cl/instrumentos"
          }];
      return planChanges.map(change => ({
        change: {
          ...change,
          origen_cambio: "plan_seccional",
          materia: change.materia || plan.nombre || "Plan seccional",
          etiqueta_antes: change.etiqueta_antes || "PRC base",
          etiqueta_despues: change.etiqueta_despues || (validDate(plan.fecha) ? `PS ${plan.fecha.slice(0, 4)}` : "Plan seccional"),
          evidencia: change.evidencia || [plan.registro ? `Registro Portal IPT ${plan.registro}` : "Registro del plan seccional", plan.fecha].filter(Boolean).join(" · "),
          fuente: change.fuente || plan.fuente || "https://portalipt.minvu.cl/instrumentos"
        },
        comparison: {
          instrumento_anterior: item?.marco_comunal_consolidado?.prc_base || {},
          instrumento_nuevo: plan,
          tipo_ipt: "PS"
        }
      }));
    });
    const changes = [...comparisonChanges, ...sectionalChanges];

    if (!changes.length) {
      const hasTransition = comparisons.length > 0;
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
            <span class="detailed-comparison-status">${hasTransition ? "Comparación pendiente" : "Sin transición comparable"}</span>
          </div>
          <div class="normative-change-empty">
            <strong>${hasTransition ? "Aún no hay cambios específicos validados para esta transición." : "No se detectaron dos versiones comparables del mismo instrumento."}</strong>
            <p>${hasTransition ? "La plataforma no declarará una zona como creada, eliminada, absorbida o subdividida —ni informará variaciones de densidad, altura u otros parámetros— hasta contrastar las ordenanzas y los planos oficiales." : "Sin una versión anterior y una nueva del mismo IPT no corresponde inferir creación, eliminación o cambio de parámetros. Los actos posteriores siguen visibles y trazables en la línea de tiempo."}</p>
            ${topics.length ? `<div class="normative-change-pending-list">${topics.map(topic => `<span>${escape(topic)}</span>`).join("")}</div>` : ""}
          </div>
        </section>
      `;
    }

    const documentedChanges = changes.filter(({ change }) => change.estado_revision !== "pendiente_documental").length;
    const pendingSectionals = changes.filter(({ change }) => change.origen_cambio === "plan_seccional" && change.estado_revision === "pendiente_documental").length;
    const statusText = pendingSectionals
      ? `${changes.length} cambios · ${pendingSectionals} ${pendingSectionals === 1 ? "seccional por detallar" : "seccionales por detallar"}`
      : `${documentedChanges || changes.length} ${changes.length === 1 ? "cambio documentado" : "cambios documentados"}`;

    return `
      <section class="detailed-comparison-section normative-change-detail-section">
        <div class="detailed-comparison-heading">
          <div>
            <h4>Detalle de cambios normativos</h4>
            <p>Zonas creadas, eliminadas, absorbidas, subdivididas o recodificadas, junto con sus cambios completos de norma.</p>
          </div>
          <span class="detailed-comparison-status">${statusText}</span>
        </div>
        <div class="detailed-change-list">
          ${changes.map(({ change, comparison }) => {
            const previousYear = change.etiqueta_antes || comparisonYear(comparison, "instrumento_anterior", "Antes");
            const currentYear = change.etiqueta_despues || comparisonYear(comparison, "instrumento_nuevo", "Después");
            return `
              <article class="detailed-change-card">
                <div class="detailed-change-title">
                  <span class="change-type-pill">${escape(changeTypeLabel(change.tipo_cambio))}</span>
                  <strong>${escape(change.materia || "Cambio normativo")}</strong>
                </div>
                ${Array.isArray(change.zonas) && change.zonas.length
                  ? `<div class="detailed-change-zones">${change.zonas.map(zone => `<span>${escape(zone)}</span>`).join("")}</div>`
                  : change.origen_cambio === "plan_seccional" ? `<div class="detailed-change-zones"><span>Ámbito del seccional · zonas por identificar</span></div>` : ""}
                <div class="before-after-grid">
                  <div class="before-after-box"><span>${escape(previousYear)}</span><p>${escape(change.antes || "Sin antecedente documentado.")}</p></div>
                  <div class="before-after-box"><span>${escape(currentYear)}</span><p>${escape(change.despues || "Sin resultado documentado.")}</p></div>
                </div>
                ${change.impacto ? `<p class="detailed-impact"><strong>Impacto urbano:</strong> ${escape(change.impacto)}</p>` : ""}
                <details class="change-support-details">
                  <summary>Evidencia y estado de revisión</summary>
                  <div class="change-support-body">
                    ${change.estado_revision === "pendiente_documental" ? `<span class="change-sig-pill pendiente_revision">detalle normativo pendiente</span>` : ""}
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
