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
  };

  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const data = () => window.SEGUIMIENTO_NORMATIVO || { resumen: {}, comunas: [] };
  const operationalData = () => window.ESTADO_OPERATIVO_DATOS || { comunas: {} };

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
    listo: "Listo",
    en_plataforma: "En la plataforma",
  };

  const qaLabels = {
    pendiente: "QA pendiente",
    observaciones: "QA con observaciones",
    aprobado: "QA aprobado",
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
    const override = operationalData().comunas?.[`${row.region}|${row.comuna}`] || {};
    const hasCartography = Boolean(row.archivo_recomendado || row.capa_recomendada);
    let qa = override.qa;
    if (!qa && Number.isFinite(row.controles_totales) && Number.isFinite(row.controles_pendientes)) {
      qa = row.controles_pendientes === 0 && row.controles_totales > 0 ? "aprobado" : "observaciones";
    }
    const production = override.estado_produccion || "pendiente";
    return {
      cartography: hasCartography ? "encontrada" : row.estado_auditoria === "sin_cartografia" ? "no_encontrada" : "no_verificada",
      production,
      qa: qa || "pendiente",
      statusDate: override.fecha_estado || "",
      qaDate: override.fecha_qa || row.ultima_revision || "",
      responsible: override.responsable || "Sin responsable registrado",
      evidence: override.evidencia || "",
      note: override.nota || "",
      inconsistency: ["listo", "en_plataforma"].includes(production) && qa !== "aprobado",
    };
  }

  function internalStatus(row) {
    const key = `${row.region}|${row.comuna}`;
    const override = operationalData().comunas?.[key] || {};
    const internal = override.interno || {};
    const operational = operationalStatus(row);
    const hasCartography = Boolean(row.archivo_recomendado || row.capa_recomendada);
    const hasPrc = Boolean(row.prc_nombre);
    const pendingControls = Number.isFinite(row.controles_pendientes) ? row.controles_pendientes : null;
    const totalControls = Number.isFinite(row.controles_totales) ? row.controles_totales : null;
    const acts = Number(row.actos_posteriores || 0);
    let stage = internal.etapa;
    if (!stage) {
      if (["listo", "en_plataforma"].includes(operational.production)) stage = "publicacion";
      else if (operational.production === "en_desarrollo") stage = "actualizacion_sig";
      else if (operational.qa === "observaciones" || pendingControls !== null || row.estado_auditoria === "auditoria_avanzada") stage = "qa";
      else if (acts > 0 && hasCartography) stage = "comparacion";
      else if (hasCartography && acts === 0) stage = "qa";
      else stage = "levantamiento";
    }
    let progress = Number.isFinite(internal.avance) ? Math.max(0, Math.min(100, internal.avance)) : null;
    if (progress === null && totalControls > 0 && pendingControls !== null) progress = Math.round(((totalControls - pendingControls) / totalControls) * 100);
    if (progress === null) progress = ({ pendiente: 0, en_desarrollo: 50, listo: 90, en_plataforma: 100 })[operational.production] || 0;
    const responsible = override.responsable && !override.responsable.toLocaleLowerCase("es").includes("sin responsable")
      ? override.responsable : "Sin asignar";
    let blocking = internal.bloqueo || "";
    if (!blocking && pendingControls > 0) blocking = `${pendingControls} controles de QA abiertos`;
    else if (!blocking && acts > 0) blocking = `${acts} ${acts === 1 ? "acto posterior por comparar" : "actos posteriores por comparar"}`;
    else if (!blocking && !hasCartography) blocking = "Falta cartografía vinculada";
    else if (!blocking && !hasPrc) blocking = "Falta confirmar IPT vigente";
    const priority = internal.prioridad || (pendingControls > 0 || acts >= 10 ? "critica" : acts >= 4 || !hasCartography || !hasPrc ? "alta" : acts > 0 ? "media" : "baja");
    let nextAction = internal.proxima_accion || "";
    if (!nextAction && pendingControls > 0) nextAction = `Resolver y documentar ${pendingControls} controles antes de aprobar el QA.`;
    else if (!nextAction && acts > 0) nextAction = `Comparar ${acts} ${acts === 1 ? "acto posterior" : "actos posteriores"} con la cartografía SIG.`;
    else if (!nextAction && !hasPrc) nextAction = "Confirmar el instrumento vigente y su fuente oficial.";
    else if (!nextAction && !hasCartography) nextAction = "Localizar, descargar y vincular la cartografía vigente.";
    else if (!nextAction && operational.qa !== "aprobado") nextAction = "Ejecutar QA de normativa, geometría, atributos y topología.";
    else if (!nextAction && operational.production !== "en_plataforma") nextAction = "Publicar la versión aprobada y registrar evidencia.";
    else if (!nextAction) nextAction = "Monitorear nuevas modificaciones o enmiendas.";
    return {
      ...operational,
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
      return (!query || haystack.includes(query))
        && (!state.internalRegion || row.region === state.internalRegion)
        && (!state.internalOwner || (state.internalOwner === "__sin_asignar__" ? internal.responsible === "Sin asignar" : internal.responsible === state.internalOwner))
        && (!state.internalStage || internal.stage === state.internalStage)
        && (!state.internalPriority || internal.priority === state.internalPriority);
    });
  }

  function alertText(row) {
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
    const sourceDetail = [row.capa_recomendada, row.archivo_recomendado].filter(Boolean).join(" · ");
    const operational = operationalStatus(row);
    const cartographyLabels = {
      encontrada: "Archivo encontrado",
      no_encontrada: "No encontrada",
      no_verificada: "No verificada",
    };
    return `
      <tr>
        <td>
          <span class="seguimiento-region">${escape(row.region)}</span>
          <strong class="seguimiento-comuna">${escape(row.comuna)}</strong>
        </td>
        <td>
          <strong class="seguimiento-ipt-name">${escape(row.prc_nombre || "No identificado")}</strong>
          <span class="seguimiento-date">${escape(row.prc_fecha || "Sin fecha")}</span>
        </td>
        <td>
          <span class="seguimiento-operational-pill cartography ${escape(operational.cartography)}">${escape(cartographyLabels[operational.cartography])}</span>
          <small title="${escape(sourceDetail)}">${escape(sourceDetail || "Sin archivo o servicio vinculado")}</small>
        </td>
        <td>
          <span class="seguimiento-operational-pill production ${escape(operational.production)}">${escape(productionLabels[operational.production])}</span>
          <small>${escape(operational.statusDate ? `Actualizado: ${operational.statusDate}` : operational.responsible)}</small>
          <small>${escape(operational.production === "en_plataforma" ? "Visible para Propiteq" : "Aún no acreditado en plataforma")}</small>
          ${operational.inconsistency ? `<small class="seguimiento-state-warning">Estado incompatible: requiere QA aprobado.</small>` : ""}
        </td>
        <td>
          <span class="seguimiento-operational-pill qa ${escape(operational.qa)}">${escape(qaLabels[operational.qa])}</span>
          <small>${escape(operational.qaDate ? `Último QA: ${operational.qaDate}` : "Sin fecha de QA")}</small>
          ${Number.isFinite(row.controles_pendientes) ? `<small>${escape(`${row.controles_pendientes} de ${row.controles_totales} controles pendientes`)}</small>` : ""}
        </td>
        <td>
          <strong class="seguimiento-alert-count">${escape(alertText(row))}</strong>
          ${row.actos_posteriores ? `<small>Cambios normativos que deben comprobarse en la cartografía.</small>` : ""}
          ${row.ultimo_acto_posterior ? `<small>Último acto: ${escape(row.ultimo_acto_posterior)}</small>` : ""}
        </td>
        <td>${escape(operational.qaDate || row.ultima_revision || "Sin QA registrado")}</td>
        <td>
          ${row.ficha_disponible ? `<button class="seguimiento-detail-button" type="button" data-seguimiento-commune="${escape(row.comuna)}">Ver ficha</button>` : ""}
        </td>
      </tr>
    `;
  }

  function internalRowTemplate({ row, internal }) {
    const alerts = Number.isFinite(row.controles_pendientes)
      ? `${row.controles_pendientes} de ${row.controles_totales} controles abiertos`
      : row.actos_posteriores ? `${row.actos_posteriores} ${row.actos_posteriores === 1 ? "acto posterior" : "actos posteriores"}` : "Sin alertas normativas abiertas";
    return `
      <tr>
        <td><span class="seguimiento-region">${escape(row.region)}</span><strong class="seguimiento-comuna">${escape(row.comuna)}</strong><small>${escape(row.prc_fecha || "PRC sin fecha")}</small></td>
        <td><span class="seguimiento-owner ${internal.responsible === "Sin asignar" ? "unassigned" : ""}">${escape(internal.responsible)}</span></td>
        <td><span class="seguimiento-stage ${escape(internal.stage)}">${escape(stageLabels[internal.stage] || internal.stage)}</span><small class="seguimiento-priority ${escape(internal.priority)}">Prioridad ${escape(priorityLabels[internal.priority] || internal.priority)}</small></td>
        <td><span class="seguimiento-operational-pill production ${escape(internal.production)}">${escape(productionLabels[internal.production])}</span><div class="seguimiento-progress" aria-label="${escape(`${internal.progress}% de avance`)}"><span style="width:${internal.progress}%"></span></div><small>${escape(`${internal.progress}% informado/calculado`)}</small></td>
        <td><span class="seguimiento-operational-pill qa ${escape(internal.qa)}">${escape(qaLabels[internal.qa])}</span><small>${escape(internal.qaDate ? `Último QA: ${internal.qaDate}` : "Sin fecha de QA")}</small></td>
        <td><strong class="seguimiento-alert-count">${escape(alerts)}</strong><small class="${internal.blocking ? "seguimiento-blocking" : ""}">${escape(internal.blocking || "Sin bloqueo técnico registrado")}</small></td>
        <td><p class="seguimiento-next-action">${escape(internal.nextAction)}</p></td>
        <td>${escape(internal.lastActivity)}</td>
        <td><button class="seguimiento-detail-button" type="button" data-seguimiento-commune="${escape(row.comuna)}">Abrir auditoría</button></td>
      </tr>`;
  }

  function renderMetrics() {
    const statuses = data().comunas.map(operationalStatus);
    if ($("seguimientoMetricPending")) $("seguimientoMetricPending").textContent = statuses.filter(item => item.production === "pendiente").length;
    if ($("seguimientoMetricDevelopment")) $("seguimientoMetricDevelopment").textContent = statuses.filter(item => item.production === "en_desarrollo").length;
    if ($("seguimientoMetricReady")) $("seguimientoMetricReady").textContent = statuses.filter(item => item.production === "listo").length;
    if ($("seguimientoMetricPlatform")) $("seguimientoMetricPlatform").textContent = statuses.filter(item => item.production === "en_plataforma").length;
  }

  function renderInternalMetrics() {
    const rows = data().comunas.map(row => internalStatus(row));
    $("seguimientoInternalUnassigned").textContent = rows.filter(item => item.responsible === "Sin asignar").length;
    $("seguimientoInternalActive").textContent = rows.filter(item => item.production === "en_desarrollo" || (item.stage === "qa" && item.qaDate)).length;
    $("seguimientoInternalBlocked").textContent = rows.filter(item => item.blocking).length;
    $("seguimientoInternalApproved").textContent = rows.filter(item => item.qa === "aprobado").length;
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

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCsv() {
    const headers = [
      "region", "comuna", "prc_nombre", "prc_fecha", "estado_fuente",
      "cartografia_estado", "estado_produccion", "fecha_estado",
      "qa_estado", "fecha_qa", "responsable", "estado_auditoria", "disponibilidad_propieteq", "motivo",
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
    $("seguimientoTableBody")?.addEventListener("click", event => {
      const button = event.target.closest("[data-seguimiento-commune]");
      if (button) openCommune(button.dataset.seguimientoCommune);
    });
    $("seguimientoInternalSearch")?.addEventListener("input", event => { state.internalSearch = event.target.value; renderInternalTable(); });
    $("seguimientoInternalRegion")?.addEventListener("change", event => { state.internalRegion = event.target.value; renderInternalTable(); });
    $("seguimientoInternalOwner")?.addEventListener("change", event => { state.internalOwner = event.target.value; renderInternalTable(); });
    $("seguimientoInternalStage")?.addEventListener("change", event => { state.internalStage = event.target.value; renderInternalTable(); });
    $("seguimientoInternalPriority")?.addEventListener("change", event => { state.internalPriority = event.target.value; renderInternalTable(); });
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
    renderView();
  };

  bindEvents();
  window.renderSeguimientoNormativo();
})();
