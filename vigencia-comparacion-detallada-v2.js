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
      .normative-framework-section,.sig-work-section,.validation-flow-section{margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff}
      .normative-framework-section h4,.sig-work-section h4,.validation-flow-section h4{margin:0;color:var(--transsa-navy)}
      .section-helper{margin:5px 0 14px;color:var(--muted);font-size:.76rem;line-height:1.5}
      .normative-framework-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .normative-role-card{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-soft)}
      .normative-role-card.current{border-left:4px solid #2b7a5a;background:#edf7f2}
      .normative-role-card.replaced{border-left:4px solid #9293a1}
      .normative-role-card.context{border-left:4px solid var(--transsa-blue)}
      .normative-role-card span,.normative-role-card strong,.normative-role-card small{display:block}
      .normative-role-card span{color:var(--muted);font-size:.62rem;text-transform:uppercase;letter-spacing:.04em}
      .normative-role-card strong{margin-top:5px;color:var(--transsa-navy);font-size:.82rem;line-height:1.4}
      .normative-role-card small{margin-top:5px;color:var(--muted);font-size:.68rem;line-height:1.4}
      .sig-diagnosis{margin-bottom:14px;padding:14px;border-left:4px solid #d7951f;border-radius:0 11px 11px 0;background:#fff7e8}
      .sig-diagnosis strong{display:block;color:#72531b;font-size:.8rem}
      .sig-diagnosis p{margin:5px 0 0;color:#6a5125;font-size:.72rem;line-height:1.5}
      .sig-action-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .sig-action-card{padding:15px;border:1px solid var(--line);border-left:4px solid var(--transsa-blue);border-radius:13px;background:#fff}
      .sig-action-card.definida,.sig-action-card.definida_parcial{border-left-color:#2b7a5a}
      .sig-action-card.bloqueada_por_planos{border-left-color:#c75b64}
      .sig-action-card.pendiente_revision{border-left-color:#d7951f}
      .sig-action-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .sig-action-identity{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
      .sig-action-code{display:inline-flex;margin-right:7px;padding:4px 7px;border-radius:7px;background:var(--transsa-navy);color:#fff;font-size:.62rem;font-weight:700}
      .sig-action-type{color:var(--transsa-blue);font-size:.66rem;font-weight:700}
      .sig-action-status{padding:5px 8px;border-radius:999px;font-size:.62rem;font-weight:700;white-space:nowrap}
      .sig-action-status.definida,.sig-action-status.definida_parcial{color:#176342;background:#e4f5ec}
      .sig-action-status.bloqueada_por_planos{color:#922f38;background:#fde8ea}
      .sig-action-status.pendiente_revision{color:#735110;background:#fff3cf}
      .sig-action-card h5{margin:10px 0 4px;color:var(--transsa-navy);font-size:.86rem}
      .sig-action-instruction{margin:0;color:#424a59;font-size:.74rem;line-height:1.52}
      .sig-action-details{margin-top:11px;border-top:1px solid var(--line)}
      .sig-action-details summary{padding-top:9px;cursor:pointer;color:var(--transsa-blue);font-size:.67rem;font-weight:700;list-style:none}
      .sig-action-details summary::-webkit-details-marker{display:none}
      .sig-action-details summary::after{content:" +"}
      .sig-action-details[open] summary::after{content:" −"}
      .sig-action-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
      .sig-action-meta div{padding:9px;border-radius:9px;background:var(--surface-soft);border:1px solid var(--line)}
      .sig-action-meta span,.sig-action-meta strong{display:block}
      .sig-action-meta span{color:var(--muted);font-size:.58rem;text-transform:uppercase}
      .sig-action-meta strong{margin-top:3px;color:#404858;font-size:.68rem;line-height:1.4}
      .sig-action-result{margin:9px 0 0;padding:9px;border-radius:9px;background:#f5f5ff;color:#303747;font-size:.7rem;line-height:1.45}
      .validation-flow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}
      .validation-step{position:relative;padding:11px 8px;border:1px solid var(--line);border-radius:10px;background:var(--surface-soft);text-align:center}
      .validation-step::before{content:"";display:block;width:9px;height:9px;margin:0 auto 7px;border-radius:50%;background:#b9bbc5}
      .validation-step.completo{background:#edf7f2;color:#176342}
      .validation-step.completo::before{background:#2b7a5a}
      .validation-step.en_progreso{background:#fff7e8;color:#735110}
      .validation-step.en_progreso::before{background:#d7951f}
      .validation-step span{font-size:.61rem;font-weight:700;line-height:1.3}
      .sig-work-summary{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:13px}
      .sig-work-kpis{display:flex;gap:7px;flex-wrap:wrap}
      .sig-work-kpis span{padding:6px 8px;border-radius:8px;background:var(--surface-soft);color:var(--muted);font-size:.65rem;font-weight:600}
      @media(max-width:760px){
        .detailed-comparison-heading{display:block}
        .detailed-comparison-status{display:inline-flex;margin-top:8px}
        .before-after-grid{grid-template-columns:1fr}
        .sig-work-summary{align-items:flex-start;flex-direction:column}
        .sig-action-list{grid-template-columns:1fr}
        .sig-action-meta{grid-template-columns:1fr}
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

  const actionLabel = value => ({
    REEMPLAZAR_GEOMETRIA: "Reemplazar geometría",
    CREAR_CORRESPONDENCIA: "Crear correspondencia",
    AGREGAR_Y_RECODIFICAR_POLIGONOS: "Agregar y recodificar",
    AGREGAR_POLIGONOS: "Agregar polígonos",
    ACTUALIZAR_ATRIBUTOS: "Actualizar atributos",
    RESOLVER_ZONAS_NO_REPRODUCIDAS: "Resolver zonas",
    VERIFICAR_E_INTEGRAR_ENMIENDA: "Verificar e integrar",
    AGREGAR_CAPAS_SUPLEMENTARIAS: "Agregar capas suplementarias"
  }[value] || typeLabel(value));

  const statusLabel = value => ({
    definida: "Acción definida",
    definida_parcial: "Definición parcial",
    bloqueada_por_planos: "Requiere planos",
    pendiente_revision: "Pendiente de revisión"
  }[value] || typeLabel(value));

  function frameworkTemplate(item, comparison) {
    const previous = comparison.instrumento_anterior || {};
    const current = comparison.instrumento_nuevo || {};
    const otherPlans = (item.instrumentos || []).filter(plan =>
      String(plan.tipo_ipt || "") !== "PRC" &&
      Number(plan.registro) !== Number(previous.registro) &&
      Number(plan.registro) !== Number(current.registro)
    );
    const roleFor = plan => {
      const type = String(plan.tipo_ipt || "IPT");
      if (type === "PS") return "Plan seccional independiente · reemplaza normativa solo en su ámbito";
      if (type === "PRI" || type === "PRM" || type === "PRDU") return "Normativa superior o intercomunal aplicable";
      if (type === "LU") return "Límite urbano aplicable";
      return "Instrumento complementario";
    };

    return `
      <section class="normative-framework-section">
        <h4>Normativa aplicable y versiones</h4>
        <p class="section-helper">Se distingue el instrumento base vigente, la versión reemplazada y la normativa que sigue aplicando simultáneamente.</p>
        <div class="normative-framework-grid">
          <article class="normative-role-card current">
            <span>PRC base vigente</span>
            <strong>${escape(current.nombre || "PRC Coquimbo 2026")}</strong>
            <small>${escape([current.fecha, current.acto].filter(Boolean).join(" · "))}</small>
          </article>
          <article class="normative-role-card replaced">
            <span>Versión reemplazada · histórico</span>
            <strong>${escape(previous.nombre || "PRC Coquimbo 2019")}</strong>
            <small>${escape([previous.fecha, previous.acto].filter(Boolean).join(" · "))}</small>
          </article>
          ${otherPlans.map(plan => `
            <article class="normative-role-card context">
              <span>${escape(roleFor(plan))}</span>
              <strong>${escape(plan.nombre || plan.tipo_ipt || "IPT")}</strong>
              <small>${escape([plan.tipo_ipt, plan.fecha].filter(Boolean).join(" · "))}</small>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function validationTemplate(comparison) {
    const steps = Array.isArray(comparison.flujo_validacion) ? comparison.flujo_validacion : [];
    if (!steps.length) return "";
    return `
      <section class="validation-flow-section">
        <h4>Avance de la actualización SIG</h4>
        <p class="section-helper">El estado final depende de completar toda la cadena, no solo de encontrar el acto normativo.</p>
        <div class="validation-flow">
          ${steps.map(step => `
            <div class="validation-step ${escape(step.estado || "pendiente")}">
              <span>${escape(step.nombre)}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function sigWorkTemplate(comparison) {
    const actions = Array.isArray(comparison.acciones_sig) ? comparison.acciones_sig : [];
    const diagnosis = comparison.diagnostico_sig || {};
    if (!actions.length) return "";
    const blocked = actions.filter(action => action.estado === "bloqueada_por_planos").length;
    const defined = actions.filter(action => String(action.estado || "").startsWith("definida")).length;

    return `
      <section class="sig-work-section">
        <div class="sig-work-summary">
          <div>
            <h4>Qué hay que hacer en el SIG</h4>
            <p class="section-helper">Cada cambio normativo se traduce en una tarea técnica verificable.</p>
          </div>
          <div class="sig-work-kpis">
            <span>${actions.length} acciones</span>
            <span>${defined} definidas</span>
            <span>${blocked} requieren planos</span>
          </div>
        </div>
        <div class="sig-diagnosis">
          <strong>Diagnóstico actual: no publicar todavía como SIG 2026 validado</strong>
          <p>${escape(diagnosis.motivo || "La versión cartográfica disponible aún no acredita equivalencia con el instrumento vigente.")}</p>
        </div>
        <div class="sig-action-list">
          ${actions.map(action => `
            <article class="sig-action-card ${escape(action.estado || "pendiente_revision")}">
              <div class="sig-action-head">
                <div class="sig-action-identity">
                  <span class="sig-action-code">${escape(action.id)}</span>
                  <span class="sig-action-type">${escape(actionLabel(action.accion))}</span>
                </div>
                <span class="sig-action-status ${escape(action.estado || "pendiente_revision")}">${escape(statusLabel(action.estado))}</span>
              </div>
              <h5>${escape(action.objeto)}</h5>
              <p class="sig-action-instruction">${escape(action.instruccion)}</p>
              <details class="sig-action-details">
                <summary>Ver trazabilidad técnica</summary>
                <div class="sig-action-meta">
                  <div><span>Capa objetivo</span><strong>${escape(action.capa_objetivo)}</strong></div>
                  <div><span>Ámbito</span><strong>${escape(action.ambito)}</strong></div>
                  <div><span>Dependencia</span><strong>${escape(action.dependencia)}</strong></div>
                  <div><span>Prioridad</span><strong>${escape(action.prioridad)}</strong></div>
                </div>
                <p class="sig-action-result"><strong>Resultado esperado:</strong> ${escape(action.resultado_esperado)}</p>
              </details>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function primeCoquimboData() {
    const item = vigenciaInstruments().find(instrument =>
      (instrument.comparaciones_versiones || []).some(candidate => candidate.id === "coquimbo-prc-2019-2026")
    );
    if (!item) return;
    const comparison = item.comparaciones_versiones.find(candidate => candidate.id === "coquimbo-prc-2019-2026");
    const actions = comparison?.acciones_sig || [];
    if (!actions.length) return;

    item.nombre = "PRC 2026 y normativa aplicable";
    item.actos_posteriores_pendientes = actions.length;
    item.confianza = "documental media · SIG baja";
    item.resumen_alerta = `El PRC 2026 reemplaza al PRC 2019. Se identificaron ${comparison.cambios?.length || 0} cambios normativos y ${actions.length} acciones SIG; la geometría aún debe validarse contra las láminas oficiales.`;
    item.alertas = [
      {
        tipo: "Plan de acción SIG definido",
        nivel: "medio",
        mensaje: `Se definieron ${actions.length} tareas técnicas. Las que modifican geometría permanecen bloqueadas hasta comparar y vectorizar los planos oficiales.`
      },
      {
        tipo: "Versión GeoIDE no acreditada",
        nivel: "alto",
        mensaje: "La capa disponible no debe declararse equivalente al PRC 2026 hasta validar zonificación, códigos y parámetros."
      }
    ];
  }

  function refineCoquimboHeader(item, comparison, detail) {
    const actions = comparison.acciones_sig || [];
    const instrumentName = detail.querySelector(".vigencia-instrument-name");
    if (instrumentName) instrumentName.textContent = "PRC vigente: 2026-01-05 · PRC reemplazado: 2019-07-10";

    const alertBox = detail.querySelector(".vigencia-alert-box");
    if (alertBox) alertBox.innerHTML = "<strong>Revisión necesaria</strong><span>Plan de acción SIG definido · ejecución pendiente</span>";

    detail.querySelectorAll(".detail-item").forEach(card => {
      const label = card.querySelector("span");
      const value = card.querySelector("strong");
      if (!label || !value) return;
      if (label.textContent.trim() === "Instrumento base") {
        label.textContent = "PRC vigente";
        value.textContent = comparison.instrumento_nuevo?.fecha || "2026-01-05";
      } else if (label.textContent.trim() === "Versión cartográfica") {
        label.textContent = "SIG actualmente asociado";
        value.textContent = comparison.diagnostico_sig?.capa_actual || "Versión no acreditada";
      } else if (label.textContent.trim() === "Actos pendientes") {
        label.textContent = "Acciones SIG identificadas";
        value.textContent = String(actions.length);
      }
    });
  }

  function comparisonTemplate(comparison, item) {
    const changes = Array.isArray(comparison.cambios) ? comparison.cambios : [];

    return `
      ${frameworkTemplate(item, comparison)}
      ${validationTemplate(comparison)}
      ${sigWorkTemplate(comparison)}
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

    refineCoquimboHeader(item, comparison, detail);

    const planSection = detail.querySelector(".commune-plan-section");
    const supportingSection = detail.querySelector(".supporting-records-section, .commune-change-section");
    const mapSection = detail.querySelector(".vigencia-map-section");

    if (supportingSection) {
      supportingSection.insertAdjacentHTML("beforebegin", comparisonTemplate(comparison, item));
    } else if (planSection) {
      planSection.insertAdjacentHTML("afterend", comparisonTemplate(comparison, item));
    } else if (mapSection) {
      mapSection.insertAdjacentHTML("beforebegin", comparisonTemplate(comparison, item));
    } else {
      detail.insertAdjacentHTML("beforeend", comparisonTemplate(comparison, item));
    }
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderDetailedComparison() {
    originalRenderDetail();
    addDetailedComparison();
  };

  primeCoquimboData();
  injectStyles();
  if (typeof renderVigencia === "function") renderVigencia();
})();
