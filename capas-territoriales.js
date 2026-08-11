(() => {
  "use strict";

  const state = { commune: "Coquimbo", search: "", coverage: "" };
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const layersSource = () => window.CAPAS_TERRITORIALES || { capas: [] };
  const coverageSource = () => window.COBERTURA_CAPAS_COMUNAL || { capas: {} };
  const crossSource = () => window.COBERTURA_CAPAS_RESULTADOS || { capas: {} };
  const externalSource = () => window.FUENTES_CAPAS_EXTERNAS || { capas: {}, adicionales: [] };
  const operationalSource = () => window.ESTADO_OPERATIVO_DATOS || { comunas: {}, capas: {} };
  const communeSource = () => window.SEGUIMIENTO_NORMATIVO?.comunas || [];
  const iptSource = () => window.VIGENCIA_CARTOGRAFICA?.instrumentos || [];
  const territorialLayers = () => layersSource().capas.filter(layer => normalize(layer.nombre) !== normalize("Planes Reguladores Comunales"));

  function communeRows() {
    const rows = communeSource();
    if (rows.length) return rows.map(row => ({ comuna: row.comuna, region: row.region }));
    return iptSource().map(row => ({ comuna: row.comuna, region: row.region }));
  }

  function selectedCommune() {
    const wanted = normalize(state.commune);
    return communeRows().find(row => normalize(row.comuna) === wanted) || { comuna: state.commune, region: "" };
  }

  function selectedIptGroup() {
    const commune = selectedCommune();
    return iptSource().find(row => normalize(row.comuna) === normalize(commune.comuna)
      && (!commune.region || normalize(row.region) === normalize(commune.region))) || null;
  }

  function populateCommunes() {
    const select = $("capasCommuneSelect");
    if (!select || select.options.length) return;
    const byRegion = new Map();
    communeRows().forEach(row => {
      if (!byRegion.has(row.region)) byRegion.set(row.region, []);
      byRegion.get(row.region).push(row.comuna);
    });
    [...byRegion.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .forEach(([region, communes]) => {
        const group = document.createElement("optgroup");
        group.label = region;
        [...new Set(communes)].sort((a, b) => a.localeCompare(b, "es")).forEach(commune => {
          const option = document.createElement("option");
          option.value = commune;
          option.textContent = commune;
          option.selected = normalize(commune) === normalize(state.commune);
          group.appendChild(option);
        });
        select.appendChild(group);
      });
  }

  function latestByType(instruments) {
    const latest = new Map();
    instruments.forEach(item => {
      const current = latest.get(item.tipo_ipt);
      if (!current || String(item.fecha || "").localeCompare(String(current.fecha || "")) > 0) latest.set(item.tipo_ipt, item);
    });
    return latest;
  }

  const productionLabels = {
    pendiente: "Pendiente",
    en_desarrollo: "En desarrollo",
    listo: "Listo",
    en_plataforma: "En la plataforma",
  };
  const qaLabels = {
    aprobado: "QA aprobado",
    observaciones: "QA con observaciones",
    pendiente: "QA pendiente",
  };
  const cartographyLabels = {
    encontrada: "Encontrada",
    otra_version: "De otra versión",
    no_verificada: "No verificada",
    no_acreditada: "No acreditada",
    fuente_nacional: "Fuente nacional identificada",
    archivo_procesado: "Archivo procesado",
    referencia_identificada: "Referencia de archivo",
    referencia_incompleta: "Archivo incompleto",
    sin_archivo: "Sin archivo",
    formato_no_espacial: "Formato no espacial",
    fuente_localizada: "Fuente oficial localizada",
    fuente_observada: "Fuente con observaciones",
    fuente_descentralizada: "Fuente normativa por comuna",
    fuente_interna: "Requiere fuente interna",
  };

  function communeAuditRow() {
    const commune = selectedCommune();
    return communeSource().find(row => normalize(row.comuna) === normalize(commune.comuna)
      && (!commune.region || normalize(row.region) === normalize(commune.region))) || null;
  }

  function communeOperationalOverride() {
    const commune = selectedCommune();
    return operationalSource().comunas?.[`${commune.region}|${commune.comuna}`] || {};
  }

  function inferredQa(row, override) {
    if (override.qa) return override.qa;
    if (Number.isFinite(row?.controles_totales) && Number.isFinite(row?.controles_pendientes)) {
      if (row.controles_pendientes === 0 && row.controles_totales > 0) return "aprobado";
      return "observaciones";
    }
    return "pendiente";
  }

  function instrumentOperational(instrument, isLatest) {
    const row = communeAuditRow();
    const override = communeOperationalOverride();
    const isPrincipalPrc = instrument.tipo_ipt === "PRC" && isLatest;
    const hasReferencedCartography = Boolean(row?.archivo_recomendado || row?.capa_recomendada);
    const sameVersion = hasReferencedCartography && row?.prc_fecha === instrument.fecha;
    const cartography = sameVersion ? "encontrada" : hasReferencedCartography && instrument.tipo_ipt === "PRC" ? "otra_version" : "no_verificada";
    const production = isPrincipalPrc ? override.estado_produccion || "pendiente" : "pendiente";
    const qa = isPrincipalPrc ? inferredQa(row, override) : "pendiente";
    const stateWarning = ["listo", "en_plataforma"].includes(production) && qa !== "aprobado"
      ? " Estado incompatible: requiere QA aprobado."
      : "";
    return {
      cartography,
      cartographyDetail: sameVersion
        ? [row.capa_recomendada, row.archivo_recomendado].filter(Boolean).join(" · ")
        : cartography === "otra_version" ? `El archivo registrado corresponde al PRC ${row.prc_fecha || "sin fecha"}.` : "No hay archivo o servicio vinculado a esta versión.",
      production,
      productionDetail: `${isPrincipalPrc && override.fecha_estado ? `${override.fecha_estado} · ${override.responsable || "sin responsable"}` : "Estado pendiente de actualización por el equipo."}${stateWarning}`,
      qa,
      qaDetail: isPrincipalPrc && Number.isFinite(row?.controles_pendientes)
        ? `${row.controles_pendientes} de ${row.controles_totales} controles pendientes · último QA ${override.fecha_qa || row.ultima_revision || "sin fecha"}.`
        : isPrincipalPrc && override.fecha_qa ? `Cierre ${override.fecha_qa}.` : "Sin cierre de QA registrado para este instrumento.",
    };
  }

  function iptCard(instrument, latest) {
    const isLatest = latest.get(instrument.tipo_ipt) === instrument;
    const operational = instrumentOperational(instrument, isLatest);
    return `
      <article class="capas-ipt-card ${isLatest ? "latest" : "historical"}">
        <div><span class="capas-ipt-type">${escape(instrument.tipo_ipt || "IPT")}</span><span class="capas-ipt-state">${isLatest ? "Último registrado" : "Versión anterior"}</span></div>
        <h4>${escape(instrument.nombre || "Instrumento sin nombre")}</h4>
        <dl><div><dt>Escala</dt><dd>${escape(instrument.nivel_planificacion || "Sin dato")}</dd></div><div><dt>Fecha normativa</dt><dd>${escape(instrument.fecha || "Sin fecha")}</dd></div></dl>
        <div class="capas-operational-grid">
          <div><span>Normativa</span><strong class="capas-status-pill identified">Identificada</strong><small>Registro Portal IPT ${escape(instrument.registro || "")}</small></div>
          <div><span>Cartografía</span><strong class="capas-status-pill ${escape(operational.cartography)}">${escape(cartographyLabels[operational.cartography])}</strong><small>${escape(operational.cartographyDetail)}</small></div>
          <div><span>Estado del equipo</span><strong class="capas-status-pill ${escape(operational.production)}">${escape(productionLabels[operational.production])}</strong><small>${escape(operational.productionDetail)}</small></div>
          <div><span>Control de calidad</span><strong class="capas-status-pill ${escape(operational.qa)}">${escape(qaLabels[operational.qa])}</strong><small>${escape(operational.qaDetail)}</small></div>
        </div>
        <a href="${escape(instrument.fuente || "https://portalipt.minvu.cl/instrumentos")}" target="_blank" rel="noopener noreferrer">Abrir Portal IPT ↗</a>
      </article>`;
  }

  function renderIpt() {
    const group = selectedIptGroup();
    const instruments = group?.instrumentos || [];
    const latest = latestByType(instruments);
    $("capasIptGrid").innerHTML = instruments
      .slice()
      .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
      .map(item => iptCard(item, latest)).join("");
    $("capasIptEmpty").hidden = instruments.length > 0;
    $("capasIptGrid").hidden = instruments.length === 0;
    $("capasIptCount").textContent = `${instruments.length} ${instruments.length === 1 ? "registro" : "registros"} · ${latest.size} ${latest.size === 1 ? "tipo" : "tipos"}`;
    return { instruments, latest };
  }

  function territorialCoverage(layer, commune) {
    const meta = coverageSource().capas[layer.nombre] || { modo: "por_confirmar", fecha_dato: "Sin fecha del dato", detalle: "La ficha no declara cobertura comunal." };
    const sourceMeta = coverageSource().fuentes?.[layer.nombre] || { estado: "sin_archivo", archivos: [] };
    const external = externalSource().capas?.[layer.nombre];
    const crossLayer = crossSource().capas?.[layer.nombre];
    const key = `${commune.region}|${commune.comuna}`;
    const cross = crossLayer?.comunas?.[key];
    const regionMatch = (meta.regiones || []).some(region => normalize(region) === normalize(commune.region));
    const communeMatch = (meta.comunas || []).some(name => normalize(name) === normalize(commune.comuna));
    let result;
    if (meta.modo === "proceso" || sourceMeta.estado === "no_es_capa") {
      result = { state: "proceso", label: "Proceso, no capa consumible", detail: meta.detalle };
    } else if (meta.modo === "region_exclusiva_por_confirmar" && !regionMatch) {
      result = { state: "no_aplica", label: "Fuera del ámbito territorial", detail: `La ficha restringe la capa a ${(meta.regiones || []).join(", ")}.` };
    } else if (cross?.estado === "con_cobertura") {
      result = {
        state: "confirmada",
        label: `Cobertura confirmada · ${cross.elementos} ${cross.elementos === 1 ? "elemento" : "elementos"}`,
        detail: `Cruce geométrico ejecutado. Código comunal ${cross.codigo_comuna || "sin dato"}.`,
      };
    } else if (cross?.estado === "sin_elementos") {
      result = { state: "sin_elementos", label: "Sin elementos en la comuna", detail: "El archivo fue procesado y la intersección válida dio cero elementos." };
    } else if (cross?.estado === "sin_limite_comunal") {
      result = { state: "bloqueada", label: "Cruce bloqueado · falta límite comunal", detail: "La matriz incluye la comuna, pero el GeoPackage base no contiene su geometría." };
    } else if (crossLayer?.estado === "error") {
      result = { state: "error", label: "Error de cruce", detail: crossLayer.motivo || "La capa no pudo procesarse." };
    } else if (external?.estado === "localizada" && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)) {
      result = { state: "pendiente", label: "Cruce pendiente · fuente localizada", detail: `${external.organismo}. Falta descargar o consultar la fuente, normalizarla y ejecutar la intersección.` };
    } else if (external?.estado === "localizada_observada" && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)) {
      result = { state: "bloqueada", label: "Fuente localizada · requiere revisión", detail: external.nota };
    } else if (external?.estado === "descentralizada" && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)) {
      result = { state: "bloqueada", label: "Revisión normativa por comuna", detail: external.nota };
    } else if (external?.estado === "interna" && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)) {
      result = { state: "bloqueada", label: "Cruce bloqueado · requiere base interna", detail: external.nota };
    } else if (["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)) {
      const reason = sourceMeta.estado === "sin_archivo" ? "La ficha no contiene un archivo espacial recuperable."
        : sourceMeta.estado === "referencia_incompleta" ? (sourceMeta.detalle || "La referencia no reúne todos los componentes necesarios.")
          : "El adjunto identificado no es una capa espacial consumible.";
      result = { state: "bloqueada", label: "Cruce bloqueado · falta fuente válida", detail: reason };
    } else {
      const files = (sourceMeta.archivos || []).join(" · ");
      result = {
        state: "bloqueada",
        label: "Cruce bloqueado · archivo no materializado",
        detail: files ? `Notion referencia ${files}, pero el archivo aún no está disponible para ejecutar la intersección.` : "Falta materializar el archivo vigente.",
      };
    }
    const documentaryScope = meta.modo === "nacional_declarada" ? "Alcance documental nacional; no confirma presencia comunal."
      : meta.modo === "comunas_declaradas" && communeMatch ? "La ficha nombra la comuna; falta prueba geométrica."
        : meta.modo === "regiones_y_comunas" && (regionMatch || communeMatch) ? "La ficha incluye el ámbito; falta prueba geométrica."
          : "";
    return { ...result, documentaryScope, dataDate: result.dataDate || meta.fecha_dato || "Sin fecha del dato", dateLabel: meta.fecha_etiqueta || "Fecha del dato" };
  }

  function coverageRow(layer, result) {
    const categories = layer.categorias?.length ? layer.categorias.join(" · ") : "Sin categoría";
    const override = operationalSource().capas?.[layer.nombre] || {};
    const sourceMeta = coverageSource().fuentes?.[layer.nombre] || { estado: "sin_archivo", archivos: [] };
    const external = externalSource().capas?.[layer.nombre];
    const crossLayer = crossSource().capas?.[layer.nombre];
    const cartography = crossLayer?.estado === "procesada" ? "archivo_procesado"
      : sourceMeta.estado === "no_es_capa" ? "no_acreditada"
        : external && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)
          ? external.estado === "localizada" ? "fuente_localizada"
            : external.estado === "localizada_observada" ? "fuente_observada"
              : external.estado === "descentralizada" ? "fuente_descentralizada" : "fuente_interna"
          : sourceMeta.estado;
    const sourceFiles = crossLayer?.fuentes?.map(item => item.archivo).join(" · ")
      || (sourceMeta.archivos || []).join(" · ")
      || (external ? `${external.organismo} · ${external.acceso}` : "")
      || sourceMeta.detalle || "La ficha no aporta un archivo espacial.";
    const production = override.estado_produccion || "pendiente";
    const qa = override.qa || "pendiente";
    return `
      <tr>
        <td><span class="capas-table-category">${escape(categories)}</span><strong>${escape(layer.nombre)}</strong><small>${escape(layer.owner || "Sin responsable")}</small></td>
        <td><span class="capas-coverage-pill ${escape(result.state)}">${escape(result.label)}</span><small>${escape(result.detail)}</small>${result.documentaryScope ? `<small class="capas-documentary-note">${escape(result.documentaryScope)}</small>` : ""}</td>
        <td><span class="capas-status-pill ${escape(cartography)}">${escape(cartographyLabels[cartography] || "Sin archivo")}</span><small>${escape(sourceFiles)}</small>${external?.fecha_fuente ? `<small>Fecha/referencia: ${escape(external.fecha_fuente)}</small>` : ""}${external?.url ? `<a href="${escape(external.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ${escape(external.nivel)} ↗</a>` : ""}</td>
        <td><span class="capas-status-pill ${escape(production)}">${escape(productionLabels[production])}</span><small>${escape(override.fecha_estado || "Sin actualización del equipo")}</small></td>
        <td><span class="capas-status-pill ${escape(qa)}">${escape(qaLabels[qa])}</span><small>${escape(override.fecha_qa || `Catálogo: ${layer.verificacion || "sin verificar"}`)}</small></td>
        <td><strong>${escape(result.dataDate)}</strong><small>${escape(result.dateLabel)}</small></td>
        <td><strong>${escape(layer.ultima_edicion || "Sin fecha")}</strong><small>Última edición de la ficha</small><a href="${escape(layer.url)}" target="_blank" rel="noopener noreferrer">Ver evidencia en Notion ↗</a></td>
      </tr>`;
  }

  function filteredTerritorial() {
    const commune = selectedCommune();
    const query = normalize(state.search);
    return territorialLayers().map(layer => ({ layer, result: territorialCoverage(layer, commune) }))
      .filter(item => !state.coverage || item.result.state === state.coverage)
      .filter(item => !query || normalize([item.layer.nombre, ...(item.layer.categorias || []), item.layer.owner, externalSource().capas?.[item.layer.nombre]?.organismo].join(" ")).includes(query));
  }

  function renderTerritorial() {
    const all = territorialLayers().map(layer => ({ layer, result: territorialCoverage(layer, selectedCommune()) }));
    const rows = filteredTerritorial();
    $("capasCoverageBody").innerHTML = rows.map(item => coverageRow(item.layer, item.result)).join("");
    $("capasTerritorialCount").textContent = `${rows.length} de ${all.length} capas`;
    $("capasCoverageEmpty").hidden = rows.length > 0;
    $("capasCoverageBody").closest(".capas-table-scroll").hidden = rows.length === 0;
    return all;
  }

  function renderMetrics(ipt, territorial) {
    const types = [...ipt.latest.keys()].sort((a, b) => a.localeCompare(b, "es"));
    $("capasMetricIpt").textContent = ipt.instruments.length;
    $("capasMetricIptTypes").textContent = types.length ? types.join(" · ") : "Sin registros";
    $("capasMetricCovered").textContent = territorial.filter(item => item.result.state === "confirmada").length;
    $("capasMetricPending").textContent = territorial.filter(item => ["bloqueada", "pendiente", "error"].includes(item.result.state)).length;
    $("capasMetricNotApplicable").textContent = territorial.filter(item => ["sin_elementos", "no_aplica", "proceso"].includes(item.result.state)).length;
  }

  function renderCrossBanner() {
    const source = crossSource();
    const processed = Object.values(source.capas || {}).filter(layer => layer.estado === "procesada").length;
    const execution = coverageSource().ejecucion || {};
    if (source.generado_en && source.limite_comunal) {
      $("capasCrossBannerTitle").textContent = `Matriz nacional ejecutada · ${processed} capas`;
      $("capasCrossBannerText").textContent = `Cruce para ${source.limite_comunal.comunas_objetivo || 0} comunas (${source.limite_comunal.geometrias_comunales || 0} con geometría). Fuente comunal: ${source.limite_comunal.archivo || "sin dato"}. Cada archivo procesado conserva su huella SHA-256.`;
      return;
    }
    const located = territorialLayers().filter(layer => {
      const state = externalSource().capas?.[layer.nombre]?.estado;
      return state === "localizada" || state === "localizada_observada";
    }).length;
    $("capasCrossBannerTitle").textContent = `Adquisición en curso · ${located} fuentes externas localizadas · 0 de ${territorialLayers().length} capas cruzadas`;
    $("capasCrossBannerText").textContent = `${execution.motivo || "Falta materializar los archivos espaciales."} “Fuente localizada” todavía no significa cobertura confirmada: falta descarga, control de versión, geometría, CRS y cruce comunal.`;
  }

  function renderCandidates() {
    const rows = externalSource().adicionales || [];
    const host = $("capasCandidateGrid");
    if (!host) return;
    host.innerHTML = rows.map(item => `
      <article class="capas-candidate-card">
        <div><span class="capas-candidate-priority ${escape(item.prioridad)}">Prioridad ${escape(item.prioridad)}</span><span class="capas-candidate-level">${escape(item.nivel)}</span></div>
        <h4>${escape(item.nombre)}</h4>
        <p>${escape(item.valor)}</p>
        <dl><div><dt>Fuente</dt><dd>${escape(item.fuente)}</dd></div><div><dt>Cobertura</dt><dd>${escape(item.cobertura)}</dd></div><div><dt>Actualización</dt><dd>${escape(item.actualizacion)}</dd></div><div><dt>Adquisición</dt><dd>${item.automatizable ? "Automatizable" : "Revisión manual"}</dd></div></dl>
        <a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">Revisar fuente ↗</a>
      </article>`).join("");
    $("capasCandidateCount").textContent = `${rows.length} candidatas`;
  }

  function render() {
    const commune = selectedCommune();
    state.commune = commune.comuna;
    $("capasSelectedTitle").textContent = `Cobertura de ${commune.comuna}`;
    const ipt = renderIpt();
    const territorial = renderTerritorial();
    renderMetrics(ipt, territorial);
    renderCrossBanner();
    renderCandidates();
  }

  function bind() {
    $("capasCommuneSelect")?.addEventListener("change", event => { state.commune = event.target.value; render(); });
    $("capasSearch")?.addEventListener("input", event => { state.search = event.target.value; renderTerritorial(); });
    $("capasCoverageFilter")?.addEventListener("change", event => { state.coverage = event.target.value; renderTerritorial(); });
  }

  window.renderCapasTerritoriales = function renderCapasTerritoriales() {
    populateCommunes();
    render();
  };

  bind();
  window.renderCapasTerritoriales();
})();
