(() => {
  "use strict";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
  const escAttr = value => esc(value).replace(/`/g, "&#096;");

  function slug(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function trackingFor(comuna) {
    const items = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
      ? window.SEGUIMIENTO_NORMATIVO.comunas : [];
    return items.find(item => normalize(item.comuna) === normalize(comuna)) || null;
  }

  function formatDate(value) {
    if (!value) return "—";
    const parts = String(value).split("-");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  }

  function registerKnownAutomaticSources() {
    window.FUENTES_MULTIFUENTE_IPT = window.FUENTES_MULTIFUENTE_IPT || {
      version: "1.1", fecha_actualizacion: "2026-08-31", criterio: {}, por_comuna: {}
    };
    window.FUENTES_MULTIFUENTE_IPT.por_comuna = window.FUENTES_MULTIFUENTE_IPT.por_comuna || {};

    // Renca: fuentes oficiales públicas ya identificadas por el mismo seguimiento que usa IPT/vigencia.
    // El registro no implica que toda la auditoría de parámetros esté cerrada.
    if (!window.FUENTES_MULTIFUENTE_IPT.por_comuna.metropolitana_de_santiago__renca) {
      window.FUENTES_MULTIFUENTE_IPT.por_comuna.metropolitana_de_santiago__renca = {
        fecha_revision: "2026-08-31",
        estado_busqueda: "fuentes_oficiales_identificadas_auditoria_en_curso",
        fuentes_normativas: [
          {
            id: "renca-muni-prc-2022",
            institucion: "Municipalidad de Renca",
            nombre: "Plan Regulador Comunal vigente (2022)",
            tipo: "Expediente municipal oficial",
            formato: "HTML y documentos descargables",
            version_instrumento: "Decreto N° 214 de 09-02-2022 · publicado 22-02-2022",
            estado: "oficial_vigente_con_enmienda_posterior",
            uso: "Fuente base para ordenanza, planos, memoria, estudios, decreto y publicación en Diario Oficial.",
            url: "https://renca.cl/unidades-municipales/secretaria-comunal-de-planificacion/prc/plan-regulador-comunal-vigente-2022/"
          },
          {
            id: "renca-muni-enmienda-1-2026",
            institucion: "Municipalidad de Renca",
            nombre: "Enmienda N°1 del Plan Regulador Comunal (2026)",
            tipo: "Enmienda PRC",
            formato: "HTML + decreto + texto aprobatorio + plano + memoria + Diario Oficial",
            version_instrumento: "Decreto N° 1460 de 15-06-2026 · publicación municipal 07-07-2026",
            estado: "oficial_vigente_en_ambito",
            uso: "Modifica la normativa del polígono/subzona EE-1-1 asociado al Campus Municipal; debe incorporarse por ámbito y no globalmente.",
            url: "https://renca.cl/unidades-municipales/secretaria-comunal-de-planificacion/prc/enmienda-n1-del-plan-regulador-comunal-2026/"
          }
        ],
        fuentes_cartograficas: [
          {
            id: "renca-muni-visor-prc",
            institucion: "Municipalidad de Renca",
            nombre: "Plano de zonificación / visor digital PRC",
            tipo: "Cartografía oficial de referencia",
            formato: "Planos y visor municipal",
            version_instrumento: "PRC 2022 + instrumentos posteriores según ámbito",
            estado: "geometria_normativa_oficial_a_contrastar",
            uso: "Contraste espacial de CODIGO_PRC y del ámbito de modificaciones/enmiendas.",
            url: "https://renca.cl/unidades-municipales/secretaria-comunal-de-planificacion/prc/"
          }
        ]
      };
    }
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
    return Object.entries(registry).find(([key]) => key.endsWith(suffix))?.[1] || null;
  }

  function sourceStatusLabel(value) {
    return String(value || "Pendiente").replace(/_/g, " ");
  }

  function sourceCard(source) {
    const link = source.url
      ? `<a href="${escAttr(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial →</a>` : "";
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

  function trackingFallback(comuna) {
    const tracking = trackingFor(comuna);
    if (!tracking) return `
      <div class="tn-source-empty"><h4>Fuentes normativas · levantamiento automático</h4><p>Aún no existe un registro consolidado para ${esc(comuna)}. El motor de fuentes debe buscar municipio, Diario Oficial/BCN, MINVU/SEREMI y el instrumento superior aplicable.</p></div>`;

    const acts = Number(tracking.actos_posteriores || 0);
    return `
      <div class="tn-source-head">
        <div><p class="eyebrow">DETECCIÓN NACIONAL DE VIGENCIA</p><h4>${esc(comuna)} · seguimiento automático</h4><p class="tn-subtle">El catálogo detallado todavía está en construcción, pero el motor nacional ya detectó el instrumento y sus actos posteriores.</p></div>
        <span class="tn-pill ${acts ? "audit" : "ok"}">${acts} actos posteriores</span>
      </div>
      <div class="tn-summary-grid">
        <div><span>Instrumento base</span><strong>${esc(tracking.prc_nombre || "Por identificar")}</strong></div>
        <div><span>Vigencia base</span><strong>${esc(formatDate(tracking.prc_fecha))}</strong></div>
        <div><span>Actos posteriores</span><strong>${acts}</strong></div>
        <div><span>Último acto detectado</span><strong>${esc(formatDate(tracking.ultimo_acto_posterior))}</strong></div>
      </div>
      <div class="tn-source-rule"><strong>Estado:</strong> ${esc(tracking.estado_fuente || "Por verificar")}. La ausencia de tarjetas detalladas no significa ausencia de fuentes: significa que falta resolver cada acto a su documento oficial y ámbito.</div>`;
  }

  function renderSources(detail) {
    registerKnownAutomaticSources();
    const box = detail.querySelector("#tnTabContent");
    if (!box) return;
    const { comuna, region } = contextFromDetail(detail);
    const bundle = sourceBundle(region, comuna);
    const registry = window.FUENTES_MULTIFUENTE_IPT || {};
    const tracking = trackingFor(comuna);

    if (!bundle) {
      box.innerHTML = trackingFallback(comuna);
      return;
    }

    const normative = Array.isArray(bundle.fuentes_normativas) ? bundle.fuentes_normativas : [];
    const cartographic = Array.isArray(bundle.fuentes_cartograficas) ? bundle.fuentes_cartograficas : [];
    const rule = registry.criterio?.regla_version || "La vigencia debe comprobarse contra el acto y la versión oficial aplicable.";
    const acts = Number(tracking?.actos_posteriores || 0);

    box.innerHTML = `
      <div class="tn-source-head">
        <div><p class="eyebrow">TRAZABILIDAD DOCUMENTAL AUTOMÁTICA</p><h4>${esc(comuna)} · fuentes oficiales identificadas</h4><p class="tn-subtle">Revisión: ${esc(bundle.fecha_revision || registry.fecha_actualizacion || "—")} · ${esc(sourceStatusLabel(bundle.estado_busqueda || "registrada"))}</p></div>
        <span class="tn-pill ${acts ? "audit" : "ok"}">${normative.length + cartographic.length} fuentes · ${acts} actos posteriores</span>
      </div>
      <div class="tn-summary-grid">
        <div><span>PRC base</span><strong>${esc(tracking?.prc_fecha ? formatDate(tracking.prc_fecha) : "—")}</strong></div>
        <div><span>Fuentes normativas</span><strong>${normative.length}</strong></div>
        <div><span>Actos posteriores detectados</span><strong>${acts}</strong></div>
        <div><span>Último acto</span><strong>${esc(formatDate(tracking?.ultimo_acto_posterior))}</strong></div>
      </div>
      <section class="tn-source-section">
        <h4>Fuentes normativas</h4>
        <p class="tn-subtle">Ordenanzas, decretos, publicaciones y enmiendas/modificaciones detectadas. La aplicación espacial se valida antes de corregir la tabla.</p>
        <div class="tn-source-grid">${normative.map(sourceCard).join("") || '<div class="tn-note">Sin fuentes normativas detalladas todavía.</div>'}</div>
      </section>
      <section class="tn-source-section">
        <h4>Fuentes cartográficas</h4>
        <p class="tn-subtle">Planos y servicios SIG usados para comprobar el ámbito de cada acto.</p>
        <div class="tn-source-grid">${cartographic.map(sourceCard).join("") || '<div class="tn-note">Sin fuentes cartográficas detalladas todavía.</div>'}</div>
      </section>
      <div class="tn-source-rule"><strong>Regla de vigencia:</strong> ${esc(rule)}<br><strong>Revisión humana:</strong> sólo cuando un acto, código o ámbito espacial no puede resolverse inequívocamente.</div>`;
  }

  function ensureSourcesTab() {
    registerKnownAutomaticSources();
    const detail = document.getElementById("tnDetail");
    if (!detail || detail.hidden) return;
    const tabs = detail.querySelector(".tn-tabs");
    if (!tabs || tabs.querySelector('[data-tn-tab="fuentes"]')) return;

    const { comuna, region } = contextFromDetail(detail);
    const bundle = sourceBundle(region, comuna);
    const count = bundle ? (bundle.fuentes_normativas?.length || 0) + (bundle.fuentes_cartograficas?.length || 0) : 0;
    const tracking = trackingFor(comuna);
    const acts = Number(tracking?.actos_posteriores || 0);

    const button = document.createElement("button");
    button.className = "tn-tab";
    button.type = "button";
    button.dataset.tnTab = "fuentes";
    button.textContent = count ? `Fuentes (${count})` : (acts ? `Fuentes · ${acts} actos` : "Fuentes");

    const staging = tabs.querySelector('[data-tn-tab="staging"]');
    tabs.insertBefore(button, staging || null);
    button.addEventListener("click", () => {
      detail.querySelectorAll(".tn-tab").forEach(tab => tab.classList.toggle("active", tab === button));
      renderSources(detail);
    });
  }

  function init() {
    registerKnownAutomaticSources();
    injectStyles();
    ensureSourcesTab();
    const observer = new MutationObserver(() => ensureSourcesTab());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
