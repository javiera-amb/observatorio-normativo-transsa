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
      .audit-blockers-section,.normative-framework-section,.sig-work-section,.validation-flow-section{margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff}
      .audit-blockers-section h4,.normative-framework-section h4,.sig-work-section h4,.validation-flow-section h4{margin:0;color:var(--transsa-navy)}
      .section-helper{margin:5px 0 14px;color:var(--muted);font-size:.76rem;line-height:1.5}
      .audit-blockers-section{border-color:#e8c0c4;background:#fffdfd}
      .audit-alert-heading{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:15px;border-left:5px solid #b94652;border-radius:0 12px 12px 0;background:#fff0f1}
      .audit-alert-heading h4{color:#7e1f2a;font-size:1rem}
      .audit-alert-heading p{margin:5px 0 0;color:#70343b;font-size:.76rem;line-height:1.5}
      .audit-alert-badge{padding:7px 10px;border-radius:999px;background:#b94652;color:#fff;font-size:.65rem;font-weight:800;white-space:nowrap}
      .audit-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}
      .audit-status-card{padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff}
      .audit-status-card span,.audit-status-card strong{display:block}
      .audit-status-card span{font-size:.58rem;color:var(--muted);text-transform:uppercase}
      .audit-status-card strong{margin-top:4px;color:var(--transsa-navy);font-size:.73rem}
      .audit-status-card.completo{border-left:4px solid #2b7a5a}
      .audit-status-card.en_progreso{border-left:4px solid #d7951f}
      .audit-status-card.bloqueado{border-left:4px solid #b94652}
      .audit-method{margin:0 0 14px;border:1px solid var(--line);border-radius:11px;background:#fff}
      .audit-method summary{padding:11px 13px;cursor:pointer;color:var(--transsa-blue);font-size:.7rem;font-weight:800;list-style:none}
      .audit-method summary::-webkit-details-marker{display:none}
      .audit-method ol{margin:0;padding:0 28px 13px 34px;color:#424a59;font-size:.7rem;line-height:1.5}
      .audit-method li+li{margin-top:6px}
      .audit-control-list{display:grid;gap:10px}
      .audit-control-card{padding:14px;border:1px solid var(--line);border-left:5px solid #d7951f;border-radius:12px;background:#fff}
      .audit-control-card.critica{border-left-color:#b94652}
      .audit-control-card.alta{border-left-color:#d7951f}
      .audit-control-card.media{border-left-color:#2c8aa8}
      .audit-control-card.informativa{border-left-color:#2b7a5a;background:#f5fbf8}
      .audit-control-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
      .audit-control-id{display:inline-flex;margin-right:7px;padding:4px 7px;border-radius:7px;background:var(--transsa-navy);color:#fff;font-size:.6rem;font-weight:800}
      .audit-control-priority{color:var(--muted);font-size:.62rem;font-weight:700;text-transform:uppercase}
      .audit-control-badges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}
      .audit-control-state{padding:5px 8px;border-radius:999px;background:#fff3cf;color:#735110;font-size:.6rem;font-weight:800;white-space:nowrap}
      .audit-control-state.verificado{background:#e4f5ec;color:#176342}
      .audit-control-assignee{padding:5px 8px;border-radius:999px;background:#edf0f4;color:#56616f;font-size:.6rem;font-weight:700;white-space:nowrap}
      .audit-control-card h5{margin:9px 0 6px;color:var(--transsa-navy);font-size:.86rem}
      .audit-control-finding{margin:0;color:#303747;font-size:.73rem;line-height:1.5}
      .audit-control-detail{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      .audit-control-detail div{padding:10px;border-radius:9px;background:var(--surface-soft);border:1px solid var(--line)}
      .audit-control-detail span{display:block;margin-bottom:4px;color:var(--muted);font-size:.57rem;font-weight:700;text-transform:uppercase}
      .audit-control-detail p{margin:0;color:#424a59;font-size:.68rem;line-height:1.45}
      .audit-evidence-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
      .audit-evidence-links a{padding:6px 8px;border:1px solid #cfd3ff;border-radius:8px;background:#f5f5ff;color:var(--transsa-blue);font-size:.63rem;font-weight:700;text-decoration:none}
      .audit-evidence-links a:hover{text-decoration:underline}
      .normative-framework-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .normative-role-card{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-soft)}
      .normative-role-card.current{border-left:4px solid #2b7a5a;background:#edf7f2}
      .normative-role-card.sectional{border-left:4px solid #2c8aa8;background:#f1f8fb}
      .normative-role-card.replaced{border-left:4px solid #9293a1}
      .normative-role-card.context{border-left:4px solid var(--transsa-blue)}
      .normative-role-card span,.normative-role-card strong,.normative-role-card small{display:block}
      .normative-role-card span{color:var(--muted);font-size:.62rem;text-transform:uppercase;letter-spacing:.04em}
      .normative-role-card strong{margin-top:5px;color:var(--transsa-navy);font-size:.82rem;line-height:1.4}
      .normative-role-card small{margin-top:5px;color:var(--muted);font-size:.68rem;line-height:1.4}
      .normative-consolidation-rule{margin:0 0 14px;padding:13px 14px;border-left:5px solid #2b7a5a;border-radius:0 11px 11px 0;background:#edf7f2}
      .normative-consolidation-rule strong{display:block;color:var(--transsa-navy);font-size:.78rem}
      .normative-consolidation-rule p{margin:5px 0 0;color:#315c4d;font-size:.7rem;line-height:1.5}
      .normative-framework-group+.normative-framework-group{margin-top:15px;padding-top:15px;border-top:1px solid var(--line)}
      .normative-framework-group h5{margin:0 0 9px;color:var(--transsa-navy);font-size:.75rem}
      .sig-diagnosis{margin-bottom:14px;padding:14px;border-left:4px solid #d7951f;border-radius:0 11px 11px 0;background:#fff7e8}
      .sig-diagnosis strong{display:block;color:#72531b;font-size:.8rem}
      .sig-diagnosis p{margin:5px 0 0;color:#6a5125;font-size:.72rem;line-height:1.5}
      .sig-action-list{display:grid;grid-template-columns:1fr;gap:10px}
      .sig-action-card{padding:15px;border:1px solid var(--line);border-left:4px solid var(--transsa-blue);border-radius:13px;background:#fff}
      .sig-action-card.definida,.sig-action-card.definida_parcial,.sig-action-card.verificada{border-left-color:#2b7a5a}
      .sig-action-card.bloqueada_por_planos,.sig-action-card.bloqueada_por_diferencia{border-left-color:#c75b64}
      .sig-action-card.pendiente_revision,.sig-action-card.en_revision{border-left-color:#d7951f}
      .sig-action-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .sig-action-identity{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
      .sig-action-code{display:inline-flex;margin-right:7px;padding:4px 7px;border-radius:7px;background:var(--transsa-navy);color:#fff;font-size:.62rem;font-weight:700}
      .sig-action-type{color:var(--transsa-blue);font-size:.66rem;font-weight:700}
      .sig-action-step{color:var(--muted);font-size:.61rem;font-weight:700}
      .sig-action-status{padding:5px 8px;border-radius:999px;font-size:.62rem;font-weight:700;white-space:nowrap}
      .sig-action-status.definida,.sig-action-status.definida_parcial{color:#176342;background:#e4f5ec}
      .sig-action-status.verificada{color:#176342;background:#e4f5ec}
      .sig-action-status.bloqueada_por_planos,.sig-action-status.bloqueada_por_diferencia{color:#922f38;background:#fde8ea}
      .sig-action-status.pendiente_revision,.sig-action-status.en_revision{color:#735110;background:#fff3cf}
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
      .sig-action-sources{margin-top:10px;padding-top:9px;border-top:1px solid var(--line)}
      .sig-action-sources strong{display:block;color:var(--transsa-navy);font-size:.66rem}
      .sig-action-sources div{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
      .sig-action-sources a{padding:6px 8px;border:1px solid #cfd3ff;border-radius:8px;background:#f5f5ff;color:var(--transsa-blue);font-size:.62rem;font-weight:700;text-decoration:none}
      .sig-action-sources a:hover{text-decoration:underline}
      .sig-task-control{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:11px;padding-top:10px;border-top:1px solid var(--line)}
      .sig-task-control span{color:var(--muted);font-size:.63rem;line-height:1.4}
      .sig-task-control button{padding:7px 9px;border:1px solid #cfd3ff;border-radius:8px;background:#f5f5ff;color:var(--transsa-blue);font:inherit;font-size:.62rem;font-weight:750;cursor:pointer}
      .sig-task-control.realizada{padding:9px;border:1px solid #cfe8d9;border-radius:9px;background:#f1faf5}
      .sig-task-control.realizada span{color:#176342;font-weight:700}
      .validation-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:7px}
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
        .audit-alert-heading{display:block}
        .audit-alert-badge{display:inline-flex;margin-top:9px}
        .audit-status-grid{grid-template-columns:1fr 1fr}
        .audit-control-detail{grid-template-columns:1fr}
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
    VALIDAR_FUENTE_VECTORIAL: "Validar fuente vectorial",
    CREAR_CORRESPONDENCIA: "Crear correspondencia",
    AGREGAR_Y_RECODIFICAR_POLIGONOS: "Agregar y recodificar",
    CONTROLAR_CODIGO_FALTANTE: "Resolver diferencia de catálogo",
    AGREGAR_POLIGONOS: "Agregar polígonos",
    CORREGIR_QA_GEOMETRICA: "Corregir QA geométrica",
    ACTUALIZAR_ATRIBUTOS: "Actualizar atributos",
    RESOLVER_ZONAS_NO_REPRODUCIDAS: "Resolver zonas",
    VERIFICAR_E_INTEGRAR_ENMIENDA: "Verificar e integrar",
    DOCUMENTAR_ENMIENDA_INCORPORADA: "Documentar incorporación",
    AGREGAR_CAPAS_SUPLEMENTARIAS: "Agregar capas suplementarias"
  }[value] || typeLabel(value));

  const statusLabel = value => ({
    definida: "Acción definida",
    definida_parcial: "Definición parcial",
    bloqueada_por_planos: "Requiere planos",
    bloqueada_por_diferencia: "Diferencia bloqueante",
    en_revision: "En revisión",
    verificada: "Verificada",
    pendiente_revision: "Pendiente de revisión"
  }[value] || typeLabel(value));

  const taskStorageKey = "tui-seguimiento-borradores-v1";
  const coquimboTaskKey = "Coquimbo|Coquimbo";
  function taskChanges() {
    try {
      const parsed = JSON.parse(window.localStorage?.getItem(taskStorageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  function taskRecord(id) {
    return taskChanges()?.[coquimboTaskKey]?.tareas_completadas?.[id] || null;
  }
  function setTaskRecord(id, completed) {
    const changes = taskChanges();
    const row = changes[coquimboTaskKey] || {};
    const tasks = { ...(row.tareas_completadas || {}) };
    if (completed) {
      tasks[id] = {
        estado: "realizada",
        fecha: new Date().toISOString().slice(0, 10),
        usuario: document.getElementById("seguimientoCurrentUser")?.value || "Equipo SIG",
      };
    } else {
      delete tasks[id];
    }
    changes[coquimboTaskKey] = { ...row, tareas_completadas: tasks };
    window.localStorage?.setItem(taskStorageKey, JSON.stringify(changes));
  }

  function auditBlockersTemplate(comparison) {
    const audit = comparison.auditoria_operativa || {};
    const controls = Array.isArray(audit.controles) ? audit.controles : [];
    const statuses = Array.isArray(audit.estados) ? audit.estados : [];
    const method = Array.isArray(audit.metodo) ? audit.metodo : [];
    if (!controls.length) return "";
    const pending = controls.filter(control => control.estado !== "verificado").length;

    return `
      <section class="audit-blockers-section">
        <div class="audit-alert-heading">
          <div>
            <h4>${escape(audit.titulo || "Por qué aún no está validado")}</h4>
            <p>${escape(audit.resumen || "Existen controles pendientes antes de publicar la capa como validada.")}</p>
          </div>
          <span class="audit-alert-badge">${pending} controles pendientes</span>
        </div>
        ${statuses.length ? `
          <div class="audit-status-grid">
            ${statuses.map(status => `
              <div class="audit-status-card ${escape(status.estado || "pendiente")}">
                <span>${escape(status.nombre)}</span>
                <strong>${escape(status.valor)}</strong>
              </div>
            `).join("")}
          </div>
        ` : ""}
        ${method.length ? `
          <details class="audit-method" open>
            <summary>Qué se revisó y cómo se obtuvieron estos resultados</summary>
            <ol>${method.map(step => `<li>${escape(step)}</li>`).join("")}</ol>
          </details>
        ` : ""}
        <div class="audit-control-list">
          ${controls.map(control => `
            <article class="audit-control-card ${escape(control.prioridad || "media")}">
              <div class="audit-control-head">
                <div>
                  <span class="audit-control-id">${escape(control.id)}</span>
                  <span class="audit-control-priority">Prioridad ${escape(control.prioridad || "media")}</span>
                </div>
                <div class="audit-control-badges">
                  <span class="audit-control-state ${escape(control.estado || "pendiente")}">${escape(control.estado === "verificado" ? "Verificado" : "Pendiente")}</span>
                  <span class="audit-control-assignee">Responsable: ${escape(control.responsable || "Por asignar")}</span>
                </div>
              </div>
              <h5>${escape(control.titulo)}</h5>
              <p class="audit-control-finding">${escape(control.hallazgo)}</p>
              <div class="audit-control-detail">
                <div>
                  <span>Cómo se identificó</span>
                  <p>${escape(control.como_se_detecto)}</p>
                </div>
                <div>
                  <span>Qué debe hacer el equipo</span>
                  <p>${escape(control.tarea)}</p>
                </div>
              </div>
              ${Array.isArray(control.evidencias) && control.evidencias.length ? `
                <div class="audit-evidence-links">
                  ${control.evidencias.map(evidence => `<a href="${escape(evidence.url)}" target="_blank" rel="noopener noreferrer">${escape(evidence.nombre)} ↗</a>`).join("")}
                </div>
              ` : ""}
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function frameworkTemplate(item, comparison) {
    const previous = comparison.instrumento_anterior || {};
    const current = comparison.instrumento_nuevo || {};
    const otherPlans = (item.instrumentos || []).filter(plan =>
      String(plan.tipo_ipt || "") !== "PRC" &&
      Number(plan.registro) !== Number(previous.registro) &&
      Number(plan.registro) !== Number(current.registro)
    );
    const sectionals = otherPlans.filter(plan => String(plan.tipo_ipt || "") === "PS");
    const contextPlans = otherPlans.filter(plan => String(plan.tipo_ipt || "") !== "PS");
    const roleFor = plan => {
      const type = String(plan.tipo_ipt || "IPT");
      if (type === "PS") return "Integra el consolidado · reemplaza al PRC en su polígono";
      if (["PRI", "PRIN", "PRM", "PRDU"].includes(type)) return "Escala superior · no reemplaza la zonificación del PRC";
      if (type === "LU") return "Límite urbano aplicable";
      return "Instrumento complementario";
    };

    return `
      <section class="normative-framework-section">
        <h4>Normativa aplicable y versiones</h4>
        <p class="section-helper">Se distingue el producto normativo comunal de sus versiones históricas y de las escalas de planificación que solo aportan contexto.</p>
        <div class="normative-consolidation-rule">
          <strong>Consolidado comunal a entregar: PRC vigente + ${sectionals.length} ${sectionals.length === 1 ? "plan seccional" : "planes seccionales"}</strong>
          <p>En cada polígono seccional prevalecen sus zonas y normas sobre las del PRC. PRI, PRIN, PRM y PRDU se mantienen separados y no sustituyen la zonificación comunal.</p>
        </div>
        <div class="normative-framework-group">
          <h5>Consolidado normativo comunal</h5>
          <div class="normative-framework-grid">
            <article class="normative-role-card current">
              <span>PRC base del consolidado comunal</span>
              <strong>${escape(current.nombre || "PRC Coquimbo 2026")}</strong>
              <small>${escape([current.fecha, current.acto].filter(Boolean).join(" · "))}</small>
            </article>
            ${sectionals.map(plan => `
              <article class="normative-role-card sectional">
                <span>${escape(roleFor(plan))}</span>
                <strong>${escape(plan.nombre || plan.tipo_ipt || "IPT")}</strong>
                <small>${escape([plan.tipo_ipt, plan.fecha].filter(Boolean).join(" · "))}</small>
              </article>
            `).join("")}
          </div>
        </div>
        <div class="normative-framework-group">
          <h5>Versión histórica del PRC</h5>
          <div class="normative-framework-grid">
            <article class="normative-role-card replaced">
              <span>Versión reemplazada · histórico</span>
              <strong>${escape(previous.nombre || "PRC Coquimbo 2019")}</strong>
              <small>${escape([previous.fecha, previous.acto].filter(Boolean).join(" · "))}</small>
            </article>
          </div>
        </div>
        ${contextPlans.length ? `
          <div class="normative-framework-group">
            <h5>Escalas superiores y otros instrumentos</h5>
            <div class="normative-framework-grid">
              ${contextPlans.map(plan => `
                <article class="normative-role-card context">
                  <span>${escape(roleFor(plan))}</span>
                  <strong>${escape(plan.nombre || plan.tipo_ipt || "IPT")}</strong>
                  <small>${escape([plan.tipo_ipt, plan.fecha].filter(Boolean).join(" · "))}</small>
                </article>
              `).join("")}
            </div>
          </div>
        ` : ""}
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
    const audit = comparison.auditoria_operativa || {};
    const controls = Array.isArray(audit.controles) ? audit.controles : [];
    const method = Array.isArray(audit.metodo) ? audit.metodo : [];
    if (!actions.length) return "";
    const workflow = ["COQ-SIG-01", "COQ-SIG-04", "COQ-SIG-02", "COQ-SIG-03", "COQ-SIG-06", "COQ-SIG-05", "COQ-SIG-07", "COQ-SIG-08"];
    const orderedActions = actions.slice().sort((a, b) => workflow.indexOf(a.id) - workflow.indexOf(b.id));
    const controlMap = {
      "COQ-SIG-01": ["COQ-VAL-01", "COQ-VAL-02"],
      "COQ-SIG-04": ["COQ-VAL-03"],
      "COQ-SIG-02": ["COQ-VAL-02", "COQ-VAL-04"],
      "COQ-SIG-03": ["COQ-VAL-02"],
      "COQ-SIG-06": ["COQ-VAL-02"],
      "COQ-SIG-05": ["COQ-VAL-05", "COQ-VAL-02"],
      "COQ-SIG-07": ["COQ-VAL-06"],
      "COQ-SIG-08": ["COQ-VAL-03", "COQ-VAL-04"],
    };
    const sourcesFor = action => [...new Map(
      controls
        .filter(control => (controlMap[action.id] || []).includes(control.id))
        .flatMap(control => control.evidencias || [])
        .map(item => [item.url, item])
    ).values()];
    const blocked = orderedActions.filter(action => String(action.estado || "").startsWith("bloqueada")).length;
    const verified = orderedActions.filter(action => action.estado === "verificada").length;
    const completed = orderedActions.filter(action => taskRecord(action.id)?.estado === "realizada" && action.estado !== "verificada").length;

    return `
      <section class="sig-work-section">
        <div class="sig-work-summary">
          <div>
            <h4>Actualizaciones pendientes para validar SIG 2026</h4>
            <p class="section-helper">Cada hallazgo se traduce en una tarea técnica. El equipo marca su ejecución y la plataforma verifica el resultado cuando detecta la nueva entrega.</p>
          </div>
          <div class="sig-work-kpis">
            <span>${orderedActions.length} acciones</span>
            <span>${verified} verificadas</span>
            <span>${completed} realizadas · esperando QA</span>
            <span>${blocked} bloqueantes</span>
          </div>
        </div>
        <div class="sig-diagnosis">
          <strong>Estado actual: actualizaciones pendientes antes de validar SIG 2026</strong>
          <p>${escape(diagnosis.motivo || "La versión cartográfica disponible aún no acredita equivalencia con el instrumento vigente.")}</p>
        </div>
        ${method.length ? `<details class="audit-method"><summary>Criterio general de auditoría</summary><ol>${method.map(step => `<li>${escape(step)}</li>`).join("")}</ol></details>` : ""}
        <div class="sig-action-list">
          ${orderedActions.map((action, index) => {
            const task = taskRecord(action.id);
            const sources = sourcesFor(action);
            const platformVerified = action.estado === "verificada";
            const teamCompleted = task?.estado === "realizada" && !platformVerified;
            const displayStatus = platformVerified ? "verificada" : teamCompleted ? "en_revision" : action.estado;
            const displayLabel = platformVerified ? "Verificada por plataforma" : teamCompleted ? "Realizada · esperando QA" : statusLabel(action.estado);
            return `
            <article class="sig-action-card ${escape(action.estado || "pendiente_revision")}">
              <div class="sig-action-head">
                <div class="sig-action-identity">
                  <span class="sig-action-code">${escape(action.id)}</span>
                  <span class="sig-action-step">Paso ${index + 1} de ${orderedActions.length}</span>
                  <span class="sig-action-type">${escape(actionLabel(action.accion))}</span>
                </div>
                <span class="sig-action-status ${escape(displayStatus || "pendiente_revision")}">${escape(displayLabel)}</span>
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
                ${sources.length ? `<div class="sig-action-sources"><strong>Archivos y fuentes para esta tarea</strong><div>${sources.map(item => `<a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.nombre)} ↗</a>`).join("")}</div></div>` : ""}
              </details>
              ${platformVerified ? `<div class="sig-task-control realizada"><span>QA automático aprobado por la plataforma.</span></div>` : teamCompleted ? `<div class="sig-task-control realizada"><span>Marcada por ${escape(task.usuario || "Equipo SIG")} el ${escape(task.fecha || "sin fecha")}. La próxima sincronización ejecutará el QA.</span><button type="button" data-sig-task="${escape(action.id)}" data-completed="true">Reabrir</button></div>` : `<div class="sig-task-control"><span>Cuando termines esta corrección, márcala para que quede esperando el QA automático.</span><button type="button" data-sig-task="${escape(action.id)}">Marcar realizada</button></div>`}
            </article>
          `;}).join("")}
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
    const controls = comparison.auditoria_operativa?.controles || [];
    const pendingControls = controls.filter(control => control.estado !== "verificado").length;
    item.actos_posteriores_pendientes = pendingControls;
    item.confianza = "documental alta · correspondencia SIG alta · QA pendiente";
    item.resumen_alerta = `El PRC 2026 reemplaza al PRC 2019 y el FeatureServer presenta correspondencia alta. Quedan ${pendingControls} controles técnicos antes de declararlo SIG 2026 validado.`;
    item.alertas = [
      {
        tipo: "Controles bloqueantes identificados",
        nivel: "alto",
        mensaje: `Quedan ${pendingControls} revisiones documentales, de catálogo, atributos o topología. Cada una tiene evidencia y una tarea verificable.`
      },
      {
        tipo: "Fuente vectorial 2026 altamente probable",
        nivel: "medio",
        mensaje: "GeoIDE es la fuente operativa preferida y se descarga directamente; la validación final depende de resolver las brechas publicadas."
      }
    ];
  }

  function refineCoquimboHeader(item, comparison, detail) {
    const pendingControls = (comparison.auditoria_operativa?.controles || [])
      .filter(control => control.estado !== "verificado").length;
    const instrumentName = detail.querySelector(".vigencia-instrument-name");
    if (instrumentName) instrumentName.textContent = "PRC vigente: 2026-01-05 · PRC reemplazado: 2019-07-10";

    const alertBox = detail.querySelector(".vigencia-alert-box");
    if (alertBox) alertBox.innerHTML = "<strong>SIG 2026 aún no validado</strong><span>Fuente vectorial identificada · brechas específicas por resolver</span>";

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
        label.textContent = "Controles pendientes";
        value.textContent = String(pendingControls);
      }
    });
  }

  function comparisonTemplate(comparison, item) {
    const internal = new URLSearchParams(window.location.search).get("vista") === "equipo";
    return `<div class="coquimbo-audit-package">
      ${frameworkTemplate(item, comparison)}
      ${internal ? sigWorkTemplate(comparison) : ""}
      ${!internal ? `<section class="audit-blockers-section"><div class="audit-alert-heading"><div><h4>Actualizaciones pendientes para validar SIG 2026</h4><p>La fuente vectorial fue localizada, pero la plataforma todavía debe cerrar controles documentales, geométricos, normativos y topológicos. La vista interna contiene las tareas técnicas y su trazabilidad.</p></div></div></section>` : ""}
    </div>`;
  }

  function addDetailedComparison() {
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail || detail.querySelector(".coquimbo-audit-package")) return;

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
    // La simplificación visual se aplica posteriormente mediante
    // vigencia-simplificada.js con reglas comunes para todas las comunas.
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderDetailedComparison() {
    originalRenderDetail();
    addDetailedComparison();
  };

  primeCoquimboData();
  injectStyles();
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-sig-task]");
    if (!button) return;
    setTaskRecord(button.dataset.sigTask, button.dataset.completed !== "true");
    renderVigenciaDetail();
  });
  if (typeof renderVigencia === "function") renderVigencia();
})();
