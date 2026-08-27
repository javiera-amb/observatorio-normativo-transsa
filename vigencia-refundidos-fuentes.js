(() => {
  "use strict";

  if (typeof renderVigenciaDetail !== "function" || typeof vigenciaInstruments !== "function") {
    console.warn("La auditoría de refundidos y fuentes se cargó antes que la vista IPT.");
    return;
  }

  const sourceCatalog = window.FUENTES_MULTIFUENTE_IPT || { por_comuna: {}, criterio: {} };
  const PORTAL_IPT = "https://portalipt.minvu.cl/instrumentos";
  const IDE_MINVU = "https://ide.minvu.cl/pages/descargas";

  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const year = value => /^\d{4}/.test(String(value || "")) ? String(value).slice(0, 4) : "sin fecha";

  const uniqueSources = sources => {
    const result = new Map();
    sources.filter(Boolean).forEach(source => {
      const key = source.id || source.url || `${source.institucion}__${source.nombre}`;
      if (!result.has(key)) result.set(key, source);
    });
    return [...result.values()];
  };

  function sourceRecordFor(item) {
    const key = `${normalize(item.region)}__${normalize(item.comuna)}`;
    return sourceCatalog.por_comuna?.[key] || null;
  }

  function defaultSources(item) {
    const explicit = sourceRecordFor(item);
    if (explicit) return explicit;

    return {
      fecha_revision: "Pendiente",
      estado_busqueda: "busqueda_multifuente_pendiente",
      fuentes_normativas: [
        {
          id: `${item.id}-portal-ipt`,
          institucion: "MINVU · Portal IPT",
          nombre: "Inventario de instrumentos aplicables",
          tipo: "Catálogo de referencia",
          formato: "Portal web",
          version_instrumento: "Registros asociados a la comuna",
          estado: "inventario_referencia",
          uso: "Identificar instrumentos y versiones; no sustituye la revisión del expediente oficial.",
          url: item.fuente_portal_ipt || PORTAL_IPT
        },
        {
          id: `${item.id}-municipal-pendiente`,
          institucion: "Municipalidad / SECPLAN",
          nombre: "Expediente normativo comunal",
          tipo: "Ordenanza, memoria y planos",
          formato: "PDF, JPG u otro",
          version_instrumento: "Por identificar",
          estado: "pendiente_busqueda",
          uso: "Buscar el expediente más reciente y comprobar su correspondencia con el instrumento vigente."
        }
      ],
      fuentes_cartograficas: [
        {
          id: `${item.id}-municipal-sig-pendiente`,
          institucion: "Municipalidad / SECPLAN",
          nombre: "Cartografía municipal oficial",
          tipo: "Shape, GeoPackage, ArcGIS Online/REST o planos",
          formato: "Por identificar",
          version_instrumento: "Por acreditar",
          estado: "pendiente_busqueda",
          uso: "Prioridad de búsqueda cuando la versión se vincula inequívocamente al acto vigente."
        },
        {
          id: `${item.id}-geoide-pendiente`,
          institucion: "MINVU · GeoIDE",
          nombre: "Servicio o descarga SIG del IPT",
          tipo: "Shape, GeoPackage o servicio web",
          formato: "Por identificar",
          version_instrumento: "Por acreditar",
          estado: "pendiente_busqueda",
          uso: "Comparar fecha, códigos, atributos y geometría contra los planos normativos.",
          url: item.fuente_cartografia || IDE_MINVU
        }
      ]
    };
  }

  function comparisonNature(comparison) {
    if (comparison.naturaleza_transicion) return comparison.naturaleza_transicion;
    if ((comparison.cambios || []).some(change => change.tipo_cambio === "reemplazo_integral")) {
      return "reemplazo_integral_confirmado";
    }
    const currentName = normalize(comparison.instrumento_nuevo?.nombre);
    if (currentName.includes("modificacion_integral")) return "candidato_reemplazo_integral";
    if (currentName.includes("actualizacion")) return "nueva_version_por_clasificar";
    return "transicion_entre_versiones";
  }

  function genericPackage(comparison) {
    const changes = Array.isArray(comparison.cambios) ? comparison.cambios : [];
    const changed = changes.filter(change => ![
      "reemplazo_integral", "zona_no_reproducida", "recodificacion", "enmienda_transitoria"
    ].includes(change.tipo_cambio));
    const replaced = changes.filter(change => ["zona_no_reproducida", "recodificacion"].includes(change.tipo_cambio));
    const pending = changes.filter(change =>
      change.estado_sig === "pendiente_revision" || change.tipo_cambio === "enmienda_transitoria"
    );

    return {
      estado: comparisonNature(comparison),
      base_anterior: comparison.instrumento_anterior?.nombre || "Versión anterior por identificar",
      base_vigente: comparison.instrumento_nuevo?.nombre || "Versión nueva por identificar",
      consolida: [
        `Transición ${comparison.tipo_ipt || "IPT"} ${year(comparison.instrumento_anterior?.fecha)} → ${year(comparison.instrumento_nuevo?.fecha)}.`
      ],
      incorpora: [],
      incorpora_estado: "pendiente_validar_actos_anteriores",
      cambia: changed.map(change => change.materia).filter(Boolean),
      reemplaza: replaced.map(change => change.materia).filter(Boolean),
      sin_cambio: [],
      pendientes: pending.map(change => change.materia).filter(Boolean)
    };
  }

  function enrichItems() {
    vigenciaInstruments().forEach(item => {
      const sourceRecord = defaultSources(item);
      item.auditoria_fuentes = {
        ...sourceRecord,
        fuentes_normativas: uniqueSources(sourceRecord.fuentes_normativas || []),
        fuentes_cartograficas: uniqueSources(sourceRecord.fuentes_cartograficas || [])
      };

      const prcComparisons = (item.comparaciones_versiones || []).filter(comparison => comparison.tipo_ipt === "PRC");
      item.paquetes_transicion_prc = prcComparisons.map(comparison => {
        comparison.naturaleza_transicion = comparisonNature(comparison);
        comparison.paquete_refundido = comparison.paquete_refundido || genericPackage(comparison);
        return comparison;
      });

      const confirmed = prcComparisons.filter(comparison =>
        comparison.naturaleza_transicion === "reemplazo_integral_confirmado"
      );
      const detailedChanges = confirmed.reduce((sum, comparison) => sum + Number(comparison.cambios?.length || 0), 0);
      const sigActions = confirmed.reduce((sum, comparison) => sum + Number(comparison.acciones_sig?.length || 0), 0);

      if (confirmed.length) {
        item.indicador_cambios = `${confirmed.length} ${confirmed.length === 1 ? "reemplazo integral" : "reemplazos integrales"} · ${detailedChanges} diferencias${sigActions ? ` · ${sigActions} acciones SIG` : ""}`;
      } else if (prcComparisons.length) {
        item.indicador_cambios = `${prcComparisons.length} ${prcComparisons.length === 1 ? "transición PRC" : "transiciones PRC"} · ${Number(item.cantidad_actos || 0)} actos`;
      } else {
        item.indicador_cambios = `${Number(item.cantidad_actos || 0)} ${Number(item.cantidad_actos || 0) === 1 ? "acto asociado" : "actos asociados"}`;
      }
    });
  }

  const natureLabel = nature => ({
    reemplazo_integral_confirmado: "Reemplazo integral confirmado",
    candidato_reemplazo_integral: "Posible reemplazo integral",
    nueva_version_por_clasificar: "Nueva versión por clasificar",
    transicion_entre_versiones: "Transición entre versiones"
  }[nature] || "Transición por clasificar");

  const natureClass = nature => nature === "reemplazo_integral_confirmado"
    ? "confirmed"
    : nature === "candidato_reemplazo_integral"
      ? "candidate"
      : "pending";

  const sourceStatusLabel = status => ({
    oficial_vigente: "Normativa oficial vigente",
    geometria_normativa_oficial: "Geometría normativa oficial",
    candidata_validacion: "Candidata · requiere validación",
    descartada_desactualizada: "Descartada · desactualizada",
    inventario_referencia: "Inventario de referencia",
    pendiente_busqueda: "Búsqueda pendiente"
  }[status] || "Pendiente de clasificar");

  const listTemplate = (values, emptyMessage) => values?.length
    ? `<ul>${values.map(value => `<li>${escape(value)}</li>`).join("")}</ul>`
    : `<p class="transition-empty">${escape(emptyMessage)}</p>`;

  function packageCardTemplate(comparison) {
    const data = comparison.paquete_refundido || genericPackage(comparison);
    const nature = comparison.naturaleza_transicion || comparisonNature(comparison);
    const previous = comparison.instrumento_anterior || {};
    const current = comparison.instrumento_nuevo || {};
    const changeCount = Number(comparison.cambios?.length || 0);
    const actionCount = Number(comparison.acciones_sig?.length || 0);

    return `
      <article class="transition-package-card">
        <div class="transition-package-head">
          <div>
            <span class="transition-nature ${natureClass(nature)}">${escape(natureLabel(nature))}</span>
            <h5>${escape(`${comparison.tipo_ipt || "PRC"} ${year(previous.fecha)} → ${year(current.fecha)}`)}</h5>
            <p>${escape(previous.nombre || "Versión anterior")} → ${escape(current.nombre || "Versión nueva")}</p>
          </div>
          <div class="transition-metrics">
            <span>${changeCount} diferencias documentadas</span>
            ${actionCount ? `<span>${actionCount} acciones SIG</span>` : ""}
          </div>
        </div>
        <div class="transition-group-grid">
          <section class="transition-group base">
            <span>Qué consolida</span>
            ${listTemplate(data.consolida, "Pendiente de identificar el alcance consolidado.")}
          </section>
          <section class="transition-group incorporated">
            <span>Qué incorpora de actos anteriores</span>
            ${listTemplate(data.incorpora, "Todavía no está acreditado qué modificaciones o enmiendas quedaron absorbidas.")}
          </section>
          <section class="transition-group changed">
            <span>Qué cambia</span>
            ${listTemplate(data.cambia, "Comparación de ordenanzas, memorias y planos pendiente.")}
          </section>
          <section class="transition-group replaced">
            <span>Qué reemplaza o recodifica</span>
            ${listTemplate(data.reemplaza, "Correspondencias antiguas y nuevas pendientes de clasificar.")}
          </section>
          <section class="transition-group unchanged">
            <span>Qué permanece sin cambio</span>
            ${listTemplate(data.sin_cambio, "No hay elementos sin cambio acreditados todavía.")}
          </section>
          <section class="transition-group pending">
            <span>Qué falta validar</span>
            ${listTemplate(data.pendientes, "Falta completar la validación documental y espacial.")}
          </section>
        </div>
      </article>
    `;
  }

  function transitionSectionTemplate(item) {
    const comparisons = item.paquetes_transicion_prc || [];
    if (!comparisons.length) return "";
    return `
      <section class="transition-package-section">
        <div class="transition-section-head">
          <div>
            <p class="eyebrow">TRAZABILIDAD DEL PRC</p>
            <h4>Paquetes de cambio entre versiones</h4>
            <p>Un refundido o reemplazo integral se separa de las modificaciones simples. Lo no acreditado permanece expresamente pendiente.</p>
          </div>
          <span>${comparisons.length} ${comparisons.length === 1 ? "transición" : "transiciones"}</span>
        </div>
        <div class="transition-package-list">${comparisons.map(packageCardTemplate).join("")}</div>
      </section>
    `;
  }

  function sourceCardTemplate(source) {
    const status = source.estado || "pendiente_busqueda";
    return `
      <article class="audit-source-card ${escape(status)}">
        <div class="audit-source-topline">
          <span class="audit-source-status">${escape(sourceStatusLabel(status))}</span>
          <small>${escape(source.formato || "Formato pendiente")}</small>
        </div>
        <strong>${escape(source.nombre || "Fuente por identificar")}</strong>
        <span>${escape(source.institucion || "Institución pendiente")}</span>
        <p>${escape(source.uso || "Uso pendiente de definir.")}</p>
        <small class="audit-source-version">Versión: ${escape(source.version_instrumento || "Por acreditar")}</small>
        ${source.url ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente →</a>` : ""}
      </article>
    `;
  }

  function sourceSectionTemplate(item) {
    const audit = item.auditoria_fuentes || defaultSources(item);
    const normative = audit.fuentes_normativas || [];
    const cartographic = audit.fuentes_cartograficas || [];
    const reviewed = audit.estado_busqueda !== "busqueda_multifuente_pendiente";
    return `
      <section class="source-audit-section">
        <div class="source-audit-head">
          <div>
            <p class="eyebrow">PROCEDENCIA Y VERSIÓN</p>
            <h4>Fuentes normativas y cartográficas</h4>
            <p>La fuente que acredita la norma se muestra separada de la geometría utilizada en el SIG.</p>
          </div>
          <span class="source-search-status ${reviewed ? "started" : "pending"}">${reviewed ? "Búsqueda multifuente iniciada" : "Búsqueda municipal/ArcGIS pendiente"}</span>
        </div>
        <div class="source-audit-columns">
          <div>
            <h5>Fuentes normativas</h5>
            <div class="audit-source-list">${normative.map(sourceCardTemplate).join("")}</div>
          </div>
          <div>
            <h5>Fuentes cartográficas</h5>
            <div class="audit-source-list">${cartographic.map(sourceCardTemplate).join("")}</div>
          </div>
        </div>
        <p class="source-audit-rule"><strong>Regla de selección:</strong> ${escape(sourceCatalog.criterio?.regla_version || "La versión del archivo debe coincidir con el acto normativo vigente.")}</p>
      </section>
    `;
  }

  function injectStyles() {
    if (document.getElementById("refundidosFuentesStyles")) return;
    const style = document.createElement("style");
    style.id = "refundidosFuentesStyles";
    style.textContent = `
      .transition-package-section,.source-audit-section{margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff}
      .transition-section-head,.source-audit-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      .transition-section-head h4,.source-audit-head h4{margin:2px 0 0;color:var(--transsa-navy)}
      .transition-section-head p:not(.eyebrow),.source-audit-head p:not(.eyebrow){margin:5px 0 0;color:var(--muted);font-size:.76rem;line-height:1.5}
      .transition-section-head>span,.source-search-status{padding:7px 9px;border-radius:999px;background:var(--surface-soft);color:var(--muted);font-size:.65rem;font-weight:700;white-space:nowrap}
      .source-search-status.started{color:#176342;background:#e4f5ec}.source-search-status.pending{color:#735110;background:#fff3cf}
      .transition-package-list{display:grid;gap:12px}.transition-package-card{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface-soft)}
      .transition-package-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.transition-package-head h5{margin:8px 0 3px;color:var(--transsa-navy);font-size:.92rem}.transition-package-head p{margin:0;color:var(--muted);font-size:.69rem;line-height:1.45}
      .transition-nature{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:.63rem;font-weight:700}.transition-nature.confirmed{color:#176342;background:#e4f5ec}.transition-nature.candidate{color:#735110;background:#fff3cf}.transition-nature.pending{color:#56616f;background:#e8ebf0}
      .transition-metrics{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.transition-metrics span{padding:6px 8px;border-radius:8px;background:#fff;border:1px solid var(--line);color:#4e5665;font-size:.63rem;font-weight:700}
      .transition-group-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:13px}.transition-group{padding:11px;border:1px solid var(--line);border-left:4px solid #9a9daa;border-radius:10px;background:#fff}.transition-group>span{display:block;color:var(--transsa-navy);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em}.transition-group ul{margin:7px 0 0;padding-left:17px;color:#454d5c;font-size:.69rem;line-height:1.45}.transition-group li+li{margin-top:4px}.transition-group.base{border-left-color:#3739d8}.transition-group.incorporated{border-left-color:#6f6fe8}.transition-group.changed{border-left-color:#2b7a5a}.transition-group.replaced{border-left-color:#d7951f}.transition-group.unchanged{border-left-color:#2781a3}.transition-group.pending{border-left-color:#b04a54}.transition-empty{margin:7px 0 0;color:var(--muted);font-size:.68rem;line-height:1.4}
      .source-audit-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px}.source-audit-columns h5{margin:0 0 8px;color:var(--transsa-navy);font-size:.78rem}.audit-source-list{display:grid;gap:8px}.audit-source-card{padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--surface-soft)}.audit-source-card>strong,.audit-source-card>span,.audit-source-card>a,.audit-source-version{display:block}.audit-source-card>strong{margin-top:8px;color:var(--transsa-navy);font-size:.76rem}.audit-source-card>span{margin-top:3px;color:var(--muted);font-size:.64rem}.audit-source-card>p{margin:7px 0;color:#4b5362;font-size:.67rem;line-height:1.45}.audit-source-card>a{margin-top:8px;color:var(--transsa-blue);font-size:.66rem;font-weight:700}.audit-source-topline{display:flex;justify-content:space-between;gap:8px;align-items:center}.audit-source-topline small{color:var(--muted);font-size:.58rem}.audit-source-status{padding:4px 6px;border-radius:7px;background:#e8ebf0;color:#56616f;font-size:.58rem;font-weight:700}.audit-source-card.oficial_vigente .audit-source-status,.audit-source-card.geometria_normativa_oficial .audit-source-status{color:#176342;background:#e4f5ec}.audit-source-card.candidata_validacion .audit-source-status{color:#735110;background:#fff3cf}.audit-source-card.descartada_desactualizada{opacity:.76}.audit-source-card.descartada_desactualizada .audit-source-status{color:#922f38;background:#fde8ea}.audit-source-version{color:var(--muted);font-size:.6rem}.source-audit-rule{margin:13px 0 0;padding:10px 12px;border-left:3px solid var(--transsa-blue);border-radius:8px;background:var(--transsa-pale);color:#4b5362;font-size:.68rem;line-height:1.45}
      .vigencia-card-footer span:last-child{max-width:64%;text-align:right;line-height:1.25}
      @media(max-width:760px){.transition-section-head,.source-audit-head,.transition-package-head{display:block}.transition-section-head>span,.source-search-status{display:inline-flex;margin-top:8px}.transition-metrics{justify-content:flex-start;margin-top:9px}.transition-group-grid,.source-audit-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addSections() {
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    const detail = document.getElementById("vigenciaDetail");
    if (!item || !detail) return;

    const firstContent = detail.querySelector(".normative-framework-section, .strategic-reading-section, .commune-plan-section, .vigencia-map-section");
    const transitionHtml = transitionSectionTemplate(item);
    if (transitionHtml && firstContent && !detail.querySelector(".transition-package-section")) {
      firstContent.insertAdjacentHTML("beforebegin", transitionHtml);
    }

    const transitionSection = detail.querySelector(".transition-package-section");
    const sourceAnchor = transitionSection || firstContent;
    if (sourceAnchor && !detail.querySelector(".source-audit-section")) {
      sourceAnchor.insertAdjacentHTML("afterend", sourceSectionTemplate(item));
    }
  }

  enrichItems();
  injectStyles();

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderRefundidosFuentesDetail() {
    originalRenderDetail();
    addSections();
  };

  if (typeof renderVigencia === "function") renderVigencia();
})();
