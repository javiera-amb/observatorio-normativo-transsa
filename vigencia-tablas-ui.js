(() => {
  "use strict";

  const norm = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const ACTION_LABELS = {
    CERTIFICADA: "Certificada",
    VERIFICAR_INSTRUMENTO_BASE: "Verificar instrumento base",
    OBTENER_TABLA_BASE: "Obtener tabla base",
    COMPLETAR_CATALOGO_OFICIAL: "Completar catálogo oficial",
    CONCILIAR_ACTOS_RECIENTES: "Conciliar actos recientes",
    APLICAR_ACTOS_TABLA_SIG: "Aplicar actos en tabla + SIG",
    AUDITAR_Y_CERTIFICAR_V5: "Auditar y certificar V5"
  };

  function registry() {
    return Array.isArray(window.VIGENCIA_TABLAS_NORMATIVAS?.comunas)
      ? window.VIGENCIA_TABLAS_NORMATIVAS.comunas : [];
  }

  function queueRegistry() {
    return Array.isArray(window.COLA_TABLAS_NORMATIVAS?.comunas)
      ? window.COLA_TABLAS_NORMATIVAS.comunas : [];
  }

  function certification(comuna) {
    return registry().find(item => norm(item.comuna) === norm(comuna)) || null;
  }

  function queueItem(comuna) {
    return queueRegistry().find(item => norm(item.comuna) === norm(comuna)) || null;
  }

  function stateLabel(item) {
    if (!item) return "REVISAR · SIN CERTIFICACIÓN";
    return item.vigencia_certificada ? "VIGENTE · SINCRONIZADA" :
      String(item.estado_vigencia || "REVISAR").replaceAll("_", " ");
  }

  function actionLabel(item) {
    const action = String(item?.accion_prioritaria || "").trim();
    return ACTION_LABELS[action] || action.replaceAll("_", " ") || "Sin acción calculada";
  }

  function pill(item) {
    const ok = Boolean(item?.vigencia_certificada);
    const background = ok ? "#edf7f2" : "#fff0f0";
    const color = ok ? "#2b7a5a" : "#a02f2f";
    return `<span class="tn-pill" style="background:${background};color:${color};font-weight:700">${esc(stateLabel(item))}</span>`;
  }

  function patchNationalSummary() {
    const module = document.querySelector("#module-tablas-normativas");
    if (!module) return;
    const queue = window.COLA_TABLAS_NORMATIVAS;
    if (!queue || Number(queue.total_comunas || 0) !== 346) return;

    let panel = module.querySelector("[data-cola-nacional]");
    if (!panel) {
      panel = document.createElement("section");
      panel.dataset.colaNacional = "1";
      panel.style.cssText = "margin:14px 0 18px;padding:16px;border:1px solid var(--line);border-radius:16px;background:#fff";
      const banner = module.querySelector(".tn-banner");
      if (banner) banner.insertAdjacentElement("afterend", panel);
      else module.prepend(panel);
    }

    const actions = queue.acciones || {};
    const coverage = Number(queue.cobertura_plataforma || queue.total_comunas || 0);
    const coverageTarget = Number(queue.cobertura_plataforma_objetivo || 346);
    const certified = Number(queue.certificadas || 0);
    const excluded = Array.isArray(queue.instrumentos_excluidos_completitud)
      ? queue.instrumentos_excluidos_completitud.join("/") : "PRI/PRM";
    const actionRows = Object.entries(actions)
      .filter(([, count]) => Number(count || 0) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([action, count]) => `<span class="tn-pill" style="background:#f5f7fa;color:#4c5968">${esc(actionLabel({ accion_prioritaria: action }))}: <strong>${Number(count)}</strong></span>`)
      .join(" ");

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <strong>Cobertura operativa nacional</strong>
          <div class="tn-subtle">La TUI incorpora las 346 comunas para PRC + normativa comunal. La certificación normativa es un control independiente y sólo aumenta con evidencia validada.</div>
        </div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end">
          <span class="tn-pill" style="background:${coverage === coverageTarget ? "#edf7f2" : "#fff0f0"};color:${coverage === coverageTarget ? "#2b7a5a" : "#a02f2f"};font-weight:700">${coverage}/${coverageTarget} en plataforma</span>
          <span class="tn-pill" style="background:${Number(queue.bloqueadas || 0) ? "#fff0f0" : "#edf7f2"};color:${Number(queue.bloqueadas || 0) ? "#a02f2f" : "#2b7a5a"};font-weight:700">${certified}/${Number(queue.total_comunas || 0)} certificadas</span>
        </div>
      </div>
      <div style="margin-top:10px;padding:9px 11px;border-radius:10px;background:#f7f8fa;font-size:12px;color:#596575"><strong>Alcance del 100% TUI:</strong> PRC + normativa comunal. <strong>${esc(excluded)}</strong> quedan fuera de este indicador por ahora.</div>
      <div class="tn-summary-grid" style="margin-top:12px;margin-bottom:10px">
        <div><span>Comunas en plataforma</span><strong>${coverage}</strong></div>
        <div><span>Con tabla base</span><strong>${Number(queue.con_tabla_base || 0)}</strong></div>
        <div><span>Sin tabla base</span><strong>${Number(queue.sin_tabla_base || 0)}</strong></div>
        <div><span>Pendientes de certificar</span><strong>${Number(queue.bloqueadas || 0)}</strong></div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">${actionRows}</div>`;
  }

  function patchRows() {
    document.querySelectorAll("#tnTableBody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;
      const comuna = cells[0].querySelector("strong")?.textContent?.trim() || "";
      if (!comuna) return;
      const item = certification(comuna);
      const queue = queueItem(comuna);
      const expected = Number(item?.actos_seguimiento || 0);
      const applied = Number(item?.actos_aplicados || 0);
      const candidates = Number(item?.candidatos_pendientes || 0);

      cells[2].innerHTML = `${pill(item)}<div class="tn-subtle" style="margin-top:5px">Actos aplicados: <strong>${applied}/${expected}</strong>${candidates ? ` · ${candidates} antecedente(s) nuevo(s) por conciliar` : ""}</div>`;
      cells[5].innerHTML = `${pill(item)}${queue ? `<div class="tn-subtle" style="margin-top:5px"><strong>Siguiente:</strong> ${esc(actionLabel(queue))}</div>` : ""}`;
      row.dataset.vigenciaGlobal = item?.vigencia_certificada ? "certificada" : "bloqueada";
      row.dataset.accionPrioritaria = String(queue?.accion_prioritaria || "");
    });
  }

  function actList(item) {
    const acts = Array.isArray(item?.actos_posteriores_detalle) ? item.actos_posteriores_detalle : [];
    if (!acts.length) return '<div class="tn-subtle">Sin actos posteriores registrados para esta versión.</div>';
    return `<details style="margin-top:12px"><summary><strong>Ver ${acts.length} actos posteriores considerados</strong></summary><div style="display:grid;gap:7px;margin-top:9px">${acts.map(act => `
      <div style="padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#fff">
        <strong>${esc(act.fecha || "Sin fecha")} · ${esc(act.tipo_acto || "Acto")}</strong>
        <div class="tn-subtle">${esc(act.titulo || "")}</div>
        <div class="tn-subtle">${esc(act.origen || "")}${act.verificado_fuente ? " · fuente identificada" : " · pendiente de verificación"}</div>
      </div>`).join("")}</div></details>`;
  }

  function patchDetail() {
    const detail = document.querySelector("#module-tablas-normativas #tnDetail");
    if (!detail || detail.hidden) return;
    const comuna = detail.querySelector(".tn-detail-head h3")?.textContent?.trim() || "";
    if (!comuna) return;
    const item = certification(comuna);
    const queue = queueItem(comuna);
    const existing = detail.querySelector("[data-vigencia-certificacion]");
    existing?.remove();

    const expected = Number(item?.actos_seguimiento || 0);
    const applied = Number(item?.actos_aplicados || 0);
    const candidates = Number(item?.candidatos_pendientes || 0);
    const blockers = Array.isArray(item?.bloqueantes_vigencia) ? item.bloqueantes_vigencia : ["No existe certificación normativa publicada."];
    const box = document.createElement("section");
    box.dataset.vigenciaCertificacion = "1";
    box.style.cssText = `margin:14px 0;padding:15px;border-radius:14px;border:1px solid ${item?.vigencia_certificada ? "#b9dfcf" : "#efc6c6"};background:${item?.vigencia_certificada ? "#f3fbf7" : "#fff7f7"}`;
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <div><strong>Certificación de vigencia normativa</strong><div class="tn-subtle">Esta condición domina sobre “tabla generada/corregida/lista para staging”.</div></div>${pill(item)}
      </div>
      <div class="tn-summary-grid" style="margin-bottom:8px">
        <div><span>Actos exigidos</span><strong>${expected}</strong></div>
        <div><span>Actos aplicados</span><strong>${applied}</strong></div>
        <div><span>Candidatos recientes</span><strong>${candidates}</strong></div>
        <div><span>Último acto</span><strong>${esc(item?.ultimo_acto_posterior || "—")}</strong></div>
      </div>
      <div class="tn-subtle"><strong>Versión normativa:</strong> ${esc(item?.version_normativa_id || "sin versión certificada")}</div>
      ${queue ? `<div style="margin-top:10px;padding:10px;border-radius:10px;background:#fff"><strong>Acción prioritaria:</strong> ${esc(actionLabel(queue))}<div class="tn-subtle" style="margin-top:4px">${esc(queue.motivo_accion || "")}</div><div class="tn-subtle">Tabla base: ${queue.tiene_tabla_base ? "sí" : "no"} · cobertura oficial: ${esc(queue.cobertura_fuentes || "PENDIENTE")}</div></div>` : ""}
      ${item?.vigencia_certificada ? '<div style="margin-top:9px;font-weight:600;color:#2b7a5a">Seguimiento, tabla y SIG acreditan la misma versión normativa.</div>' : `<div style="margin-top:9px;color:#8a2f2f"><strong>Bloqueantes:</strong><ul style="margin:6px 0 0 18px">${blockers.map(text => `<li>${esc(text)}</li>`).join("")}</ul></div>`}
      ${actList(item)}`;
    const head = detail.querySelector(".tn-detail-head");
    if (head) head.insertAdjacentElement("afterend", box);
    else detail.prepend(box);
  }

  function patch() {
    patchNationalSummary();
    patchRows();
    patchDetail();
    const banner = document.querySelector("#module-tablas-normativas .tn-banner");
    if (banner && !banner.dataset.vigenciaRule) {
      banner.dataset.vigenciaRule = "1";
      banner.insertAdjacentHTML("beforeend", '<span style="display:block;margin-top:7px;font-weight:600">Regla global: una tabla sólo es vigente cuando seguimiento normativo + tabla + SIG están sincronizados. Cualquier acto nuevo bloquea la certificación anterior.</span>');
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; patch(); });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener("click", schedule, true);
  window.addEventListener("hashchange", schedule);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once:true });
  else schedule();
})();