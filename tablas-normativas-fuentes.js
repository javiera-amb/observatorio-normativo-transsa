(() => {
  "use strict";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const escAttr = value => esc(value).replace(/`/g, "&#096;");

  function slug(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function injectStyles() {
    if (document.getElementById("tablasNormativasFuentesStyles")) return;
    const style = document.createElement("style");
    style.id = "tablasNormativasFuentesStyles";
    style.textContent = `
      .tn-source-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      .tn-source-head h4{margin:0;color:var(--transsa-navy);font-size:1.05rem}
      .tn-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
      .tn-source-card{display:flex;flex-direction:column;gap:7px;padding:15px;border:1px solid var(--line);border-radius:14px;background:#fff}
      .tn-source-card h5{margin:0;color:var(--transsa-navy);font-size:.92rem;line-height:1.3}
      .tn-source-card p{margin:0;color:var(--muted);font-size:.78rem;line-height:1.45}
      .tn-source-meta{display:flex;flex-wrap:wrap;gap:6px}.tn-source-meta span{padding:4px 7px;border-radius:7px;background:var(--surface-soft);color:var(--muted);font-size:.68rem}
      .tn-source-card a{margin-top:auto;padding-top:5px;color:var(--transsa-blue);font-size:.78rem;font-weight:600}
      .tn-source-section{margin-top:20px}.tn-source-section h4{margin:0 0 4px;color:var(--transsa-navy)}
      .tn-source-rule{margin-top:18px;padding:12px 14px;border-left:4px solid #d0922f;border-radius:0 10px 10px 0;background:#fff7e8;color:#76511c;font-size:.78rem}
      .tn-source-empty{padding:20px;border:1px dashed #b8b8cc;border-radius:14px;background:#fafaff}
      .tn-source-empty h4{margin:0 0 7px;color:var(--transsa-navy)}.tn-source-empty p{margin:0;color:var(--muted)}
      @media(max-width:760px){.tn-source-grid{grid-template-columns:1fr}.tn-source-head{display:block}}
    `;
    document.head.appendChild(style);
  }

  function contextFromDetail(detail) {
    const comuna = detail.querySelector(".tn-detail-head h3")?.textContent?.trim() || "";
    const subtitle = detail.querySelector(".tn-detail-head .tn-subtle")?.textContent?.trim() || "";
    const region = subtitle.split(" · ")[0]?.trim() || "";
    return { comuna, region };
  }

  function sourceBundle(region, comuna) {
    const registry = window.FUENTES_MULTIFUENTE_IPT?.por_comuna || {};
    const exact = `${slug(region)}__${slug(comuna)}`;
    if (registry[exact]) return registry[exact];
    const suffix = `__${slug(comuna)}`;
    const match = Object.entries(registry).find(([key]) => key.endsWith(suffix));
    return match?.[1] || null;
  }

  function sourceStatusLabel(value) {
    return String(value || "Pendiente").replace(/_/g, " ");
  }

  function sourceCard(source) {
    const link = source.url
      ? `<a href="${escAttr(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial →</a>`
      : "";
    return `
      <article class="tn-source-card">
        <div class="tn-source-meta">
          <span>${esc(source.institucion || "Fuente")}</span>
          <span>${esc(source.tipo || "Documento")}</span>
          <span>${esc(source.formato || "Formato no registrado")}</span>
          <span>${esc(sourceStatusLabel(source.estado))}</span>
        </div>
        <h5>${esc(source.nombre || "Fuente sin nombre")}</h5>
        <p><strong>Versión:</strong> ${esc(source.version_instrumento || "Por verificar")}</p>
        <p>${esc(source.uso || "Uso pendiente de documentar.")}</p>
        ${link}
      </article>`;
  }

  function renderSources(detail) {
    const box = detail.querySelector("#tnTabContent");
    if (!box) return;
    const { comuna, region } = contextFromDetail(detail);
    const bundle = sourceBundle(region, comuna);
    const registry = window.FUENTES_MULTIFUENTE_IPT || {};

    if (!bundle) {
      box.innerHTML = `
        <div class="tn-source-empty">
          <h4>Fuentes normativas · búsqueda pendiente</h4>
          <p>No hay fuentes registradas todavía para ${esc(comuna)} en el catálogo multifuente de TUI. Esto no significa que la comuna no tenga normativa ni documentos oficiales; significa que el levantamiento documental aún no está registrado en esta base.</p>
        </div>
        <div class="tn-source-rule"><strong>Regla TUI:</strong> la ausencia de una fuente en el catálogo nunca se interpreta como ausencia del instrumento o documento.</div>`;
      return;
    }

    const normative = Array.isArray(bundle.fuentes_normativas) ? bundle.fuentes_normativas : [];
    const cartographic = Array.isArray(bundle.fuentes_cartograficas) ? bundle.fuentes_cartograficas : [];
    const rule = registry.criterio?.regla_version || "La vigencia debe comprobarse contra el acto y la versión oficial aplicable.";

    box.innerHTML = `
      <div class="tn-source-head">
        <div><p class="eyebrow">TRAZABILIDAD DOCUMENTAL</p><h4>${esc(comuna)} · fuentes registradas</h4><p class="tn-subtle">Revisión: ${esc(bundle.fecha_revision || registry.fecha_actualizacion || "—")} · ${esc(sourceStatusLabel(bundle.estado_busqueda || "registrada"))}</p></div>
        <span class="tn-pill ok">${normative.length + cartographic.length} fuentes</span>
      </div>
      <div class="tn-summary-grid">
        <div><span>Fuentes normativas</span><strong>${normative.length}</strong></div>
        <div><span>Fuentes cartográficas</span><strong>${cartographic.length}</strong></div>
        <div><span>Estado de búsqueda</span><strong>${esc(sourceStatusLabel(bundle.estado_busqueda || "—"))}</strong></div>
        <div><span>Validación staging</span><strong>Humana</strong></div>
      </div>
      <section class="tn-source-section">
        <h4>Fuentes normativas</h4>
        <p class="tn-subtle">Ordenanzas, expedientes, actos y antecedentes oficiales para validar códigos, zonas y parámetros.</p>
        <div class="tn-source-grid">${normative.map(sourceCard).join("") || '<div class="tn-note">Sin fuentes normativas registradas todavía.</div>'}</div>
      </section>
      <section class="tn-source-section">
        <h4>Fuentes cartográficas</h4>
        <p class="tn-subtle">Planos y servicios SIG se muestran con su estado registrado; una capa candidata no se considera vigente automáticamente.</p>
        <div class="tn-source-grid">${cartographic.map(sourceCard).join("") || '<div class="tn-note">Sin fuentes cartográficas registradas todavía.</div>'}</div>
      </section>
      <div class="tn-source-rule"><strong>Regla de vigencia:</strong> ${esc(rule)}</div>
      <div class="tn-actions"><button id="tnSourcesToStaging" type="button">Ir a control de staging</button></div>`;

    box.querySelector("#tnSourcesToStaging")?.addEventListener("click", () => {
      detail.querySelector('[data-tn-tab="staging"]')?.click();
    });
  }

  function ensureSourcesTab() {
    const detail = document.getElementById("tnDetail");
    if (!detail || detail.hidden) return;
    const tabs = detail.querySelector(".tn-tabs");
    if (!tabs || tabs.querySelector('[data-tn-tab="fuentes"]')) return;

    const { comuna, region } = contextFromDetail(detail);
    const bundle = sourceBundle(region, comuna);
    const count = bundle
      ? (bundle.fuentes_normativas?.length || 0) + (bundle.fuentes_cartograficas?.length || 0)
      : 0;

    const button = document.createElement("button");
    button.className = "tn-tab";
    button.type = "button";
    button.dataset.tnTab = "fuentes";
    button.textContent = count ? `Fuentes (${count})` : "Fuentes";

    const staging = tabs.querySelector('[data-tn-tab="staging"]');
    tabs.insertBefore(button, staging || null);
    button.addEventListener("click", () => {
      detail.querySelectorAll(".tn-tab").forEach(tab => tab.classList.toggle("active", tab === button));
      renderSources(detail);
    });
  }

  function init() {
    injectStyles();
    ensureSourcesTab();
    const observer = new MutationObserver(() => ensureSourcesTab());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
