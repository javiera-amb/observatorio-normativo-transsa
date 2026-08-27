(() => {
  "use strict";

  const state = { commune: "Coquimbo", search: "", coverage: "", category: "", sort: "categoria", regionSearch: "", regionSort: "nombre" };
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
  const initialSource = () => window.AVANCE_BASES_DATOS || { comunas: {} };
  const versionedTeamSource = () => window.ESTADO_EQUIPO_VERSIONADO || { comunas: {} };
  const prcInventory = () => window.INVENTARIO_PRC_ONEDRIVE || { comunas: {} };
  const communeSource = () => window.SEGUIMIENTO_NORMATIVO?.comunas || [];
  const iptSource = () => window.VIGENCIA_CARTOGRAFICA?.instrumentos || [];
  const rawCatalogLayers = () => (layersSource().capas || []).filter(Boolean);
  const QA_STORAGE_KEY = "tui-capas-qa-javiera-v1";
  const javieraMode = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("vista") === "equipo" && params.get("panel") === "javiera";
  };
  const loadLayerQa = () => {
    try { return JSON.parse(localStorage.getItem(QA_STORAGE_KEY) || "{}"); }
    catch (_error) { return {}; }
  };
  const saveLayerQa = records => localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(records));
  const layerQaKey = layer => normalize(layer.nombre);
  const standardizedCategory = layer => {
    const text = normalize(`${layer.nombre} ${(layer.categorias || []).join(" ")}`);
    if (/(^| )(prc|prm|prms|pri|prdu|ps|lu)( |$)|plan regulador|plan seccional|limite urbano|instrumento de planificacion/.test(text)) return "Instrumentos de planificación territorial";
    if (/division politico|limite|comuna|region/.test(text)) return "Límites y escalas";
    if (/predio|catastro|area homogenea|scraping ah|suelo/.test(text)) return "Suelo y propiedad";
    if (/(^| )metro( |$)|transporte|red vial|ferrea|paradero|embalse|caleta|antena/.test(text)) return "Movilidad e infraestructura";
    if (/establecimiento|educacion|pdi|bombero|carabinero|deportiva|junta vecinal|equipamiento|poi|supermercado/.test(text)) return "Equipamientos y servicios";
    if (/censo|demograf|barrio|campamento|area poblada|sector oficina|mercado/.test(text)) return "Demografía y mercado";
    if (/amenaza|riesgo|tsunami|volcan|protegida|sitio prioritario|ambiental/.test(text)) return "Riesgos y medio ambiente";
    if (/plan regulador|conservacion historica|normativa/.test(text)) return "Normativa territorial";
    return "Producción Transsa / por clasificar";
  };
  const candidateCategory = item => {
    const text = normalize(`${item.nombre} ${item.valor}`);
    if (/(^| )(prc|prm|prms|pri|prdu|ps|lu)( |$)|plan regulador|plan seccional|instrumento de planificacion/.test(text)) return "Instrumentos de planificación territorial";
    if (/riesgo|humedal|ambient|temperatura|ruido|proteg/.test(text)) return "Riesgos y medio ambiente";
    if (/(^| )metro( |$)|movilidad|transporte|ferrea|paradero|vial/.test(text)) return "Movilidad e infraestructura";
    if (/turis|parque|equipamiento|poi|supermercado/.test(text)) return "Equipamientos y servicios";
    if (/predio|suelo|catastr/.test(text)) return "Suelo y propiedad";
    return "Catálogo por incorporar";
  };
  const candidateLayers = () => {
    const existing = new Set(rawCatalogLayers().map(layer => normalize(layer.nombre)));
    return (externalSource().adicionales || [])
      .filter(item => item?.nombre && !existing.has(normalize(item.nombre)))
      .map(item => ({
        nombre: item.nombre,
        categorias: [candidateCategory(item)],
        owner: "Por asignar",
        verificacion: "fuente identificada",
        url: item.url,
        _candidate: item,
      }));
  };
  // El PRC del diccionario antiguo no se usa como fuente. Los IPT que aparecen
  // en la matriz se generan desde la auditoría normativa y el inventario TUI.
  const catalogLayers = () => [
    ...rawCatalogLayers()
      .filter(layer => normalize(layer.nombre) !== normalize("Planes Reguladores Comunales"))
      .map(layer => ({ ...layer, categorias: [standardizedCategory(layer)] })),
    ...candidateLayers(),
  ];
  const applicableIptLayers = () => {
    const group = selectedIptGroup();
    const instruments = group?.instrumentos || [];
    const latest = latestByType(instruments);
    return [...latest.values()].map(instrument => ({
      nombre: `${instrument.tipo_ipt || "IPT"} · ${instrument.nombre || "Instrumento vigente"}`,
      categorias: ["Instrumentos de planificación territorial"],
      owner: instrument.tipo_ipt === "PRC" ? "Base Transsa / producción SIG" : "Fuente oficial IPT",
      verificacion: "normativa identificada",
      url: instrument.fuente || "https://portalipt.minvu.cl/instrumentos",
      _ipt: instrument,
    }));
  };
  const territorialLayers = () => [...applicableIptLayers(), ...catalogLayers()];
  const metricLayers = () => catalogLayers();

  function nationalIptCatalog() {
    const byType = new Map();
    iptSource().forEach(group => {
      latestByType(group.instrumentos || []).forEach((instrument, type) => {
        if (!byType.has(type)) byType.set(type, { type, communes: new Set(), instruments: [] });
        const record = byType.get(type);
        record.communes.add(normalize(group.comuna));
        record.instruments.push(instrument);
      });
    });
    return [...byType.values()].map(record => ({
      nombre: record.type || "IPT",
      categorias: ["Instrumentos de planificación territorial"],
      owner: record.type === "PRC" ? "Base Transsa / producción SIG" : "Fuente oficial IPT",
      verificacion: "normativa identificada",
      _catalogCount: record.communes.size,
      _catalogDetail: `${record.communes.size} ${record.communes.size === 1 ? "comuna" : "comunas"} con ${record.type || "IPT"} identificado`,
    }));
  }

  function catalogReadiness(layer) {
    if (layer._catalogCount !== undefined) return "IPT auditado";
    if (layer._candidate) return "Fuente por incorporar";
    const cross = crossSource().capas?.[layer.nombre];
    if (cross?.estado === "procesada") return "Cruce ejecutado";
    const source = coverageSource().fuentes?.[layer.nombre];
    if (source?.estado && !["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(source.estado)) return "Archivo identificado";
    if (externalSource().capas?.[layer.nombre]) return "Fuente localizada";
    return "Fuente por acreditar";
  }

  function layerHasMaterializedFile(layer) {
    if (layer._catalogCount !== undefined) return true;
    if (layer._candidate) return false;
    const cross = crossSource().capas?.[layer.nombre];
    if (cross?.estado === "procesada") return true;
    const source = coverageSource().fuentes?.[layer.nombre];
    return Boolean(source?.estado && !["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(source.estado));
  }

  function catalogQaState(layer) {
    if (layer._catalogCount !== undefined) return { label: "IPT auditado", className: "qa-approved", file: true, audited: true };
    const file = layerHasMaterializedFile(layer);
    if (!file) return { label: "Capa no disponible", className: "qa-missing", file: false, audited: false };
    const record = loadLayerQa()[layerQaKey(layer)];
    if (record?.estado === "aprobado") return { label: "QA Javiera aprobado", className: "qa-approved", file: true, audited: true, record };
    if (normalize(layer.owner).includes("rene")) return { label: "Pendiente QA Javiera", className: "qa-pending", file: true, audited: false };
    return { label: catalogReadiness(layer), className: "qa-available", file: true, audited: false };
  }

  function exportLayerQa() {
    const records = loadLayerQa();
    const rows = [["capa", "estado", "fecha", "responsable"]];
    catalogLayers().forEach(layer => {
      const state = catalogQaState(layer);
      rows.push([
        layer.nombre,
        state.className === "qa-approved" ? "aprobado" : state.className === "qa-missing" ? "sin_capa" : "pendiente",
        records[layerQaKey(layer)]?.fecha || "",
        records[layerQaKey(layer)]?.usuario || "",
      ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `qa_capas_javiera_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderLayerCatalog() {
    const host = $("capasCatalogGrid");
    if (!host) return;
    const items = [...nationalIptCatalog(), ...catalogLayers()];
    const groups = new Map();
    items.forEach(layer => {
      const category = layer.categorias?.[0] || "Sin categoría";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(layer);
    });
    const order = [
      "Instrumentos de planificación territorial", "Límites y escalas", "Suelo y propiedad",
      "Movilidad e infraestructura", "Equipamientos y servicios", "Demografía y mercado",
      "Riesgos y medio ambiente", "Normativa territorial", "Producción Transsa / por clasificar",
      "Catálogo por incorporar",
    ];
    const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
      const rankA = order.indexOf(a) === -1 ? order.length : order.indexOf(a);
      const rankB = order.indexOf(b) === -1 ? order.length : order.indexOf(b);
      return rankA - rankB || a.localeCompare(b, "es");
    });
    host.innerHTML = sortedGroups.map(([category, layers]) => {
      const sorted = layers.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      const states = sorted.map(layer => catalogQaState(layer));
      const approved = states.filter(item => item.className === "qa-approved").length;
      const pending = states.filter(item => item.className === "qa-pending").length;
      const missing = states.filter(item => item.className === "qa-missing").length;
      return `<details class="capas-catalog-group"><summary><span><strong>${escape(category)}</strong><small>${sorted.length} ${sorted.length === 1 ? "capa o tipo" : "capas o tipos"}</small></span><span class="capas-catalog-summary">${approved} QA listo · ${pending} pendientes · ${missing} sin capa</span></summary><div class="capas-catalog-list">${sorted.map(layer => {
        const qa = catalogQaState(layer);
        const qaButton = javieraMode() && layer._catalogCount === undefined
          ? `<button type="button" class="capas-qa-button" data-layer-qa="${escape(layerQaKey(layer))}" ${qa.file ? "" : "disabled"}>${qa.audited ? "Reabrir QA" : qa.file ? "Marcar QA listo" : "Sin capa para auditar"}</button>`
          : "";
        return `<article class="${qa.className}"><div><strong>${escape(layer.nombre)}</strong><small>${escape(layer._catalogDetail || layer.owner || "Sin responsable")}</small>${qa.record?.fecha ? `<small>Revisada por Javiera · ${escape(qa.record.fecha.slice(0, 10))}</small>` : ""}</div><div class="capas-catalog-status"><span class="capas-catalog-readiness">${escape(qa.label)}</span>${qaButton}</div></article>`;
      }).join("")}<button type="button" class="capas-catalog-action" data-capas-category="${escape(category)}">Ver esta categoría en la comuna seleccionada</button></div></details>`;
    }).join("");
    if ($("capasCatalogCount")) $("capasCatalogCount").textContent = `${items.length} capas o tipos · ${sortedGroups.length} categorías`;
    if ($("capasQaExport")) $("capasQaExport").hidden = !javieraMode();
  }

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
      && (!commune.region
        || normalize(row.region) === normalize(commune.region)
        || normalize(row.region).includes(normalize(commune.region))
        || normalize(commune.region).includes(normalize(row.region)))) || null;
  }

  function sourceLineage(layer, external, candidate) {
    if (candidate) return `${candidate.fuente || "Fuente externa"} · ${candidate.automatizable ? "adquisición automatizable" : "adquisición con revisión manual"}`;
    const name = normalize(layer.nombre);
    if (/base predios|predios sii/.test(name)) return "Scraping público · corrección y consolidación Transsa";
    if (/scraping ah|areas homogeneas sii/.test(name)) return "Fuente pública SII · procesamiento Transsa";
    if (/barrios transsa/.test(name)) return "Metodología y procesamiento Transsa";
    if (external?.organismo) return `${external.organismo} · fuente externa ${external.nivel || "por validar"}`;
    return "Inventario inicial Notion · fuente espacial por acreditar";
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
    actualizado: "Actualizado",
    enviado: "Enviado",
    listo: "Actualizado",
    en_plataforma: "Enviado",
  };
  const qaLabels = {
    aprobado: "QA de capa aprobado",
    observaciones: "QA de capa con observaciones",
    pendiente: "QA de capa pendiente",
  };
  const iptQaLabels = {
    aprobado: "QA automático aprobado",
    observaciones: "QA automático con diferencias",
    pendiente: "QA automático pendiente",
  };
  const cartographyLabels = {
    encontrada: "Encontrada",
    observada_v1: "V1 observada · requiere TUI V2",
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

  function recordByCommune(records, commune) {
    const exact = records?.[`${commune.region}|${commune.comuna}`];
    if (exact) return exact;
    const match = Object.entries(records || {}).find(([key, record]) => normalize(record.comuna || key.split("|").at(-1)) === normalize(commune.comuna));
    return match?.[1] || {};
  }

  function communeOperationalOverride() {
    const commune = selectedCommune();
    const initial = recordByCommune(initialSource().comunas, commune).prc || {};
    const inventory = recordByCommune(prcInventory().comunas, commune);
    return {
      ...(initial.estado_produccion && initial.estado_produccion !== "enviado" ? { estado_produccion: initial.estado_produccion } : {}),
      ...(initial.estado_produccion === "enviado" ? { envio_historico_v1: true } : {}),
      ...(initial.responsable ? { responsable: initial.responsable } : {}),
      ...(inventory.estado_detectado && inventory.modelo_detectado === "tui_v2" ? { estado_produccion: inventory.estado_detectado } : {}),
      ...(inventory.ruta_relativa ? { evidencia: inventory.ruta_relativa } : {}),
      ...(inventory.modelo_detectado ? { modelo_prc: inventory.modelo_detectado } : {}),
      ...(inventory.qa_archivo ? { qa_archivo: inventory.qa_archivo } : {}),
      ...(versionedTeamSource().comunas?.[`${commune.region}|${commune.comuna}`] || {}),
      ...(operationalSource().comunas?.[`${commune.region}|${commune.comuna}`] || {}),
    };
  }

  function initialLayerOverride(layer) {
    const key = ({
      [normalize("Barrios Transsa")]: "barrios",
      [normalize("Áreas Homogéneas SII")]: "areas_homogeneas_2022",
      [normalize("Base predios")]: "predios",
    })[normalize(layer.nombre)];
    if (!key) return {};
    const record = recordByCommune(initialSource().comunas, selectedCommune()).capas?.[key] || {};
    return {
      ...(record.estado_equipo ? { estado_produccion: record.estado_equipo } : {}),
      ...(record.responsable ? { responsable: record.responsable } : {}),
    };
  }

  function inferredQa(row, override) {
    if (override.envio_historico_v1 && override.modelo_prc !== "tui_v2") return "observaciones";
    if (override.modelo_prc === "tui_v2" && override.qa_archivo?.estandar_tui_v2?.cumple_estructura !== true) return "observaciones";
    if (override.qa_plataforma) return override.qa_plataforma;
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
    const hasReferencedCartography = Boolean(override.evidencia || row?.archivo_recomendado || row?.capa_recomendada);
    const sameVersion = Boolean(override.evidencia) || (hasReferencedCartography && row?.prc_fecha === instrument.fecha);
    const requiresV2 = isPrincipalPrc && override.envio_historico_v1 && override.modelo_prc !== "tui_v2";
    const cartography = requiresV2 ? "observada_v1" : sameVersion ? "encontrada" : hasReferencedCartography && instrument.tipo_ipt === "PRC" ? "otra_version" : "no_verificada";
    const production = isPrincipalPrc ? override.estado_produccion || "pendiente" : "pendiente";
    const qa = isPrincipalPrc ? inferredQa(row, override) : "pendiente";
    const stateWarning = ["actualizado", "enviado", "listo", "en_plataforma"].includes(production) && qa !== "aprobado"
      ? " Estado incompatible: requiere QA aprobado."
      : "";
    return {
      cartography,
      cartographyDetail: requiresV2
        ? "La V1 fue enviada históricamente, pero su geometría fue subdividida por intersecciones de riesgo y no contiene la tabla normativa completa."
        : sameVersion
          ? [override.evidencia, row.capa_recomendada, row.archivo_recomendado].filter(Boolean).join(" · ")
        : cartography === "otra_version" ? `El archivo registrado corresponde al PRC ${row.prc_fecha || "sin fecha"}.` : "No hay archivo o servicio vinculado a esta versión.",
      production,
      productionDetail: `${requiresV2 ? "Reconstrucción TUI V2 pendiente; la V1 queda solo como antecedente." : isPrincipalPrc && override.fecha_estado ? `${override.fecha_estado} · ${override.responsable || "sin responsable"}` : "Estado pendiente de actualización por el equipo."}${stateWarning}`,
      qa,
      qaDetail: requiresV2
        ? "QA bloqueado hasta reconstruir la zonificación base, separar riesgos y vincular la tabla normativa separada."
        : isPrincipalPrc && Number.isFinite(row?.controles_pendientes)
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
          <div><span>QA automático de la plataforma</span><strong class="capas-status-pill ${escape(operational.qa)}">${escape(iptQaLabels[operational.qa])}</strong><small>${escape(operational.qaDetail)}</small></div>
        </div>
        <a href="${escape(instrument.fuente || "https://portalipt.minvu.cl/instrumentos")}" target="_blank" rel="noopener noreferrer">Abrir Portal IPT ↗</a>
      </article>`;
  }

  function renderIpt() {
    const group = selectedIptGroup();
    const instruments = group?.instrumentos || [];
    const latest = latestByType(instruments);
    if ($("capasIptGrid")) {
      $("capasIptGrid").innerHTML = instruments
        .slice()
        .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
        .map(item => iptCard(item, latest)).join("");
      $("capasIptGrid").hidden = instruments.length === 0;
    }
    if ($("capasIptEmpty")) $("capasIptEmpty").hidden = instruments.length > 0;
    if ($("capasIptCount")) $("capasIptCount").textContent = `${instruments.length} ${instruments.length === 1 ? "registro" : "registros"} · ${latest.size} ${latest.size === 1 ? "tipo" : "tipos"}`;
    return { instruments, latest };
  }

  function territorialCoverage(layer, commune) {
    if (layer._ipt) {
      const group = selectedIptGroup();
      const latest = latestByType(group?.instrumentos || []);
      const operational = instrumentOperational(layer._ipt, latest.get(layer._ipt.tipo_ipt) === layer._ipt);
      const hasCartography = ["encontrada", "observada_v1", "otra_version"].includes(operational.cartography);
      return {
        state: operational.cartography === "encontrada" ? "confirmada" : hasCartography ? "pendiente" : "bloqueada",
        label: operational.cartography === "encontrada" ? "Cartografía vinculada a la versión" : hasCartography ? "Cartografía localizada · requiere control" : "Normativa identificada · falta cartografía",
        detail: operational.cartographyDetail,
        dataDate: layer._ipt.fecha || "Sin fecha normativa",
        dateLabel: "Fecha normativa",
        operational,
      };
    }
    if (layer._candidate) {
      return {
        state: "pendiente",
        label: "Fuente identificada · adquisición pendiente",
        detail: `${layer._candidate.fuente || "Fuente externa"}. Debe materializarse, controlar licencia y versión, validar geometría y ejecutar el cruce comunal.`,
        dataDate: layer._candidate.actualizacion || "Sin fecha del dato",
        dateLabel: "Actualización declarada",
      };
    }
    const meta = coverageSource().capas[layer.nombre] || { modo: "por_confirmar", fecha_dato: "Sin fecha del dato", detalle: "La ficha no declara cobertura comunal." };
    const sourceMeta = coverageSource().fuentes?.[layer.nombre] || { estado: "sin_archivo", archivos: [] };
    const external = externalSource().capas?.[layer.nombre];
    const crossLayer = crossSource().capas?.[layer.nombre];
    const key = `${commune.region}|${commune.comuna}`;
    const cross = crossLayer?.comunas?.[key];
    const regionMatch = (meta.regiones || []).some(region => normalize(region) === normalize(commune.region));
    const communeMatch = (meta.comunas || []).some(name => normalize(name) === normalize(commune.comuna));
    let result;
    if (normalize(layer.nombre) === normalize("Planes Reguladores Comunales")) {
      const audit = communeSource().find(row => normalize(row.comuna) === normalize(commune.comuna)
        && (!commune.region || normalize(row.region) === normalize(commune.region)));
      if (audit?.archivo_recomendado || audit?.capa_recomendada) {
        result = { state: "pendiente", label: "Cruce pendiente · archivo PRC identificado", detail: `${audit.prc_nombre || "PRC vigente"}. Falta ejecutar el cruce del archivo de la base Transsa con el límite comunal.` };
      } else if (audit?.estado_fuente === "Sin PRC/LU vigente identificado") {
        result = { state: "no_aplica", label: "Sin PRC/LU identificado", detail: "La base normativa no identifica PRC o límite urbano comunal. Requiere verificación documental; no es una prueba de inexistencia." };
      } else {
        result = { state: "bloqueada", label: "Cruce bloqueado · falta archivo PRC", detail: "El PRC se controla con la base Transsa. Falta materializar el GeoPackage o shape vigente para cruzarlo." };
      }
    } else if (meta.modo === "proceso" || sourceMeta.estado === "no_es_capa") {
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
    if (layer._ipt) {
      const operational = result.operational || instrumentOperational(layer._ipt, true);
      return `
        <tr>
          <td data-label="Capa"><span class="capas-table-category">Instrumento de planificación territorial</span><strong>${escape(layer.nombre)}</strong><small>${escape(layer.owner)}</small><a href="${escape(layer.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial ↗</a></td>
          <td data-label="Cobertura en la comuna"><span class="capas-coverage-pill ${escape(result.state)}">${escape(result.label)}</span><small>${escape(result.detail)}</small></td>
          <td data-label="Fuente / archivo espacial"><span class="capas-status-pill ${escape(operational.cartography)}">${escape(cartographyLabels[operational.cartography])}</span><small>${escape(operational.cartographyDetail)}</small></td>
          <td data-label="Estado del equipo"><span class="capas-status-pill ${escape(operational.production)}">${escape(productionLabels[operational.production])}</span><small>${escape(operational.productionDetail)}</small></td>
          <td data-label="QA de la capa"><span class="capas-status-pill ${escape(operational.qa)}">${escape(iptQaLabels[operational.qa])}</span><small>${escape(operational.qaDetail)}</small></td>
          <td data-label="Fecha del dato"><strong>${escape(result.dataDate)}</strong><small>${escape(result.dateLabel)}</small></td>
        </tr>`;
    }
    const categories = layer.categorias?.length ? layer.categorias.join(" · ") : "Sin categoría";
    const override = { ...initialLayerOverride(layer), ...(operationalSource().capas?.[layer.nombre] || {}) };
    const sourceMeta = coverageSource().fuentes?.[layer.nombre] || { estado: "sin_archivo", archivos: [] };
    const external = externalSource().capas?.[layer.nombre];
    const candidate = layer._candidate;
    const crossLayer = crossSource().capas?.[layer.nombre];
    const cartography = candidate ? "fuente_localizada"
      : crossLayer?.estado === "procesada" ? "archivo_procesado"
      : sourceMeta.estado === "no_es_capa" ? "no_acreditada"
        : external && ["sin_archivo", "referencia_incompleta", "formato_no_espacial"].includes(sourceMeta.estado)
          ? external.estado === "localizada" ? "fuente_localizada"
            : external.estado === "localizada_observada" ? "fuente_observada"
              : external.estado === "descentralizada" ? "fuente_descentralizada" : "fuente_interna"
          : sourceMeta.estado;
    const sourceFiles = candidate ? `${candidate.fuente || "Fuente externa"} · ${candidate.cobertura || "Cobertura por comprobar"}`
      : crossLayer?.fuentes?.map(item => item.archivo).join(" · ")
      || (sourceMeta.archivos || []).join(" · ")
      || (external ? `${external.organismo} · ${external.acceso}` : "")
      || sourceMeta.detalle || "La ficha no aporta un archivo espacial.";
    const lineage = sourceLineage(layer, external, candidate);
    const production = override.estado_produccion || "pendiente";
    const qa = override.qa || "pendiente";
    return `
      <tr>
        <td data-label="Capa"><span class="capas-table-category">${escape(categories)}</span><strong>${escape(layer.nombre)}</strong><small>${escape(layer.owner || "Sin responsable")}</small>${layer.url ? `<a href="${escape(layer.url)}" target="_blank" rel="noopener noreferrer">Ver ficha y evidencia ↗</a>` : ""}</td>
        <td data-label="Cobertura en la comuna"><span class="capas-coverage-pill ${escape(result.state)}">${escape(result.label)}</span><small>${escape(result.detail)}</small>${result.documentaryScope ? `<small class="capas-documentary-note">${escape(result.documentaryScope)}</small>` : ""}</td>
        <td data-label="Fuente / archivo espacial"><span class="capas-status-pill ${escape(cartography)}">${escape(cartographyLabels[cartography] || "Sin archivo")}</span><small class="capas-source-lineage">Origen: ${escape(lineage)}</small><small>${escape(sourceFiles)}</small>${(candidate?.actualizacion || external?.fecha_fuente) ? `<small>Fecha/referencia: ${escape(candidate?.actualizacion || external?.fecha_fuente)}</small>` : ""}${(candidate?.url || external?.url) ? `<a href="${escape(candidate?.url || external?.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ${escape(candidate?.nivel || external?.nivel || "externa")} ↗</a>` : ""}</td>
        <td data-label="Estado del equipo"><span class="capas-status-pill ${escape(production)}">${escape(productionLabels[production] || production)}</span><small>${escape(override.fecha_estado || override.responsable || "Sin actualización del equipo")}</small></td>
        <td data-label="QA de la capa"><span class="capas-status-pill ${escape(qa)}">${escape(qaLabels[qa])}</span><small>${escape(override.fecha_qa || `Catálogo: ${layer.verificacion || "sin verificar"}`)}</small></td>
        <td data-label="Fecha del dato"><strong>${escape(result.dataDate)}</strong><small>${escape(result.dateLabel)}</small></td>
      </tr>`;
  }

  function filteredTerritorial() {
    const commune = selectedCommune();
    const query = normalize(state.search);
    const rows = territorialLayers().map(layer => ({ layer, result: territorialCoverage(layer, commune) }))
      .filter(item => !state.coverage || item.result.state === state.coverage)
      .filter(item => !state.category || (item.layer.categorias || []).some(category => normalize(category) === normalize(state.category)))
      .filter(item => !query || normalize([item.layer.nombre, ...(item.layer.categorias || []), item.layer.owner, item.layer._candidate?.fuente, item.layer._candidate?.valor, externalSource().capas?.[item.layer.nombre]?.organismo].join(" ")).includes(query));
    const categoryOrder = [
      "Instrumentos de planificación territorial",
      "Límites y escalas",
      "Suelo y propiedad",
      "Movilidad e infraestructura",
      "Equipamientos y servicios",
      "Demografía y mercado",
      "Riesgos y medio ambiente",
      "Normativa territorial",
      "Producción Transsa / por clasificar",
      "Catálogo por incorporar",
    ];
    const categoryName = item => (item.layer.categorias?.[0] || "Sin categoría");
    const categoryRank = item => {
      const rank = categoryOrder.findIndex(category => normalize(category) === normalize(categoryName(item)));
      return rank === -1 ? categoryOrder.length : rank;
    };
    const stateName = item => item.result.label || item.result.state;
    return rows.sort((a, b) => {
      if (state.sort === "nombre") return a.layer.nombre.localeCompare(b.layer.nombre, "es");
      if (state.sort === "estado") return stateName(a).localeCompare(stateName(b), "es");
      if (state.sort === "fecha") return String(b.result.dataDate || "").localeCompare(String(a.result.dataDate || ""));
      return categoryRank(a) - categoryRank(b)
        || categoryName(a).localeCompare(categoryName(b), "es")
        || a.layer.nombre.localeCompare(b.layer.nombre, "es");
    });
  }

  function communeCoverageSummary(commune) {
    const layers = metricLayers().map(layer => ({ layer, result: territorialCoverage(layer, commune) }));
    const confirmed = layers.filter(item => item.result.state === "confirmada").length;
    const pending = layers.filter(item => ["pendiente", "bloqueada", "error"].includes(item.result.state)).length;
    const notApplicable = layers.filter(item => ["sin_elementos", "no_aplica", "proceso"].includes(item.result.state)).length;
    const ipt = iptSource().find(row => normalize(row.comuna) === normalize(commune.comuna)
      && (!commune.region
        || normalize(row.region) === normalize(commune.region)
        || normalize(row.region).includes(normalize(commune.region))
        || normalize(commune.region).includes(normalize(row.region))));
    return { layers: layers.length, confirmed, pending, notApplicable, ipt: ipt?.instrumentos?.length || 0 };
  }

  function renderRegions() {
    const host = $("capasRegionGrid");
    if (!host) return;
    const query = normalize(state.regionSearch);
    const grouped = new Map();
    communeRows().forEach(row => {
      if (!grouped.has(row.region)) grouped.set(row.region, []);
      grouped.get(row.region).push(row);
    });
    const regionRows = [...grouped.entries()].map(([region, values]) => {
      const communes = [...new Map(values.map(row => [normalize(row.comuna), row])).values()]
        .filter(row => !query || normalize(`${row.region} ${row.comuna}`).includes(query))
        .map(row => ({ ...row, summary: communeCoverageSummary(row) }));
      return { region, communes };
    }).filter(item => item.communes.length);
    const allCommunes = communeRows().length;
    regionRows.sort((a, b) => a.region.localeCompare(b.region, "es"));
    host.innerHTML = regionRows.map(({ region, communes }) => {
      const summary = communes.reduce((acc, row) => ({
        confirmed: acc.confirmed + (row.summary.confirmed > 0 ? 1 : 0),
        pending: acc.pending + (row.summary.pending > 0 ? 1 : 0),
        notApplicable: acc.notApplicable + (row.summary.notApplicable > 0 ? 1 : 0)
      }), { confirmed: 0, pending: 0, notApplicable: 0 });
      const sorted = communes.sort((a, b) => {
        if (state.regionSort === "pendientes") return b.summary.pending - a.summary.pending || a.comuna.localeCompare(b.comuna, "es");
        if (state.regionSort === "confirmadas") return b.summary.confirmed - a.summary.confirmed || a.comuna.localeCompare(b.comuna, "es");
        return a.comuna.localeCompare(b.comuna, "es");
      });
      const open = sorted.some(row => normalize(row.comuna) === normalize(state.commune));
      return `<details class="capas-region" ${open ? "open" : ""}><summary><span><strong>${escape(region)}</strong><small>${communes.length} ${communes.length === 1 ? "comuna visible" : "comunas visibles"}</small></span><span class="capas-region-summary"><span class="capas-region-count confirmada">${summary.confirmed} comunas con cruce</span><span class="capas-region-count pendiente">${summary.pending} con pendientes</span><span class="capas-region-count alerta">${summary.notApplicable} sin/no aplica</span></span></summary><div class="capas-region-body">${sorted.map(row => `<button type="button" class="capas-commune-mini ${normalize(row.comuna) === normalize(state.commune) ? "selected" : ""}" data-capas-commune="${escape(row.comuna)}" data-capas-open-layers="true"><strong>${escape(row.comuna)}</strong><small>${row.summary.ipt} IPT aplicables</small><span class="capas-commune-layer-link">${row.summary.layers} capas · ver detalle</span><span class="capas-commune-mini-kpis"><span>${row.summary.ipt}</span><span class="${row.summary.confirmed ? "confirmada" : ""}">${row.summary.confirmed}</span><span class="${row.summary.pending ? "pendiente" : ""}">${row.summary.pending}</span><span class="${row.summary.notApplicable ? "alerta" : ""}">${row.summary.notApplicable}</span></span></button>`).join("")}</div></details>`;
    }).join("");
    $("capasRegionsCount").textContent = `${regionRows.length} regiones · ${query ? "resultado filtrado" : `${allCommunes} comunas`}`;
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
    const metrics = territorial.filter(item => !item.layer._ipt);
    $("capasMetricCovered").textContent = metrics.filter(item => item.result.state === "confirmada").length;
    $("capasMetricPending").textContent = metrics.filter(item => ["bloqueada", "pendiente", "error"].includes(item.result.state)).length;
    $("capasMetricNotApplicable").textContent = metrics.filter(item => ["sin_elementos", "no_aplica", "proceso"].includes(item.result.state)).length;
  }

  function renderCrossBanner() {
    const source = crossSource();
    const processed = Object.values(source.capas || {}).filter(layer => layer.estado === "procesada").length;
    const summary = source.resumen || {};
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
    $("capasCrossBannerTitle").textContent = `Cruce pendiente · ${summary.capas_cruzadas || 0} de ${summary.capas_catalogadas || territorialLayers().length} capas ejecutadas`;
    $("capasCrossBannerText").textContent = `${summary.motivo_cero || execution.motivo || "Falta materializar los archivos espaciales."} Hay ${located} fuentes externas localizadas, pero “fuente localizada” todavía no significa cobertura confirmada: falta descarga, control de versión, geometría, CRS y cruce comunal.`;
  }

  function render() {
    const commune = selectedCommune();
    state.commune = commune.comuna;
    $("capasSelectedTitle").textContent = `Cobertura de ${commune.comuna}`;
    if ($("capasSelectedLayerTitle")) $("capasSelectedLayerTitle").textContent = commune.comuna;
    const ipt = renderIpt();
    const territorial = renderTerritorial();
    renderLayerCatalog();
    renderMetrics(ipt, territorial);
    renderRegions();
    renderCrossBanner();
  }

  function bind() {
    $("capasCommuneSelect")?.addEventListener("change", event => { state.commune = event.target.value; render(); });
    $("capasSearch")?.addEventListener("input", event => { state.search = event.target.value; renderTerritorial(); });
    $("capasRegionSearch")?.addEventListener("input", event => { state.regionSearch = event.target.value; renderRegions(); });
    $("capasRegionSort")?.addEventListener("change", event => { state.regionSort = event.target.value; renderRegions(); });
    $("capasCategoryFilter")?.addEventListener("change", event => { state.category = event.target.value; renderTerritorial(); });
    $("capasSort")?.addEventListener("change", event => { state.sort = event.target.value; renderTerritorial(); });
    $("capasCoverageFilter")?.addEventListener("change", event => { state.coverage = event.target.value; renderTerritorial(); });
    $("capasQaExport")?.addEventListener("click", exportLayerQa);
    document.addEventListener("click", event => {
      const qaButton = event.target.closest("[data-layer-qa]");
      if (qaButton && javieraMode()) {
        const records = loadLayerQa();
        if (records[qaButton.dataset.layerQa]?.estado === "aprobado") delete records[qaButton.dataset.layerQa];
        else records[qaButton.dataset.layerQa] = { estado: "aprobado", fecha: new Date().toISOString(), usuario: "Javiera" };
        saveLayerQa(records);
        renderLayerCatalog();
        return;
      }
      const categoryButton = event.target.closest("[data-capas-category]");
      if (categoryButton) {
        state.category = categoryButton.dataset.capasCategory;
        if ($("capasCategoryFilter")) $("capasCategoryFilter").value = state.category;
        renderTerritorial();
        document.querySelector(".capas-coverage-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const button = event.target.closest("[data-capas-commune]");
      if (!button) return;
      state.commune = button.dataset.capasCommune;
      render();
      const target = button.dataset.capasOpenLayers ? document.querySelector(".capas-coverage-section") : $("capasSelectedTitle");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  window.renderCapasTerritoriales = function renderCapasTerritoriales() {
    populateCommunes();
    const categoryFilter = $("capasCategoryFilter");
    if (categoryFilter && categoryFilter.options.length === 1) {
      [...new Set(territorialLayers().flatMap(layer => layer.categorias || []))]
        .sort((a, b) => a.localeCompare(b, "es"))
        .forEach(category => categoryFilter.insertAdjacentHTML("beforeend", `<option value="${escape(category)}">${escape(category)}</option>`));
    }
    render();
  };

  bind();
  window.renderCapasTerritoriales();
})();
