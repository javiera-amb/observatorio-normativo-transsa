(() => {
  "use strict";

  const state = {
    view: new URLSearchParams(window.location.search).get("vista") === "equipo" ? "equipo" : "propiteq",
    search: "",
    region: "",
    consumption: "",
    audit: "",
    production: "",
    qa: "",
    internalSearch: "",
    internalRegion: "",
    internalOwner: "",
    internalStage: "",
    internalPriority: "",
    internalView: new URLSearchParams(window.location.search).get("panel") === "javiera" ? "javiera" : "equipo",
  };

  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const data = () => window.SEGUIMIENTO_NORMATIVO || { resumen: {}, comunas: [] };
  const initialData = () => window.AVANCE_BASES_DATOS || { comunas: {}, resumen: {} };
  const prcInventory = () => window.INVENTARIO_PRC_ONEDRIVE || { comunas: {}, resumen: {} };
  const versionedTeamData = () => window.ESTADO_EQUIPO_VERSIONADO || { comunas: {} };
  const operationalData = () => window.ESTADO_OPERATIVO_DATOS || { comunas: {} };
  const localStorageKey = "tui-seguimiento-borradores-v1";
  let localChanges = (() => {
    try {
      const parsed = JSON.parse(window.localStorage?.getItem(localStorageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  })();
  const rowKey = row => `${row.region}|${row.comuna}`;
  const normalizeCommune = value => {
    const normalized = String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return ({
      paiguano: "paihuano",
      tiltil: "til til",
      "alto biobio": "alto bio bio",
      cholchol: "chol chol",
      "cabo de hornos ex navarino": "cabo de hornos",
    })[normalized] || normalized;
  };
  const initialRecord = row => {
    const exact = initialData().comunas?.[rowKey(row)];
    if (exact) return exact;
    const commune = normalizeCommune(row.comuna);
    const match = Object.values(initialData().comunas || {}).find(record => normalizeCommune(record.comuna) === commune);
    return match || {};
  };
  const inventoryRecord = row => {
    const exact = prcInventory().comunas?.[rowKey(row)];
    if (exact) return exact;
    const commune = normalizeCommune(row.comuna);
    const match = Object.entries(prcInventory().comunas || {}).find(([key]) => normalizeCommune(key.split("|").at(-1)) === commune);
    return match?.[1] || {};
  };
  const initialOverride = row => {
    const prc = initialRecord(row).prc || {};
    return {
      ...(prc.estado_produccion && prc.estado_produccion !== "enviado" ? { estado_produccion: prc.estado_produccion } : {}),
      ...(prc.estado_produccion === "enviado" ? { envio_historico_v1: true } : {}),
      ...(prc.qa_revision_javiera ? { qa_revision_javiera: prc.qa_revision_javiera } : {}),
      ...(prc.responsable ? { responsable: prc.responsable } : {}),
      ...(prc.alerta_sin_modificaciones ? { alerta_sin_modificaciones: prc.alerta_sin_modificaciones } : {}),
    };
  };
  const inventoryOverride = row => {
    const record = inventoryRecord(row);
    return {
      ...(record.estado_detectado && record.modelo_detectado === "tui_v2" ? { estado_produccion: record.estado_detectado } : {}),
      ...(record.ruta_relativa ? { evidencia: record.ruta_relativa } : {}),
      ...(record.modelo_detectado ? { modelo_prc: record.modelo_detectado } : {}),
    };
  };
  const localOverride = row => localChanges[rowKey(row)] || {};
  const mergedOverride = row => ({
    ...initialOverride(row),
    ...inventoryOverride(row),
    ...(versionedTeamData().comunas?.[rowKey(row)] || {}),
    ...(operationalData().comunas?.[rowKey(row)] || {}),
    ...localOverride(row),
  });
  const saveLocalChanges = () => {
    try {
      window.localStorage?.setItem(localStorageKey, JSON.stringify(localChanges));
    } catch (error) {
      // Private browsing or a locked-down browser can disable localStorage.
    }
  };
  const normalizeProductionState = value => ({
    listo: "actualizado",
    en_plataforma: "enviado",
    visible: "enviado",
    observado: "en_desarrollo",
  }[value] || value || "pendiente");
  const historicalV1Sent = row => normalizeProductionState(initialRecord(row).prc?.estado_produccion) === "enviado";
  const inventoryIsTuiV2 = row => inventoryRecord(row).modelo_detectado === "tui_v2";
  const inventoryV2StructureOk = row => inventoryIsTuiV2(row)
    && inventoryRecord(row).qa_archivo?.estandar_tui_v2?.cumple_estructura === true;
  const requiresV2 = row => historicalV1Sent(row) && !inventoryIsTuiV2(row);
  const isPrepublished = row => historicalV1Sent(row);
  const productionState = row => {
    const override = mergedOverride(row);
    const reported = normalizeProductionState(override.estado_produccion || "pendiente");
    if (requiresV2(row)) return reported === "en_desarrollo" ? "en_desarrollo" : "pendiente";
    if (inventoryIsTuiV2(row) && !inventoryV2StructureOk(row) && ["actualizado", "enviado"].includes(reported)) {
      return "en_desarrollo";
    }
    return reported;
  };
  const qaPlatformState = row => {
    const override = mergedOverride(row);
    if (requiresV2(row)) return "observaciones";
    if (inventoryIsTuiV2(row) && !inventoryV2StructureOk(row)) return "observaciones";
    return override.qa_plataforma || "pendiente";
  };
  const qaManualState = row => {
    const override = mergedOverride(row);
    return override.qa_revision_javiera || override.qa || "pendiente";
  };
  const isDirectProductionCandidate = row => Boolean(
    row.prc_nombre
    && Number(row.actos_posteriores || 0) === 0
    && row.archivo_recomendado
    && row.apto_para_visor === "SI"
    && String(row.estado_fuente || "").includes("sin cambios posteriores detectados")
    && !requiresV2(row)
  );
  const directProductionCandidates = () => data().comunas.filter(isDirectProductionCandidate);
  const legacyV2Queue = () => data().comunas.filter(requiresV2);
  const publicationStatus = row => {
    const production = productionState(row);
    const legacy = historicalV1Sent(row);
    return {
      state: production === "enviado" ? "enviado" : legacy ? "observado" : production,
      date: mergedOverride(row).fecha_estado || "",
      note: production === "enviado"
        ? (mergedOverride(row).nota_propiteq || "La versión TUI V2 fue enviada y su carga queda a cargo de Propiteq.")
        : legacy
          ? "Existe una V1 enviada a Propiteq, pero debe reemplazarse por una reconstrucción TUI V2."
          : "La versión vigente todavía permanece en manos del equipo.",
    };
  };

  const consumptionLabels = {
    disponible: "Disponible",
    usar_con_revision: "Usar con revisión",
    no_disponible: "No disponible",
  };

  const auditLabels = {
    auditoria_avanzada: "Auditoría avanzada",
    control_preliminar: "Control preliminar",
    pendiente_revision: "Pendiente de revisión",
    sin_cartografia: "Sin cartografía",
    sin_iniciar: "Sin iniciar",
  };

  const productionLabels = {
    pendiente: "Pendiente",
    en_desarrollo: "En desarrollo",
    actualizado: "Actualizado",
    enviado: "Enviado",
  };

  const publicationLabels = {
    pendiente: "Sin envío",
    en_desarrollo: "En preparación",
    actualizado: "Listo para enviar",
    enviado: "A cargo de Propiteq",
    observado: "V1 enviada · reemplazo pendiente",
  };

  const qaPlatformLabels = {
    pendiente: "QA automático pendiente",
    observaciones: "QA automático con diferencias",
    aprobado: "QA automático aprobado",
  };

  const qaManualLabels = {
    pendiente: "Revisión Javiera pendiente",
    observaciones: "Revisión Javiera con observaciones",
    aprobado: "Revisión Javiera aprobada",
  };

  const qaPlatformNote = row => {
    const operational = operationalStatus(row);
    const override = mergedOverride(row);
    if (requiresV2(row)) return "QA bloqueado: la V1 usa geometrías intersectadas con riesgos y no contiene la tabla normativa completa dentro del GeoPackage.";
    if (inventoryIsTuiV2(row) && !inventoryV2StructureOk(row)) {
      const bloqueos = inventoryRecord(row).qa_archivo?.estandar_tui_v2?.bloqueos || [];
      return bloqueos.join(" ") || "El archivo TUI V2 no cumple todavía los controles estructurales.";
    }
    if (override.qa_plataforma_motivo) return override.qa_plataforma_motivo;
    if (operational.qa === "pendiente" && ["actualizado", "enviado"].includes(operational.production)) {
      return "La plataforma no puede comprobar este control; revisión de Javiera requerida.";
    }
    if (operational.qa === "pendiente") return "La comparación automática aún no está registrada.";
    if (operational.qa === "observaciones") return "La comparación detectó diferencias que deben corregirse.";
    return "La comparación automática no detectó diferencias bloqueantes.";
  };

  const stageLabels = {
    levantamiento: "Levantamiento de fuentes",
    comparacion: "Comparación normativa",
    actualizacion_sig: "Actualización SIG",
    qa: "QA",
    publicacion: "Publicación",
  };

  const priorityLabels = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  function operationalStatus(row) {
    const override = mergedOverride(row);
    const prepublished = isPrepublished(row);
    const publication = publicationStatus(row);
    const inventory = inventoryRecord(row);
    const hasCartography = Boolean(inventory.ruta_relativa || row.archivo_recomendado || row.capa_recomendada);
    const qa = qaPlatformState(row);
    const production = productionState(row);
    const legacy = historicalV1Sent(row);
    const rebuildV2 = requiresV2(row);
    return {
      cartography: rebuildV2 ? "observada" : hasCartography ? "encontrada" : row.estado_auditoria === "sin_cartografia" ? "no_encontrada" : "no_verificada",
      production,
      qa,
      qaManual: qaManualState(row),
      statusDate: override.fecha_estado || "",
      qaDate: override.fecha_qa_plataforma || "",
      responsible: override.responsable || "Sin responsable registrado",
      evidence: override.evidencia || inventory.ruta_relativa || "",
      note: rebuildV2
        ? "V1 enviada históricamente; no es base válida para nuevas cargas. Reconstrucción TUI V2 obligatoria."
        : override.nota || (production === "enviado" ? "TUI V2 enviada a Propiteq." : ""),
      publication,
      prepublished,
      legacyV1: legacy,
      requiresV2: rebuildV2,
      model: inventory.modelo_detectado || (legacy ? "legado_v1" : "sin_clasificar"),
      v2StructureOk: inventoryV2StructureOk(row),
      inconsistency: rebuildV2 || (["actualizado", "enviado"].includes(production) && qa === "observaciones"),
    };
  }

  function internalStatus(row) {
    const override = mergedOverride(row);
    const internal = override.interno || {};
    const operational = operationalStatus(row);
    const hasCartography = Boolean(inventoryRecord(row).ruta_relativa || row.archivo_recomendado || row.capa_recomendada);
    const hasPrc = Boolean(row.prc_nombre);
    const pendingControls = Number.isFinite(row.controles_pendientes) ? row.controles_pendientes : null;
    const totalControls = Number.isFinite(row.controles_totales) ? row.controles_totales : null;
    const acts = Number(row.actos_posteriores || 0);
    let stage = internal.etapa;
    if (!stage) {
      if (operational.requiresV2) stage = "actualizacion_sig";
      else if (["actualizado", "enviado"].includes(operational.production)) stage = "publicacion";
      else if (operational.production === "en_desarrollo") stage = "actualizacion_sig";
      else if (operational.qaManual === "observaciones" || pendingControls !== null || row.estado_auditoria === "auditoria_avanzada") stage = "qa";
      else if (acts > 0 && hasCartography) stage = "comparacion";
      else if (hasCartography && acts === 0) stage = "qa";
      else stage = "levantamiento";
    }
    let progress = Number.isFinite(internal.avance) ? Math.max(0, Math.min(100, internal.avance)) : null;
    if (progress === null && totalControls > 0 && pendingControls !== null) progress = Math.round(((totalControls - pendingControls) / totalControls) * 100);
    if (progress === null) progress = operational.requiresV2 && operational.production === "pendiente"
      ? 0 : ({ pendiente: 0, en_desarrollo: 50, actualizado: 90, enviado: 100 })[operational.production] || 0;
    const responsible = override.responsable && !override.responsable.toLocaleLowerCase("es").includes("sin responsable")
      ? override.responsable : "Sin asignar";
    let blocking = internal.bloqueo || "";
    if (!blocking && operational.requiresV2) blocking = "V1 observada: geometría recortada por riesgos y atributos fuera del GeoPackage";
    else if (!blocking && pendingControls > 0) blocking = `${pendingControls} controles de QA abiertos`;
    else if (!blocking && acts > 0) blocking = `${acts} ${acts === 1 ? "acto posterior por comparar" : "actos posteriores por comparar"}`;
    else if (!blocking && !hasCartography) blocking = "Falta cartografía vinculada";
    else if (!blocking && !hasPrc) blocking = "Falta confirmar IPT vigente";
    else if (!blocking && operational.prepublished && acts === 0) blocking = "Revisar tabla de atributos y nomenclatura";
    const priority = internal.prioridad || (operational.requiresV2 || pendingControls > 0 || acts >= 10 ? "critica" : acts >= 4 || !hasCartography || !hasPrc ? "alta" : acts > 0 ? "media" : "baja");
    let nextAction = internal.proxima_accion || "";
    if (!nextAction && operational.requiresV2) nextAction = "Reconstruir TUI V2 con zonificación normativa sin intersección de riesgos y tabla de atributos incorporada en el GeoPackage.";
    else if (!nextAction && pendingControls > 0) nextAction = `Resolver y documentar ${pendingControls} controles antes de aprobar el QA.`;
    else if (!nextAction && acts > 0) nextAction = `Comparar ${acts} ${acts === 1 ? "acto posterior" : "actos posteriores"} con la cartografía SIG.`;
    else if (!nextAction && !hasPrc) nextAction = "Confirmar el instrumento vigente y su fuente oficial.";
    else if (!nextAction && !hasCartography) nextAction = "Localizar, descargar y vincular la cartografía vigente.";
    else if (!nextAction && operational.prepublished && acts === 0) nextAction = "Revisar tabla, nomenclatura y consistencia de campos antes de cerrar QA.";
    else if (!nextAction && operational.qaManual !== "aprobado") nextAction = "Resolver los controles no automatizables y registrar la revisión de Javiera en la plataforma.";
    else if (!nextAction && operational.production !== "enviado") nextAction = "Homologar la tabla de usos, marcar actualizado y preparar el envío a Propiteq.";
    else if (!nextAction) nextAction = "Monitorear nuevas modificaciones o enmiendas.";
    return {
      ...operational,
      qa: operational.qaManual,
      qaPlatform: operational.qa,
      qaDate: override.fecha_revision_javiera || internal.fecha_qa || "",
      responsible,
      stage,
      progress,
      blocking,
      priority,
      nextAction,
      lastActivity: internal.fecha_actividad || operational.statusDate || operational.qaDate || row.ultima_revision || "Sin actividad registrada",
    };
  }

  function populateRegions() {
    const select = $("seguimientoRegion");
    if (!select || select.options.length > 1) return;
    [...new Set(data().comunas.map(row => row.region).filter(Boolean))]
      .forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
      });
  }

  function populateInternalFilters() {
    const regionSelect = $("seguimientoInternalRegion");
    if (regionSelect && regionSelect.options.length === 1) {
      [...new Set(data().comunas.map(row => row.region).filter(Boolean))].forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
      });
    }
    const ownerSelect = $("seguimientoInternalOwner");
    if (ownerSelect && ownerSelect.options.length === 2) {
      [...new Set(data().comunas.map(row => internalStatus(row).responsible).filter(owner => owner !== "Sin asignar"))]
        .sort((a, b) => a.localeCompare(b, "es"))
        .forEach(owner => {
          const option = document.createElement("option");
          option.value = owner;
          option.textContent = owner;
          ownerSelect.appendChild(option);
        });
    }
  }

  function filteredRows() {
    const query = state.search.trim().toLocaleLowerCase("es");
    return data().comunas.filter(row => {
      const operational = operationalStatus(row);
      const haystack = [row.region, row.comuna, row.prc_nombre, row.estado_fuente, row.motivo]
        .join(" ")
        .toLocaleLowerCase("es");
      return (!query || haystack.includes(query))
        && (!state.region || row.region === state.region)
        && (!state.consumption || row.consumo_propieteq === state.consumption)
        && (!state.audit || row.estado_auditoria === state.audit)
        && (!state.production || operational.production === state.production)
        && (!state.qa || operational.qa === state.qa);
    });
  }

  function filteredInternalRows() {
    const query = state.internalSearch.trim().toLocaleLowerCase("es");
    return data().comunas.map(row => ({ row, internal: internalStatus(row) })).filter(({ row, internal }) => {
      const haystack = [row.region, row.comuna, row.prc_nombre, internal.responsible, stageLabels[internal.stage], internal.blocking, internal.nextAction]
        .join(" ").toLocaleLowerCase("es");
      const ownerMatches = !state.internalOwner
        || (state.internalOwner === "__sin_asignar__" && internal.responsible === "Sin asignar")
        || (state.internalOwner !== "__sin_asignar__" && (internal.responsible === state.internalOwner || internal.responsible === "Sin asignar"));
      return (!query || haystack.includes(query))
        && (!state.internalRegion || row.region === state.internalRegion)
        && ownerMatches
        && (!state.internalStage || internal.stage === state.internalStage)
        && (!state.internalPriority || internal.priority === state.internalPriority);
    });
  }

  function alertText(row) {
    if (requiresV2(row)) return "Reconstrucción TUI V2 obligatoria";
    if (Number.isFinite(row.controles_pendientes)) {
      return `${row.controles_pendientes} de ${row.controles_totales} controles abiertos`;
    }
    if (row.actos_posteriores) {
      return `${row.actos_posteriores} ${row.actos_posteriores === 1 ? "acto posterior" : "actos posteriores"}`;
    }
    return "—";
  }

  function rowTemplate(row) {
    const consumption = row.consumo_propieteq || "no_disponible";
    const audit = row.estado_auditoria || "sin_iniciar";
    const sourceDetail = [inventoryRecord(row).ruta_relativa, row.capa_recomendada, row.archivo_recomendado].filter(Boolean).join(" · ");
    const operational = operationalStatus(row);
    const cartographyLabels = {
      encontrada: "Archivo encontrado",
      observada: "V1 observada",
      no_encontrada: "No encontrada",
      no_verificada: "No verificada",
    };
    return `
      <tr>
        <td data-label="Región / comuna">
          <span class="seguimiento-region">${escape(row.region)}</span>
          <strong class="seguimiento-comuna">${escape(row.comuna)}</strong>
        </td>
        <td data-label="IPT vigente identificado">
          <strong class="seguimiento-ipt-name">${escape(row.prc_nombre || "No identificado")}</strong>
          <span class="seguimiento-date">${escape(row.prc_fecha || "Sin fecha")}</span>
        </td>
        <td data-label="Cartografía">
          <span class="seguimiento-operational-pill cartography ${escape(operational.cartography)}">${escape(cartographyLabels[operational.cartography])}</span>
          <small title="${escape(sourceDetail)}">${escape(sourceDetail || "Sin archivo o servicio vinculado")}</small>
        </td>
        <td data-label="Estado de producción">
          <span class="seguimiento-operational-pill production ${escape(operational.production)}">${escape(productionLabels[operational.production])}</span>
          <small>${escape(operational.statusDate ? `Actualizado: ${operational.statusDate}` : operational.responsible)}</small>
          <small>${escape(operational.requiresV2 ? "Producción TUI V2 aún pendiente; la V1 queda solo como antecedente." : operational.production === "enviado" ? "La carga al visor queda fuera del equipo." : operational.production === "actualizado" ? "Tabla homologada: listo para envío." : operational.production === "en_desarrollo" ? "Trabajo en curso." : "Aún no trabajado.")}</small>
          ${operational.inconsistency ? `<small class="seguimiento-state-warning">QA automático con diferencias.</small>` : ""}
        </td>
        <td data-label="Traspaso a Propiteq">
          <span class="seguimiento-operational-pill publication ${escape(operational.publication.state)}">${escape(publicationLabels[operational.publication.state])}</span>
          <small>${escape(operational.publication.note)}</small>
        </td>
        <td data-label="QA automático de la plataforma">
          <span class="seguimiento-operational-pill qa ${escape(operational.qa)}">${escape(qaPlatformLabels[operational.qa])}</span>
          <small>${escape(qaPlatformNote(row))}</small>
          <small>${escape(operational.qaDate ? `Último QA: ${operational.qaDate}` : "Sin fecha de QA")}</small>
          ${Number.isFinite(row.controles_pendientes) ? `<small>${escape(`${row.controles_pendientes} de ${row.controles_totales} controles pendientes`)}</small>` : ""}
        </td>
        <td data-label="Cambios / controles">
          <strong class="seguimiento-alert-count">${escape(alertText(row))}</strong>
          ${row.actos_posteriores ? `<small>Cambios normativos que deben comprobarse en la cartografía.</small>` : ""}
          ${row.ultimo_acto_posterior ? `<small>Último acto: ${escape(row.ultimo_acto_posterior)}</small>` : ""}
        </td>
        <td data-label="Último QA">${escape(operational.qaDate || row.ultima_revision || "Sin QA registrado")}</td>
        <td data-label="Ficha"> 
          ${row.ficha_disponible ? `<button class="seguimiento-detail-button" type="button" data-seguimiento-commune="${escape(row.comuna)}">Ver ficha</button>` : ""}
        </td>
      </tr>
    `;
  }

  function internalRowTemplate({ row, internal }) {
    const alerts = internal.requiresV2 ? "Reconstruir TUI V2"
      : Number.isFinite(row.controles_pendientes)
      ? `${row.controles_pendientes} de ${row.controles_totales} controles abiertos`
      : row.actos_posteriores ? `${row.actos_posteriores} ${row.actos_posteriores === 1 ? "acto posterior" : "actos posteriores"}` : "Sin alertas normativas abiertas";
    const statusControl = state.internalView === "equipo"
      ? `<label class="seguimiento-inline-status"><span>Marcar avance</span><select data-update-production="${escape(rowKey(row))}" aria-label="Marcar estado de ${escape(row.comuna)}">${Object.entries(productionLabels).map(([value, label]) => `<option value="${value}" ${internal.production === value ? "selected" : ""}>${escape(label)}</option>`).join("")}</select></label>`
      : "";
    return `
      <tr>
        <td data-label="Comuna"><span class="seguimiento-region">${escape(row.region)}</span><strong class="seguimiento-comuna">${escape(row.comuna)}</strong><small>${escape(row.prc_fecha || "PRC sin fecha")}</small></td>
        <td data-label="Responsable"><span class="seguimiento-owner ${internal.responsible === "Sin asignar" ? "unassigned" : ""}">${escape(internal.responsible)}</span></td>
        <td data-label="Etapa técnica"><span class="seguimiento-stage ${escape(internal.stage)}">${escape(stageLabels[internal.stage] || internal.stage)}</span><small class="seguimiento-priority ${escape(internal.priority)}">Prioridad ${escape(priorityLabels[internal.priority] || internal.priority)}</small></td>
        <td data-label="Estado / avance"><span class="seguimiento-operational-pill production ${escape(internal.production)}">${escape(productionLabels[internal.production])}</span>${statusControl}<div class="seguimiento-progress" aria-label="${escape(`${internal.progress}% de avance`)}"><span style="width:${internal.progress}%"></span></div><small>${escape(`${internal.progress}% informado/calculado`)}</small></td>
        <td data-label="QA automático de la plataforma"><span class="seguimiento-operational-pill qa ${escape(internal.qaPlatform)}">${escape(qaPlatformLabels[internal.qaPlatform])}</span><small>${escape(qaPlatformNote(row))}</small></td>
        <td data-label="Revisión Javiera"><span class="seguimiento-operational-pill qa ${escape(internal.qa)}">${escape(qaManualLabels[internal.qa])}</span><small>${escape(internal.qaDate ? `Última revisión: ${internal.qaDate}` : "Sin fecha de revisión")}</small></td>
        <td data-label="Alertas y bloqueos"><strong class="seguimiento-alert-count">${escape(alerts)}</strong><small class="${internal.blocking ? "seguimiento-blocking" : ""}">${escape(internal.blocking || "Sin bloqueo técnico registrado")}</small></td>
        <td data-label="Próxima acción"><p class="seguimiento-next-action">${escape(internal.nextAction)}</p></td>
        <td data-label="Última actividad">${escape(internal.lastActivity)}</td>
        <td data-label="Auditoría"><button class="seguimiento-detail-button" type="button" data-seguimiento-commune="${escape(row.comuna)}">Abrir auditoría</button></td>
      </tr>`;
  }

  function renderMetrics() {
    const statuses = data().comunas.map(operationalStatus);
    if ($("seguimientoMetricPending")) $("seguimientoMetricPending").textContent = statuses.filter(item => item.production === "pendiente").length;
    if ($("seguimientoMetricDevelopment")) $("seguimientoMetricDevelopment").textContent = statuses.filter(item => item.production === "en_desarrollo").length;
    if ($("seguimientoMetricUpdated")) $("seguimientoMetricUpdated").textContent = statuses.filter(item => item.production === "actualizado").length;
    if ($("seguimientoMetricSent")) $("seguimientoMetricSent").textContent = statuses.filter(item => item.production === "enviado").length;
  }

  function renderInternalMetrics() {
    const rows = data().comunas.map(row => internalStatus(row));
    $("seguimientoInternalUnassigned").textContent = rows.filter(item => item.responsible === "Sin asignar").length;
    $("seguimientoInternalActive").textContent = rows.filter(item => item.production === "en_desarrollo" || (item.stage === "qa" && item.qaDate)).length;
    $("seguimientoInternalBlocked").textContent = rows.filter(item => item.blocking).length;
    $("seguimientoInternalApproved").textContent = rows.filter(item => item.qa === "aprobado").length;
    const prepublished = rows.filter(item => item.prepublished);
    const legacyV2 = rows.filter(item => item.requiresV2);
    const v2Detected = rows.filter(item => item.model === "tui_v2");
    if ($("seguimientoPrepublishedCount")) $("seguimientoPrepublishedCount").textContent = prepublished.length;
    if ($("seguimientoLegacyV2Required")) $("seguimientoLegacyV2Required").textContent = legacyV2.length;
    if ($("seguimientoTuiV2Detected")) $("seguimientoTuiV2Detected").textContent = v2Detected.length;
    if ($("seguimientoTuiV2StructureOk")) $("seguimientoTuiV2StructureOk").textContent = v2Detected.filter(item => item.v2StructureOk).length;
    if ($("seguimientoInventoryDeclared")) $("seguimientoInventoryDeclared").textContent = prcInventory().resumen?.comunas || "—";
    if ($("seguimientoPrepublishedHeadline")) {
      $("seguimientoPrepublishedHeadline").textContent = `${prepublished.length} PRC V1 enviados históricamente · ${legacyV2.length} requieren reconstrucción TUI V2`;
    }
    if ($("seguimientoDirectCount")) $("seguimientoDirectCount").textContent = directProductionCandidates().length;
    const trackerLink = $("seguimientoDriveLink");
    if (trackerLink) {
      trackerLink.href = "https://github.com/javiera-amb/observatorio-normativo-transsa/blob/main/data/inventario_prc_onedrive.js";
      trackerLink.removeAttribute("aria-disabled");
      trackerLink.textContent = "Abrir inventario versionado ↗";
      if ($("seguimientoDriveStatus")) $("seguimientoDriveStatus").textContent = "Los GeoPackage permanecen en OneDrive; Git conserva rutas relativas, huellas, fechas y resultados de validación.";
    }
  }

  function directCandidateTemplate(row) {
    const operational = operationalStatus(row);
    const qaManual = qaManualState(row);
    return `<tr>
      <td data-label="Región / comuna"><span class="seguimiento-region">${escape(row.region)}</span><strong class="seguimiento-comuna">${escape(row.comuna)}</strong></td>
      <td data-label="IPT"><strong class="seguimiento-ipt-name">${escape(row.prc_nombre)}</strong><span class="seguimiento-date">${escape(row.prc_fecha || "Sin fecha")}</span></td>
      <td data-label="Estado"><span class="seguimiento-operational-pill production ${escape(operational.production)}">${escape(productionLabels[operational.production])}</span><small>${escape(operational.production === "actualizado" ? "Homologación pendiente de registrar" : "Marcar actualizado después de homologar usos")}</small></td>
      <td data-label="Capa / archivo"><strong>${escape(row.capa_recomendada || "Sin capa")}</strong><small>${escape(row.archivo_recomendado)}</small></td>
      <td data-label="Revisión Javiera"><span class="seguimiento-operational-pill qa ${escape(qaManual)}">${escape(qaManualLabels[qaManual])}</span><small>Solo se usa cuando el control no puede automatizarse.</small></td>
      <td data-label="Acción obligatoria"><strong>Crear TUI V2 y homologar usos</strong><small>Conservar la geometría normativa base, incorporar los atributos en el GPKG y homologar la columna de usos.</small></td>
    </tr>`;
  }

  function renderDirectCandidates() {
    const body = $("seguimientoDirectBody");
    if (!body) return;
    const rows = directProductionCandidates();
    body.innerHTML = rows.map(directCandidateTemplate).join("");
    if ($("seguimientoDirectCount")) $("seguimientoDirectCount").textContent = rows.length;
  }

  function downloadDirectCandidates() {
    const headers = ["region", "comuna", "prc_fecha", "capa_recomendada", "archivo_recomendado", "estado_produccion", "revision_javiera", "accion"];
    const lines = [headers.join(";")];
    directProductionCandidates().forEach(row => {
      const operational = operationalStatus(row);
      lines.push([
        row.region, row.comuna, row.prc_fecha, row.capa_recomendada, row.archivo_recomendado,
        operational.production, qaManualState(row), "Crear TUI V2 con geometría base; incorporar atributos y homologar usos"
      ].map(csvCell).join(";"));
    });
    const blob = new Blob(["\\ufeff" + lines.join("\\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PRC_candidatos_produccion_directa.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadLegacyV2Queue() {
    const headers = ["region", "comuna", "estado_historico", "estado_tui_v2", "qa_plataforma", "accion_obligatoria", "convencion_archivo"];
    const lines = [headers.join(";")];
    legacyV2Queue().forEach(row => {
      lines.push([
        row.region,
        row.comuna,
        "V1 enviada a Propiteq",
        productionLabels[productionState(row)],
        qaPlatformLabels[qaPlatformState(row)],
        "Reconstruir zonificación sin intersección de riesgos e incorporar tabla normativa en el GeoPackage",
        `IPT_00_PRC_${row.comuna.replaceAll(" ", "")}_TUI_V2_Actualizado.gpkg`,
      ].map(csvCell).join(";"));
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PRC_V1_reconstruccion_TUI_V2.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderTable() {
    const body = $("seguimientoTableBody");
    if (!body) return;
    const rows = filteredRows();
    body.innerHTML = rows.map(rowTemplate).join("");
    if ($("seguimientoResultCount")) $("seguimientoResultCount").textContent = `${rows.length} comunas`;
    if ($("seguimientoEmpty")) $("seguimientoEmpty").hidden = rows.length > 0;
    const table = body.closest(".seguimiento-table-scroll");
    if (table) table.hidden = rows.length === 0;
  }

  function renderInternalTable() {
    const body = $("seguimientoInternalBody");
    if (!body) return;
    const rows = filteredInternalRows();
    body.innerHTML = rows.map(internalRowTemplate).join("");
    $("seguimientoInternalCount").textContent = `${rows.length} comunas`;
    $("seguimientoInternalEmpty").hidden = rows.length > 0;
    const table = body.closest(".seguimiento-table-scroll");
    if (table) table.hidden = rows.length === 0;
  }

  function renderView() {
    const internal = state.view === "equipo";
    $("seguimientoExternalView").hidden = internal;
    $("seguimientoInternalView").hidden = !internal;
    document.querySelectorAll("[data-seguimiento-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.seguimientoView === state.view);
    });
  }

  function renderInternalView() {
    const isJaviera = state.internalView === "javiera";
    document.querySelectorAll("[data-internal-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.internalView === state.internalView);
    });
    document.querySelectorAll("[data-internal-scope]").forEach(section => {
      const scopes = section.dataset.internalScope.split(",").map(value => value.trim());
      section.hidden = !scopes.includes(state.internalView);
    });
    if ($("seguimientoInternalTitle")) $("seguimientoInternalTitle").textContent = isJaviera ? "Control de Javiera" : "Mi tablero de tareas";
    if ($("seguimientoInternalDescription")) $("seguimientoInternalDescription").textContent = isJaviera
      ? "Revisa el avance nacional, los bloqueos y el QA automático. Los controles que la plataforma no pueda resolver quedan asignados a tu revisión."
      : "Selecciona tu nombre, filtra tus comunas y marca el estado de producción. Puedes exportar los cambios para incorporarlos al registro versionado del equipo.";
    if ($("seguimientoInternalBadge")) $("seguimientoInternalBadge").textContent = isJaviera ? "Panel de supervisión" : "Tablero del equipo";
    if ($("seguimientoCurrentUser")) $("seguimientoCurrentUser").closest("label").hidden = isJaviera;
    if ($("seguimientoLocalSaveNote")) $("seguimientoLocalSaveNote").textContent = isJaviera
      ? "El QA automático lo calcula esta plataforma; las observaciones no automatizables quedan para revisión de Javiera."
      : "Los estados se guardan localmente hasta exportarlos e incorporarlos al registro compartido de Git.";
  }

  function setInternalView(view) {
    state.internalView = view === "javiera" ? "javiera" : "equipo";
    const url = new URL(window.location.href);
    url.searchParams.set("vista", "equipo");
    if (state.internalView === "javiera") url.searchParams.set("panel", "javiera");
    else url.searchParams.delete("panel");
    history.replaceState(null, "", `${url.pathname}${url.search}#seguimiento`);
    renderInternalView();
    renderInternalTable();
  }

  function updateProductionStatus(key, value) {
    const [region, ...communeParts] = key.split("|");
    const commune = communeParts.join("|");
    const row = data().comunas.find(candidate => candidate.region === region && candidate.comuna === commune);
    if (!row || !Object.prototype.hasOwnProperty.call(productionLabels, value)) return;
    const current = localChanges[key] || {};
    const currentUser = $("seguimientoCurrentUser")?.value || current.responsable || "";
    const note = $("seguimientoLocalSaveNote");
    if (["actualizado", "enviado"].includes(value) && !inventoryV2StructureOk(row)) {
      if (note) note.textContent = `${commune}: no puede marcarse “${productionLabels[value]}”. Primero debe existir un GeoPackage TUI V2 con geometría y atributos estructuralmente válidos.`;
      renderInternalTable();
      return;
    }
    if (value === "enviado" && qaPlatformState(row) !== "aprobado") {
      if (note) note.textContent = `${commune}: no puede marcarse “Enviado” mientras el QA automático de la plataforma no esté aprobado.`;
      renderInternalTable();
      return;
    }
    localChanges[key] = {
      ...current,
      estado_produccion: value,
      fecha_estado: new Date().toISOString().slice(0, 10),
      ...(currentUser ? { responsable: currentUser } : {}),
    };
    saveLocalChanges();
    if (note) note.textContent = `${commune}: estado “${productionLabels[value]}” guardado. Descarga los cambios para incorporarlos al registro compartido de la plataforma.`;
    renderMetrics();
    renderInternalMetrics();
    renderInternalTable();
    renderTable();
  }

  function downloadLocalChanges() {
    const headers = ["region", "comuna", "responsable", "estado_produccion", "fecha_estado"];
    const lines = [headers.join(";")];
    Object.entries(localChanges).forEach(([key, change]) => {
      const [region, ...communeParts] = key.split("|");
      lines.push([region, communeParts.join("|"), change.responsable || "", change.estado_produccion || "", change.fecha_estado || ""]
        .map(csvCell).join(";"));
    });
    const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "borradores_seguimiento_prc.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCsv() {
    const headers = [
      "region", "comuna", "prc_nombre", "prc_fecha", "estado_fuente",
      "cartografia_estado", "estado_produccion", "fecha_estado",
      "qa_plataforma", "fecha_qa_plataforma", "responsable", "estado_auditoria", "disponibilidad_propieteq", "motivo",
      "actos_posteriores", "controles_pendientes", "controles_totales",
      "ultima_revision", "archivo_recomendado", "capa_recomendada",
    ];
    const lines = [headers.join(";")];
    data().comunas.forEach(row => {
      const operational = operationalStatus(row);
      const values = [
        row.region, row.comuna, row.prc_nombre, row.prc_fecha, row.estado_fuente,
        operational.cartography, operational.production, operational.statusDate,
        operational.qa, operational.qaDate, operational.responsible,
        auditLabels[row.estado_auditoria] || row.estado_auditoria,
        consumptionLabels[row.consumo_propieteq] || row.consumo_propieteq,
        row.motivo, row.actos_posteriores, row.controles_pendientes,
        row.controles_totales, row.ultima_revision, row.archivo_recomendado,
        row.capa_recomendada,
      ];
      lines.push(values.map(csvCell).join(";"));
    });
    const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seguimiento_normativo_comunal_2026-08-11.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openCommune(commune) {
    if (typeof switchModule !== "function") return;
    switchModule("vigencia");
    const input = $("vigenciaSearchInput");
    if (!input) return;
    input.value = commune;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => {
      const card = [...document.querySelectorAll("[data-vigencia-id]")]
        .find(candidate => candidate.textContent.toLocaleLowerCase("es").includes(commune.toLocaleLowerCase("es")));
      card?.click();
    }, 120);
  }

  function bindEvents() {
    document.querySelectorAll("[data-seguimiento-view]").forEach(button => button.addEventListener("click", () => {
      state.view = button.dataset.seguimientoView;
      const url = new URL(window.location.href);
      if (state.view === "equipo") url.searchParams.set("vista", "equipo");
      else url.searchParams.delete("vista");
      history.replaceState(null, "", `${url.pathname}${url.search}#seguimiento`);
      renderView();
    }));
    document.querySelectorAll("[data-internal-view]").forEach(button => button.addEventListener("click", () => {
      setInternalView(button.dataset.internalView);
    }));
    $("seguimientoCurrentUser")?.addEventListener("change", event => {
      const value = event.target.value;
      state.internalOwner = value;
      if ($("seguimientoInternalOwner")) $("seguimientoInternalOwner").value = value;
      renderInternalTable();
    });
    $("seguimientoDownloadLocalChanges")?.addEventListener("click", downloadLocalChanges);
    $("seguimientoLegacyV2Download")?.addEventListener("click", downloadLegacyV2Queue);
    $("seguimientoSearch")?.addEventListener("input", event => {
      state.search = event.target.value;
      renderTable();
    });
    $("seguimientoRegion")?.addEventListener("change", event => {
      state.region = event.target.value;
      renderTable();
    });
    $("seguimientoConsumption")?.addEventListener("change", event => {
      state.consumption = event.target.value;
      renderTable();
    });
    $("seguimientoAudit")?.addEventListener("change", event => {
      state.audit = event.target.value;
      renderTable();
    });
    $("seguimientoProduction")?.addEventListener("change", event => {
      state.production = event.target.value;
      renderTable();
    });
    $("seguimientoQa")?.addEventListener("change", event => {
      state.qa = event.target.value;
      renderTable();
    });
    $("seguimientoDownloadCsv")?.addEventListener("click", downloadCsv);
    $("seguimientoDirectDownload")?.addEventListener("click", downloadDirectCandidates);
    $("seguimientoTableBody")?.addEventListener("click", event => {
      const button = event.target.closest("[data-seguimiento-commune]");
      if (button) openCommune(button.dataset.seguimientoCommune);
    });
    $("seguimientoInternalSearch")?.addEventListener("input", event => { state.internalSearch = event.target.value; renderInternalTable(); });
    $("seguimientoInternalRegion")?.addEventListener("change", event => { state.internalRegion = event.target.value; renderInternalTable(); });
    $("seguimientoInternalOwner")?.addEventListener("change", event => { state.internalOwner = event.target.value; renderInternalTable(); });
    $("seguimientoInternalStage")?.addEventListener("change", event => { state.internalStage = event.target.value; renderInternalTable(); });
    $("seguimientoInternalPriority")?.addEventListener("change", event => { state.internalPriority = event.target.value; renderInternalTable(); });
    $("seguimientoInternalBody")?.addEventListener("change", event => {
      const select = event.target.closest("[data-update-production]");
      if (select) updateProductionStatus(select.dataset.updateProduction, select.value);
    });
    $("seguimientoInternalBody")?.addEventListener("click", event => {
      const button = event.target.closest("[data-seguimiento-commune]");
      if (button) openCommune(button.dataset.seguimientoCommune);
    });
  }

  window.renderSeguimientoNormativo = function renderSeguimientoNormativo() {
    populateRegions();
    populateInternalFilters();
    renderMetrics();
    renderTable();
    renderInternalMetrics();
    renderInternalTable();
    renderDirectCandidates();
    renderView();
    renderInternalView();
  };

  bindEvents();
  window.renderSeguimientoNormativo();
})();
