(() => {
  "use strict";

  const norm = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  function registry() {
    return Array.isArray(window.VIGENCIA_TABLAS_NORMATIVAS?.comunas)
      ? window.VIGENCIA_TABLAS_NORMATIVAS.comunas : [];
  }

  function certification(comuna) {
    return registry().find(item => norm(item.comuna) === norm(comuna)) || null;
  }

  function stateLabel(item) {
    if (!item) return "REVISAR · SIN CERTIFICACIÓN";
    return item.vigencia_certificada ? "VIGENTE · SINCRONIZADA" :
      String(item.estado_vigencia || "REVISAR").replaceAll("_", " ");
  }

  function pill(item) {
    const ok = Boolean(item?.vigencia_certificada);
    const background = ok ? "#edf7f2" : "#fff0f0";
    const color = ok ? "#2b7a5a" : "#a02f2f";
    return `<span class="tn-pill" style="background:${background};color:${color};font-weight:700">${esc(stateLabel(item))}</span>`;
  }

  function patchRows() {
    document.querySelectorAll("#tnTableBody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;
      const comuna = cells[0].querySelector("strong")?.textContent?.trim() || "";
      if (!comuna) return;
      const item = certification(comuna);
      const expected = Number(item?.actos_seguimiento || 0);
      const applied = Number(item?.actos_aplicados || 0);
      const candidates = Number(item?.candidatos_pendientes || 0);

      cells[2].innerHTML = `${pill(item)}<div class="tn-subtle" style="margin-top:5px">Actos aplicados: <strong>${applied}/${expected}</strong>${candidates ? ` · ${candidates} antecedente(s) nuevo(s) por conciliar` : ""}</div>`;
      cells[5].innerHTML = pill(item);
      row.dataset.vigenciaGlobal = item?.vigencia_certificada ? "certificada" : "bloqueada";
    });
  }

  function actList(item) {
    const acts = Array.isArray(item?.actos_posteriores_detalle) ? item.actos_posteriores_detalle : [];
    if (!acts.length) return '<div class="tn-subtle">Sin detalle individual disponible todavía.</div>';
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
      ${item?.vigencia_certificada ? '<div style="margin-top:9px;font-weight:600;color:#2b7a5a">Seguimiento, tabla y SIG acreditan la misma versión normativa.</div>' : `<div style="margin-top:9px;color:#8a2f2f"><strong>Bloqueantes:</strong><ul style="margin:6px 0 0 18px">${blockers.map(text => `<li>${esc(text)}</li>`).join("")}</ul></div>`}
      ${actList(item)}`;
    const head = detail.querySelector(".tn-detail-head");
    if (head) head.insertAdjacentElement("afterend", box);
    else detail.prepend(box);
  }

  function patch() {
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
