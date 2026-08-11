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

  function versionCoverage(meta, commune) {
    for (const version of meta.versiones || []) {
      if ((version.comunas || []).some(name => normalize(name) === normalize(commune.comuna))) {
        return {
          state: "declarada",
          label: `Incluida en versión ${version.version}`,
          detail: [version.fecha_archivo ? `Archivo ${version.fecha_archivo}` : `Versión ${version.fecha}`, version.observacion].filter(Boolean).join(" · "),
          dataDate: version.fecha_archivo || version.fecha
        };
      }
    }
    return { state: "pendiente", label: "No declarada en el consolidado", detail: "No significa que la comuna no tenga PRC; solo que no está nombrada en las versiones del GeoPackage consolidado.", dataDate: meta.fecha_dato };
  }

  function territorialCoverage(layer, commune) {
    const meta = coverageSource().capas[layer.nombre] || { modo: "por_confirmar", fecha_dato: "Sin fecha del dato", detalle: "La ficha no declara cobertura comunal." };
    const regionMatch = (meta.regiones || []).some(region => normalize(region) === normalize(commune.region));
    const communeMatch = (meta.comunas || []).some(name => normalize(name) === normalize(commune.comuna));
    let result;
    switch (meta.modo) {
      case "nacional_declarada":
        result = { state: "pendiente", label: "Alcance nacional declarado", detail: "El alcance proviene de la ficha o fuente; falta ejecutar el cruce para confirmar presencia y cantidad de elementos en la comuna." };
        break;
      case "comunas_versionadas":
        result = versionCoverage(meta, commune);
        break;
      case "comunas_declaradas":
        result = communeMatch
          ? { state: "declarada", label: "Comuna declarada en la ficha", detail: meta.detalle }
          : { state: "pendiente", label: "Cobertura no acreditada", detail: "La ficha solo enumera otras comunas." };
        break;
      case "regiones_y_comunas":
        result = regionMatch || communeMatch
          ? { state: "declarada", label: regionMatch ? "Región declarada en la ficha" : "Comuna declarada en la ficha", detail: meta.detalle }
          : { state: "pendiente", label: "Cobertura no acreditada", detail: "La comuna no aparece en el alcance documentado." };
        break;
      case "region_exclusiva_por_confirmar":
        result = regionMatch
          ? { state: "pendiente", label: "Dentro del ámbito; falta cruce", detail: meta.detalle }
          : { state: "no_aplica", label: "Fuera del ámbito territorial", detail: `La ficha restringe la capa a ${meta.regiones.join(", ")}.` };
        break;
      case "proceso":
        result = { state: "proceso", label: "Proceso, no capa consumible", detail: meta.detalle };
        break;
      default:
        result = { state: "pendiente", label: "Por confirmar con archivo", detail: meta.detalle || "La ficha no enumera cobertura comunal." };
    }
    return { ...result, dataDate: result.dataDate || meta.fecha_dato || "Sin fecha del dato", dateLabel: meta.fecha_etiqueta || "Fecha del dato" };
  }

  function coverageRow(layer, result) {
    const formats = layer.formatos?.length ? layer.formatos.join(" · ") : "Revisar ficha";
    const categories = layer.categorias?.length ? layer.categorias.join(" · ") : "Sin categoría";
    const override = operationalSource().capas?.[layer.nombre] || {};
    const meta = coverageSource().capas[layer.nombre] || {};
    const cartography = layer.formatos?.length
      ? "encontrada"
      : meta.modo === "nacional_declarada" ? "fuente_nacional"
        : result.state === "proceso" ? "no_acreditada" : "no_verificada";
    const production = override.estado_produccion || "pendiente";
    const qa = override.qa || "pendiente";
    return `
      <tr>
        <td><span class="capas-table-category">${escape(categories)}</span><strong>${escape(layer.nombre)}</strong><small>${escape(layer.owner || "Sin responsable")}</small></td>
        <td><span class="capas-coverage-pill ${escape(result.state)}">${escape(result.label)}</span><small>${escape(result.detail)}</small></td>
        <td><span class="capas-status-pill ${escape(cartography)}">${escape(cartographyLabels[cartography])}</span><small>${escape(cartography === "fuente_nacional" ? "Alcance nacional declarado; falta vincular el archivo fuente." : formats)}</small></td>
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
      .filter(item => !query || normalize([item.layer.nombre, ...(item.layer.categorias || []), item.layer.owner].join(" ")).includes(query));
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
    $("capasMetricCovered").textContent = territorial.filter(item => item.result.state === "declarada").length;
    $("capasMetricPending").textContent = territorial.filter(item => item.result.state === "pendiente").length;
    $("capasMetricNotApplicable").textContent = territorial.filter(item => ["no_aplica", "proceso"].includes(item.result.state)).length;
  }

  function render() {
    const commune = selectedCommune();
    state.commune = commune.comuna;
    $("capasSelectedTitle").textContent = `Cobertura de ${commune.comuna}`;
    const ipt = renderIpt();
    const territorial = renderTerritorial();
    renderMetrics(ipt, territorial);
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
