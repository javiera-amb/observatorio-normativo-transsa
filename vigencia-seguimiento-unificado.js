(() => {
  "use strict";

  const PORTAL_IPT = "https://portalipt.minvu.cl/instrumentos";
  const COMMUNES_SERVICE = "https://geoide.minvu.cl/server/rest/services/Hosted/CVP2024/FeatureServer/2";
  const boundaryIndex = { promise: null, byKey: new Map(), geometry: new Map() };

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bregion\b/g, " ")
    .replace(/\bdel\b|\bde\b|\bla\b|\blas\b|\blos\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  const dateSort = value => validDate(value) ? value : "9999-99-99";

  function sourceRows() {
    return Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
      ? window.SEGUIMIENTO_NORMATIVO.comunas
      : [];
  }

  function inferType(row) {
    const name = normalize(row.prc_nombre);
    const actTypes = (row.actos_posteriores_detalle || []).map(act => String(act.tipo_ipt || "").toUpperCase()).filter(Boolean);
    if (/limite urbano/.test(name)) return "LU";
    if (/intercomunal|interurbano/.test(name)) return "PRI";
    if (/metropolitano/.test(name)) return "PRM";
    if (/seccional/.test(name) && !/plan regulador comunal/.test(name)) return "PS";
    if (/plan regulador comunal|prc/.test(name)) return "PRC";
    return actTypes[0] || (row.prc_nombre ? "IPT" : "Sin IPT base");
  }

  function statusFor(row) {
    const source = String(row.estado_fuente || "");
    if (source.includes("Sin cartografía") || source.includes("Sin información") || source.includes("Sin PRC/LU")) return "Sin cartografía";
    if (source.includes("Vigente · sin cambios") || source.includes("Probablemente actualizado")) return "Probablemente actualizado";
    if (source.includes("Desactualizado")) return "Desactualizado";
    return "Revisión necesaria";
  }

  function confidenceFor(row) {
    if (row.apto_para_visor === "SI" && row.estado_auditoria === "control_preliminar") return "media";
    if (row.apto_para_visor === "SI") return "media";
    return "baja";
  }

  function actTimelineEvent(act) {
    return {
      fecha: act.fecha || "Sin fecha",
      tipo: act.tipo_acto || act.tipo_ipt || "Acto normativo",
      numero: act.official_id || (act.origen ? `Origen: ${act.origen}` : ""),
      estado: act.estado || (act.verificado_fuente ? "Fuente verificada" : "Pendiente de verificar"),
      titulo: act.titulo || "Acto normativo posterior",
      resumen: act.verificado_fuente
        ? `Acto incorporado al seguimiento nacional desde ${act.origen || "fuente oficial"}. Su efecto sobre la cartografía y la tabla normativa debe evaluarse según el estado de la comuna.`
        : `Registro pendiente de validación de fuente antes de considerarlo un cambio normativo confirmado.`,
      incorporacion: "pendiente_revision",
      fuente: act.fuente || PORTAL_IPT,
      clase_evento: "acto_posterior",
      acto_id: act.id || "",
      origen: act.origen || "",
      verificado_fuente: Boolean(act.verificado_fuente),
      codigos_origen: Array.isArray(act.codigos_origen) ? act.codigos_origen : []
    };
  }

  function buildItem(row) {
    const acts = Array.isArray(row.actos_posteriores_detalle) ? [...row.actos_posteriores_detalle] : [];
    const candidates = Array.isArray(row.candidatos_normativos_detalle) ? [...row.candidatos_normativos_detalle] : [];
    const type = inferType(row);
    const status = statusFor(row);
    const baseEvent = row.prc_nombre ? [{
      fecha: row.prc_fecha || "Sin fecha",
      tipo: type,
      numero: "Instrumento base vigente identificado",
      estado: "Base del seguimiento",
      titulo: row.prc_nombre,
      resumen: `Instrumento principal identificado para ${row.comuna}. El seguimiento posterior se calcula desde esta fecha.`,
      incorporacion: "base",
      fuente: PORTAL_IPT,
      clase_evento: "instrumento_base"
    }] : [];
    const timeline = [...baseEvent, ...acts.map(actTimelineEvent)]
      .sort((a, b) => dateSort(a.fecha).localeCompare(dateSort(b.fecha)) || String(a.titulo || "").localeCompare(String(b.titulo || ""), "es"));
    const count = Math.max(Number(row.actos_posteriores || 0), acts.length);
    const pending = status === "Revisión necesaria" || status === "Desactualizado" ? Math.max(count, 1) : 0;

    return {
      id: `seguimiento-${normalize(row.region).replaceAll(" ", "-")}-${normalize(row.comuna).replaceAll(" ", "-")}`,
      region: row.region,
      comuna: row.comuna,
      comunas: [row.comuna],
      tipo_ipt: type,
      tipos_ipt: [type],
      nivel_planificacion: "Comunal",
      nombre: row.prc_nombre || "Instrumento base no identificado",
      instrumentos: row.prc_nombre ? [{
        registro: "seguimiento-nacional",
        region: row.region,
        comuna: row.comuna,
        tipo_ipt: type,
        nivel_planificacion: "Comunal",
        nombre: row.prc_nombre,
        fecha: row.prc_fecha || "",
        fuente: PORTAL_IPT
      }] : [],
      cantidad_instrumentos: row.prc_nombre ? 1 : 0,
      fecha_instrumento_base: row.prc_fecha || "",
      fecha_ultimo_instrumento: row.prc_fecha || "",
      fecha_version_cartografica: "",
      fuente_portal_ipt: PORTAL_IPT,
      fuente_cartografia: "",
      actos_normativos: acts,
      cantidad_actos: count,
      candidatos_normativos: candidates,
      cantidad_candidatos: candidates.length,
      actos_posteriores_pendientes: pending,
      estado_alerta: status,
      confianza: confidenceFor(row),
      resumen_alerta: row.motivo || "La comuna está pendiente de revisión normativa y cartográfica.",
      alertas: candidates.length ? [{
        tipo: "Candidatos normativos pendientes",
        nivel: "medio",
        mensaje: `Hay ${candidates.length} ${candidates.length === 1 ? "registro" : "registros"} que todavía no deben tratarse como cambio confirmado.`
      }] : [],
      linea_tiempo: timeline,
      comparaciones_espaciales: [],
      archivo_geojson: "",
      campo_zona: "",
      zonas_presentes: [],
      mapa: { base_geojson: "", capas_modificaciones: [] },
      notas: "Vista generada exclusivamente desde SEGUIMIENTO_NORMATIVO. Los módulos históricos locales ya no alimentan esta ficha.",
      origen_unificado: row,
      archivo_recomendado: row.archivo_recomendado || "",
      capa_recomendada: row.capa_recomendada || "",
      estado_fuente: row.estado_fuente || "",
      estado_auditoria: row.estado_auditoria || "",
      apto_para_visor: row.apto_para_visor || "",
      consumo_propieteq: row.consumo_propieteq || "",
      ultima_revision_normativa: row.ultima_revision_normativa || window.SEGUIMIENTO_NORMATIVO?.resumen?.ultima_revision_normativa || "",
      corte_base_portal_ipt: row.corte_base_portal_ipt || window.SEGUIMIENTO_NORMATIVO?.resumen?.corte_base_portal_ipt || "",
      ultimo_acto_posterior: row.ultimo_acto_posterior || "",
      version_normativa_id: row.version_normativa_id || "",
      estado_sincronizacion_normativa: row.estado_sincronizacion_normativa || "",
      actos_pendientes_validacion_fuente: Number(row.actos_pendientes_validacion_fuente || 0)
    };
  }

  function allItems() {
    return sourceRows().map(buildItem)
      .sort((a, b) => String(a.region).localeCompare(String(b.region), "es") || String(a.comuna).localeCompare(String(b.comuna), "es"));
  }

  function injectStyles() {
    if (document.getElementById("vigenciaSeguimientoUnificadoStyles")) return;
    const style = document.createElement("style");
    style.id = "vigenciaSeguimientoUnificadoStyles";
    style.textContent = `
      .unified-source-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#e9f6ef;color:#176342;font-size:.7rem;font-weight:700}
      .unified-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0 18px}
      .unified-detail-grid>div{padding:11px;border:1px solid var(--line);border-radius:10px;background:#fff}
      .unified-detail-grid span,.unified-detail-grid strong{display:block}.unified-detail-grid span{color:var(--muted);font-size:.68rem;text-transform:uppercase;letter-spacing:.04em}.unified-detail-grid strong{margin-top:4px;color:var(--transsa-navy);font-size:.8rem;overflow-wrap:anywhere}
      .unified-section{margin-top:20px;padding:18px;border:1px solid var(--line);border-radius:15px;background:var(--surface-soft)}
      .unified-section h4{margin:0 0 4px;color:var(--transsa-navy)}.unified-section>p{margin:0 0 13px;color:var(--muted);font-size:.79rem}
      .unified-act-list,.unified-source-list,.unified-candidate-list{display:grid;gap:9px}
      .unified-act,.unified-source,.unified-candidate{padding:13px 14px;border:1px solid var(--line);border-radius:11px;background:#fff}
      .unified-act-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.unified-act-head strong{color:var(--transsa-navy);font-size:.84rem}.unified-act-type{flex:0 0 auto;padding:5px 7px;border-radius:7px;background:var(--transsa-pale);color:var(--transsa-blue);font-size:.67rem;font-weight:700}
      .unified-act-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.unified-act-meta span{padding:4px 7px;border-radius:7px;background:var(--surface-soft);color:var(--muted);font-size:.67rem}.unified-act a,.unified-source a{display:inline-block;margin-top:9px;color:var(--transsa-blue);font-size:.72rem;font-weight:600}
      .unified-source{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.unified-source small{display:block;margin-top:3px;color:var(--muted);font-size:.69rem}
      .unified-path{margin-top:8px;padding:9px 10px;border-radius:8px;background:#f7f7fb;color:#50536b;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.69rem;overflow-wrap:anywhere}
      .unified-candidate{border-style:dashed}.unified-candidate strong{color:#735110}.unified-candidate p{margin:5px 0 0;color:var(--muted);font-size:.73rem}
      .vigencia-card-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;text-align:left}.vigencia-card-summary-grid span{min-width:0;padding:7px 8px;border:1px solid var(--line);border-radius:8px;background:#fff}.vigencia-card-summary-grid small,.vigencia-card-summary-grid strong{display:block;overflow-wrap:anywhere}.vigencia-card-summary-grid small{color:var(--muted);font-size:.58rem;text-transform:uppercase;letter-spacing:.03em}.vigencia-card-summary-grid strong{margin-top:3px;color:var(--transsa-navy);font-size:.67rem;line-height:1.3}.vigencia-card-brief{margin:8px 0 0;color:var(--muted);font-size:.65rem;line-height:1.4;text-align:left}
      @media(max-width:900px){.unified-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.unified-detail-grid{grid-template-columns:1fr}.unified-source{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderMetrics() {
    const items = allItems();
    const ok = items.filter(item => item.estado_alerta === "Actualizado" || item.estado_alerta === "Probablemente actualizado").length;
    const review = items.filter(item => item.estado_alerta === "Revisión necesaria").length;
    const noMap = items.filter(item => item.estado_alerta === "Sin cartografía").length;
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set("vigenciaMetricTotal", items.length);
    set("vigenciaMetricOk", ok);
    set("vigenciaMetricReview", review);
    set("vigenciaMetricAlert", noMap);
    const downloads = document.getElementById("vigenciaDownloads");
    if (downloads) downloads.innerHTML = `<span class="unified-source-badge">Fuente única · Seguimiento nacional</span>`;
  }

  function cardTemplate(item) {
    const statusClass = typeof vigenciaStatusClass === "function" ? vigenciaStatusClass(item.estado_alerta) : "revision";
    const selected = vigenciaState.selectedId === item.id ? "selected" : "";
    const acts = Number(item.cantidad_actos || 0);
    const last = item.ultimo_acto_posterior || "Sin acto posterior";
    return `
      <button class="vigencia-instrument-card ${selected}" data-vigencia-id="${escapeAttribute(item.id)}">
        <div class="vigencia-card-heading">
          <span class="vigencia-status ${statusClass}"></span>
          <div><strong>${escapeHtml(item.comuna || "Territorio sin comuna")}</strong><span>${escapeHtml(item.region || "")}</span></div>
        </div>
        <div class="vigencia-card-body">
          <span class="vigencia-type-pill">${escapeHtml(item.tipo_ipt || "IPT")}</span>
          <p>${escapeHtml(item.nombre || "Instrumento base no identificado")}</p>
          <div class="vigencia-card-summary-grid">
            <span><small>Instrumento base</small><strong>${escapeHtml(item.fecha_instrumento_base || "No identificado")}</strong></span>
            <span><small>Último acto</small><strong>${escapeHtml(last)}</strong></span>
            <span><small>Actos asociados</small><strong>${acts}</strong></span>
            <span><small>Estado</small><strong>${escapeHtml(item.estado_alerta)}</strong></span>
          </div>
          <p class="vigencia-card-brief">${escapeHtml(item.resumen_alerta || "")}</p>
        </div>
        <div class="vigencia-card-footer">
          <span class="vigencia-alert-label ${statusClass}">${escapeHtml(item.estado_alerta || "Sin clasificación")}</span>
          <span>${acts} ${acts === 1 ? "acto asociado" : "actos asociados"}</span>
        </div>
      </button>`;
  }

  function uniqueSources(item) {
    const sourceMap = new Map();
    if (item.nombre) sourceMap.set(PORTAL_IPT, { name: "Portal IPT MINVU", url: PORTAL_IPT, detail: "Fuente del instrumento base identificado en el seguimiento nacional." });
    (item.actos_normativos || []).forEach(act => {
      const url = act.fuente || PORTAL_IPT;
      const key = url;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          name: act.origen || "Fuente oficial",
          url,
          detail: act.verificado_fuente ? "Fuente verificada por el proceso nacional." : "Fuente pendiente de validación."
        });
      }
    });
    return [...sourceMap.values()];
  }

  function actsTemplate(item) {
    const acts = item.actos_normativos || [];
    return `
      <section class="unified-section">
        <h4>Actos normativos posteriores</h4>
        <p>Esta lista y la línea de tiempo usan exactamente la misma fuente nacional. No existe un catálogo paralelo para esta ficha.</p>
        <div class="unified-act-list">
          ${acts.length ? acts.map(act => `
            <article class="unified-act">
              <div class="unified-act-head"><strong>${escapeHtml(act.titulo || "Acto normativo")}</strong><span class="unified-act-type">${escapeHtml(act.tipo_acto || act.tipo_ipt || "Acto")}</span></div>
              <div class="unified-act-meta">
                <span>${escapeHtml(act.fecha || "Sin fecha")}</span>
                <span>${escapeHtml(act.estado || "Sin estado")}</span>
                <span>${escapeHtml(act.origen || "Fuente sin identificar")}</span>
                ${act.verificado_fuente ? `<span>Fuente verificada</span>` : `<span>Pendiente de verificar</span>`}
              </div>
              ${act.fuente ? `<a href="${escapeAttribute(act.fuente)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial →</a>` : ""}
            </article>`).join("") : `<div class="unified-act">No se registran actos posteriores confirmados desde el instrumento base.</div>`}
        </div>
      </section>`;
  }

  function candidatesTemplate(item) {
    const candidates = item.candidatos_normativos || [];
    if (!candidates.length) return "";
    return `
      <section class="unified-section">
        <h4>Candidatos pendientes de validar</h4>
        <p>Se mantienen fuera de la línea de tiempo hasta contar con evidencia suficiente.</p>
        <div class="unified-candidate-list">${candidates.map(candidate => `
          <article class="unified-candidate"><strong>${escapeHtml(candidate.titulo || candidate.tipo_acto || "Candidato normativo")}</strong><p>${escapeHtml(candidate.motivo || candidate.estado || "Pendiente de validación")}</p></article>`).join("")}</div>
      </section>`;
  }

  function sourcesTemplate(item) {
    const sources = uniqueSources(item);
    return `
      <section class="unified-section">
        <h4>Procedencia y trazabilidad</h4>
        <p>Las fuentes mostradas provienen del mismo seguimiento nacional que alimenta los indicadores, actos y línea de tiempo.</p>
        <div class="unified-source-list">
          ${sources.map(source => `
            <article class="unified-source"><div><strong>${escapeHtml(source.name)}</strong><small>${escapeHtml(source.detail)}</small></div><a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente →</a></article>`).join("")}
        </div>
        ${item.archivo_recomendado ? `<div class="unified-path"><strong>Ruta SIG registrada:</strong> ${escapeHtml(item.archivo_recomendado)}${item.capa_recomendada ? ` · capa ${escapeHtml(item.capa_recomendada)}` : ""}</div>` : ""}
      </section>`;
  }

  async function communeIndex() {
    if (boundaryIndex.promise) return boundaryIndex.promise;
    const url = `${COMMUNES_SERVICE}/query?where=1%3D1&outFields=cut%2Ccomuna%2Cregion&returnGeometry=false&f=json`;
    boundaryIndex.promise = fetch(url)
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(payload => {
        (payload.features || []).forEach(feature => {
          const attrs = feature.attributes || {};
          const key = `${normalize(attrs.region)}|${normalize(attrs.comuna)}`;
          boundaryIndex.byKey.set(key, attrs);
          boundaryIndex.byKey.set(normalize(attrs.comuna), attrs);
        });
        return boundaryIndex.byKey;
      })
      .catch(error => {
        console.warn("No se pudo cargar el índice comunal MINVU:", error);
        return boundaryIndex.byKey;
      });
    return boundaryIndex.promise;
  }

  async function communeGeometry(item) {
    const key = `${normalize(item.region)}|${normalize(item.comuna)}`;
    if (boundaryIndex.geometry.has(key)) return boundaryIndex.geometry.get(key);
    await communeIndex();
    const attrs = boundaryIndex.byKey.get(key) || boundaryIndex.byKey.get(normalize(item.comuna));
    if (!attrs?.cut) return null;
    const where = encodeURIComponent(`cut='${String(attrs.cut).replaceAll("'", "''")}'`);
    const url = `${COMMUNES_SERVICE}/query?where=${where}&outFields=cut%2Ccomuna%2Cregion&returnGeometry=true&outSR=4326&f=geojson`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const geojson = await response.json();
      boundaryIndex.geometry.set(key, geojson);
      return geojson;
    } catch (error) {
      console.warn("No se pudo cargar el límite comunal:", item.comuna, error);
      return null;
    }
  }

  async function renderUnifiedMap(item) {
    const container = document.getElementById("vigenciaComparisonMap");
    const notice = document.getElementById("vigenciaMapNotice");
    if (!container || typeof L === "undefined") return;

    if (vigenciaMap) vigenciaMap.remove();
    vigenciaMap = L.map(container, { zoomControl: true, scrollWheelZoom: false, minZoom: 3, maxZoom: 16, preferCanvas: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(vigenciaMap);
    vigenciaBaseLayer = L.layerGroup().addTo(vigenciaMap);
    vigenciaOverlayLayer = L.layerGroup().addTo(vigenciaMap);

    const geometry = await communeGeometry(item);
    if (geometry?.features?.length) {
      const layer = L.geoJSON(geometry, { style: () => ({ weight: 2, fillOpacity: 0.08 }) }).addTo(vigenciaBaseLayer);
      if (layer.getBounds().isValid()) vigenciaMap.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 12 });
      if (notice) notice.textContent = item.archivo_recomendado
        ? "Se muestra el límite comunal oficial MINVU. La ruta SIG interna está registrada como evidencia, pero no se intenta abrir archivos locales desde GitHub Pages."
        : "Se muestra el límite comunal oficial MINVU. No existe una ruta SIG vinculada con suficiente confianza en el seguimiento nacional.";
    } else {
      const center = REGION_CENTERS?.[normalizeRegionName(item.region)] || [-35.6, -71.5];
      vigenciaMap.setView(center, item.comuna ? 7 : 5);
      if (notice) notice.textContent = "No fue posible recuperar el límite comunal oficial en esta carga.";
    }
    requestAnimationFrame(() => vigenciaMap?.invalidateSize({ pan: false }));
    setTimeout(() => vigenciaMap?.invalidateSize({ pan: false }), 250);
  }

  function renderDetail() {
    const item = allItems().find(instrument => instrument.id === vigenciaState.selectedId);
    const host = document.getElementById("vigenciaDetail");
    if (!host) return;
    if (!item) {
      host.className = "vigencia-detail-empty";
      host.innerHTML = `<div class="vigencia-empty-symbol">↗</div><h3>Selecciona una comuna</h3><p>Aquí se mostrará el instrumento base, todos sus actos posteriores y su trazabilidad nacional.</p>`;
      return;
    }

    const statusClass = vigenciaStatusClass(item.estado_alerta);
    const timeline = item.linea_tiempo || [];
    host.className = "vigencia-detail-content";
    host.innerHTML = `
      <div class="vigencia-detail-header">
        <div><div class="vigencia-title-row"><span class="vigencia-status large ${statusClass}"></span><div><p class="eyebrow">${escapeHtml(item.tipo_ipt || "IPT")}</p><h3>${escapeHtml(item.comuna || "Territorio sin comuna")}</h3></div></div><p class="vigencia-instrument-name">${escapeHtml(item.nombre || "Instrumento base no identificado")}</p></div>
        <div class="vigencia-alert-box ${statusClass}"><strong>${escapeHtml(item.estado_alerta)}</strong><span>Confianza ${escapeHtml(item.confianza)}</span></div>
      </div>
      <p class="vigencia-summary-text">${escapeHtml(item.resumen_alerta || "")}</p>
      <div class="unified-detail-grid">
        <div><span>Instrumento base</span><strong>${escapeHtml(item.fecha_instrumento_base || "No identificado")}</strong></div>
        <div><span>Actos asociados</span><strong>${Number(item.cantidad_actos || 0)}</strong></div>
        <div><span>Último acto</span><strong>${escapeHtml(item.ultimo_acto_posterior || "Sin acto posterior")}</strong></div>
        <div><span>Revisión normativa</span><strong>${escapeHtml(item.ultima_revision_normativa || "Sin fecha")}</strong></div>
        <div><span>Estado fuente</span><strong>${escapeHtml(item.estado_fuente || "Sin clasificación")}</strong></div>
        <div><span>Auditoría</span><strong>${escapeHtml(item.estado_auditoria || "Sin estado")}</strong></div>
        <div><span>Versión normativa</span><strong>${escapeHtml(item.version_normativa_id || "No certificada")}</strong></div>
        <div><span>Sincronización</span><strong>${escapeHtml(item.estado_sincronizacion_normativa || "Sin estado")}</strong></div>
      </div>
      <section class="vigencia-map-section"><div class="section-heading compact"><div><p class="eyebrow">CONTROL TERRITORIAL</p><h3>Límite comunal y evidencia SIG</h3></div><span class="unified-source-badge">MINVU + seguimiento nacional</span></div><div id="vigenciaComparisonMap" class="vigencia-comparison-map"></div><p id="vigenciaMapNotice" class="vigencia-map-notice"></p></section>
      <section class="timeline-section"><div class="section-heading compact"><div><p class="eyebrow">LÍNEA DE TIEMPO</p><h3>Instrumento base y actos posteriores</h3></div><span class="result-count">${timeline.length} hitos</span></div><div class="timeline">${timeline.length ? timeline.map(timelineTemplate).join("") : `<div class="empty-state"><p>No hay hitos normativos disponibles.</p></div>`}</div></section>
      ${actsTemplate(item)}
      ${candidatesTemplate(item)}
      ${sourcesTemplate(item)}
      <p class="vigencia-notes">${escapeHtml(item.notas)}</p>`;

    renderUnifiedMap(item);
  }

  function syncCompatibilityObject() {
    const items = allItems();
    window.VIGENCIA_CARTOGRAFICA = {
      fecha_generacion: new Date().toISOString(),
      fuente: "SEGUIMIENTO_NORMATIVO",
      resumen: {
        instrumentos: items.length,
        actualizados: items.filter(item => item.estado_alerta === "Actualizado").length,
        probablemente_actualizados: items.filter(item => item.estado_alerta === "Probablemente actualizado").length,
        revision_necesaria: items.filter(item => item.estado_alerta === "Revisión necesaria").length,
        desactualizados: items.filter(item => item.estado_alerta === "Desactualizado").length,
        sin_cartografia: items.filter(item => item.estado_alerta === "Sin cartografía").length,
        actos_asociados: items.reduce((sum, item) => sum + Number(item.cantidad_actos || 0), 0)
      },
      instrumentos: items,
      word_url: "",
      csv_url: ""
    };
  }

  function install() {
    injectStyles();
    if (!sourceRows().length) {
      console.error("La vista unificada de vigencia requiere window.SEGUIMIENTO_NORMATIVO.");
      return;
    }

    vigenciaInstruments = allItems;
    vigenciaCardTemplate = cardTemplate;
    renderVigenciaMetrics = renderMetrics;
    renderVigenciaDetail = renderDetail;
    renderVigenciaMap = renderUnifiedMap;
    syncCompatibilityObject();
    window.VIGENCIA_SOURCE_MODE = "seguimiento_nacional_unificado";
    window.renderVigenciaUnified = () => {
      syncCompatibilityObject();
      if (typeof renderVigencia === "function") renderVigencia();
    };
    window.renderVigenciaUnified();
  }

  install();
})();
