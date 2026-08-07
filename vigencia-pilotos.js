(() => {
  "use strict";

  const catalog = window.VIGENCIA_CARTOGRAFICA;
  const comparisons = window.COMPARACIONES_IPT || { versiones: {}, actos_por_comuna: {} };
  if (!catalog || !Array.isArray(catalog.instrumentos)) return;

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  const dateValue = value => validDate(value) ? value : "9999-99-99";

  const GENERIC_NAME_TOKENS = new Set([
    "plan", "plano", "regulador", "reguladora", "comunal", "intercomunal",
    "metropolitano", "regional", "desarrollo", "urbano", "seccional",
    "limite", "sector", "localidad", "localidades", "incluye",
    "actualizacion", "modificacion", "modificado", "nuevo", "nueva", "de",
    "del", "la", "las", "los", "el", "y"
  ]);

  function significantNameTokens(plan, item) {
    const communeTokens = new Set(normalize(item.comuna).split("_").filter(Boolean));
    return new Set(
      normalize(plan.nombre)
        .split("_")
        .filter(token => token.length > 2)
        .filter(token => !GENERIC_NAME_TOKENS.has(token))
        .filter(token => !communeTokens.has(token))
        .filter(token => !/^\d{4}$/.test(token))
    );
  }

  function overlapCoefficient(left, right) {
    if (!left.size || !right.size) return 0;
    const intersection = [...left].filter(token => right.has(token)).length;
    return intersection / Math.min(left.size, right.size);
  }

  function sameInstrumentLineage(previous, current, type, item) {
    const explicitKey = `${previous.registro}__${current.registro}`;
    if (comparisons.versiones?.[explicitKey]) return true;

    const previousName = normalize(previous.nombre);
    const currentName = normalize(current.nombre);
    if (previousName && previousName === currentName) return true;

    const previousTokens = significantNameTokens(previous, item);
    const currentTokens = significantNameTokens(current, item);
    const similarity = overlapCoefficient(previousTokens, currentTokens);

    const thresholds = {
      PRC: 0.55,
      PRI: 0.65,
      PRM: 0.65,
      PRDU: 0.65,
      PS: 0.75,
      LU: 0.75
    };

    return similarity >= (thresholds[type] ?? 0.7);
  }

  function comparisonPairs(item) {
    const plans = Array.isArray(item.instrumentos) ? item.instrumentos : [];
    const grouped = new Map();

    plans.forEach(plan => {
      const type = String(plan.tipo_ipt || "IPT");
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(plan);
    });

    const pairs = [];
    const pairKeys = new Set();

    grouped.forEach((typePlans, type) => {
      const ordered = [...typePlans]
        .filter(plan => plan.registro !== undefined && plan.registro !== null)
        .sort((left, right) => dateValue(left.fecha).localeCompare(dateValue(right.fecha)));

      for (let currentIndex = 1; currentIndex < ordered.length; currentIndex += 1) {
        const current = ordered[currentIndex];
        let previous = null;

        for (let previousIndex = currentIndex - 1; previousIndex >= 0; previousIndex -= 1) {
          const candidate = ordered[previousIndex];
          if (sameInstrumentLineage(candidate, current, type, item)) {
            previous = candidate;
            break;
          }
        }

        if (!previous) continue;

        const key = `${previous.registro}__${current.registro}`;
        if (pairKeys.has(key)) continue;
        pairKeys.add(key);

        const reviewed = comparisons.versiones?.[key];
        pairs.push(reviewed || {
          id: `comparison-${key}`,
          region: item.region,
          comuna: item.comuna,
          tipo_ipt: type,
          estado_analisis: "pendiente_documentos",
          estado_sig: "pendiente_revision",
          instrumento_anterior: previous,
          instrumento_nuevo: current,
          resumen_estrategico: `Se detectó una nueva versión del mismo instrumento: ${previous.nombre || type} (${previous.fecha || "sin fecha"}) y ${current.nombre || type} (${current.fecha || "sin fecha"}). Falta comparar ordenanza, memoria, planos y cartografía para identificar los cambios normativos efectivos y su impacto urbano.`,
          materias_a_comparar: [
            "Límite urbano y extensión territorial",
            "Zonificación y usos de suelo",
            "Densidad, constructibilidad y ocupación de suelo",
            "Alturas, subdivisión predial y antejardines",
            "Vialidad estructurante y declaratorias de utilidad pública",
            "Áreas de riesgo, protección y espacios públicos"
          ],
          cambios: []
        });
      }
    });

    return pairs;
  }

  function timelineFromAct(act) {
    return {
      id: act.id,
      fecha: act.fecha || "Sin fecha",
      tipo: act.tipo_acto || "Modificación",
      numero: act.evidencia || "",
      estado: act.estado || "",
      titulo: act.titulo || "Acto normativo",
      resumen: [act.fundamento_revision, act.impacto_urbano].filter(Boolean).join(" "),
      incorporacion: act.incorporacion_sig || "pendiente_revision",
      fuente: act.fuente_oficial || "",
      zonas_afectadas: act.zonas_afectadas || []
    };
  }

  function buildConsolidatedPrc(item) {
    const plans = Array.isArray(item.instrumentos) ? item.instrumentos : [];
    const prcPlans = plans
      .filter(plan => plan.tipo_ipt === "PRC")
      .sort((left, right) => dateValue(right.fecha).localeCompare(dateValue(left.fecha)));
    const sectionals = plans
      .filter(plan => plan.tipo_ipt === "PS")
      .sort((left, right) => dateValue(left.fecha).localeCompare(dateValue(right.fecha)))
      .map(plan => ({
        ...plan,
        relacion_prc: "sustituye_normativa_sectorial",
        descripcion_relacion: "Reemplaza la normativa del PRC dentro de su ámbito territorial de aplicación.",
        estado_integracion_documental: "pendiente_revision",
        estado_integracion_sig: "pendiente_revision"
      }));
    const urbanLimits = plans
      .filter(plan => plan.tipo_ipt === "LU")
      .sort((left, right) => dateValue(right.fecha).localeCompare(dateValue(left.fecha)));

    const prcBase = prcPlans[0] || null;
    const state = prcBase
      ? (sectionals.length ? "prc_con_seccionales" : "prc_sin_seccionales")
      : (sectionals.length ? "seccionales_sin_prc_base_identificado" : "sin_prc_identificado");

    return {
      estado: state,
      prc_base: prcBase,
      versiones_prc: prcPlans,
      seccionales: sectionals,
      limites_urbanos: urbanLimits,
      cantidad_seccionales: sectionals.length,
      criterio_aplicacion: "El PRC constituye la base comunal. Cada plan seccional se mantiene como instrumento independiente y sustituye la normativa del PRC únicamente dentro de su polígono de aplicación.",
      estado_integracion_sig: sectionals.length ? "pendiente_revision" : "no_aplica",
      resumen: prcBase
        ? `${prcBase.nombre} funciona como instrumento base comunal${sectionals.length ? ` y debe leerse junto con ${sectionals.length} ${sectionals.length === 1 ? "plan seccional" : "planes seccionales"} que reemplazan su normativa en sectores específicos` : ""}.`
        : sectionals.length
          ? `Se registran ${sectionals.length} planes seccionales, pero todavía no se ha identificado un PRC base vigente para construir la lectura consolidada.`
          : "No se ha identificado un PRC base ni planes seccionales vigentes en la base cargada."
    };
  }

  catalog.instrumentos.forEach(item => {
    const communeKey = `${normalize(item.region)}__${normalize(item.comuna)}`;
    const acts = Array.isArray(comparisons.actos_por_comuna?.[communeKey])
      ? comparisons.actos_por_comuna[communeKey]
      : [];
    const versionComparisons = comparisonPairs(item);
    const consolidatedPrc = buildConsolidatedPrc(item);

    item.actos_normativos = acts;
    item.cantidad_actos = acts.length;
    item.comparaciones_versiones = versionComparisons;
    item.marco_comunal_consolidado = consolidatedPrc;
    item.actos_posteriores_pendientes = acts.filter(act =>
      act.incorporacion_sig === "pendiente_revision" ||
      act.vinculacion_origen === "pendiente" ||
      act.vinculacion_origen === "discrepancia_por_resolver"
    ).length;

    const baseTimeline = Array.isArray(item.linea_tiempo) ? item.linea_tiempo : [];
    const actIds = new Set(acts.map(act => act.id));
    const cleanBase = baseTimeline.filter(event => !actIds.has(event.id));
    item.linea_tiempo = [...cleanBase, ...acts.map(timelineFromAct)]
      .sort((left, right) => dateValue(left.fecha).localeCompare(dateValue(right.fecha)));

    const intercommunalPlans = (item.instrumentos || [])
      .filter(plan => plan.tipo_ipt === "PRI" || plan.tipo_ipt === "PRM")
      .sort((left, right) => dateValue(right.fecha).localeCompare(dateValue(left.fecha)));

    const validatedComparison = versionComparisons.find(comparison => comparison.estado_analisis === "validado");
    const reviewedComparison = versionComparisons.find(comparison => comparison.estado_analisis === "en_revision");
    const strategicSource = validatedComparison || reviewedComparison || versionComparisons[0];

    item.lectura_estrategica = {
      instrumento_comunal_principal: consolidatedPrc.prc_base || consolidatedPrc.limites_urbanos[0] || null,
      instrumento_intercomunal_principal: intercommunalPlans[0] || null,
      comparaciones_pendientes: versionComparisons.filter(comparison => comparison.estado_analisis !== "validado").length,
      modificaciones_vigentes: acts.filter(act => act.estado === "Vigente").length,
      seccionales_integrados: consolidatedPrc.cantidad_seccionales,
      verificaciones_sig_pendientes: acts.filter(act => act.incorporacion_sig === "pendiente_revision").length
        + versionComparisons.filter(comparison => comparison.estado_sig === "pendiente_revision").length
        + consolidatedPrc.seccionales.filter(plan => plan.estado_integracion_sig === "pendiente_revision").length,
      resumen: strategicSource?.resumen_estrategico
        || `${consolidatedPrc.resumen} Los planes distintos se mantienen como instrumentos independientes; solo se comparan versiones que pertenecen a la misma línea normativa.`,
      advertencia: "La consolidación es analítica y cartográfica: no elimina la identidad jurídica de los planes seccionales. Cada uno debe conservar su fuente, vigencia, polígono y normas propias."
    };
  });

  const all = catalog.instrumentos;
  catalog.resumen.instrumentos = all.length;
  catalog.resumen.comunas = all.length;
  catalog.resumen.revision_necesaria = all.filter(item => item.estado_alerta === "Revisión necesaria").length;
  catalog.resumen.actualizados = all.filter(item => item.estado_alerta === "Actualizado").length;
  catalog.resumen.probablemente_actualizados = all.filter(item => item.estado_alerta === "Probablemente actualizado").length;
  catalog.resumen.desactualizados = all.filter(item => item.estado_alerta === "Desactualizado").length;
  catalog.resumen.sin_cartografia = all.filter(item => item.estado_alerta === "Sin cartografía").length;

  if (typeof renderVigencia === "function") renderVigencia();
})();
