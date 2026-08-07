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

  function comparisonPairs(item) {
    const plans = Array.isArray(item.instrumentos) ? item.instrumentos : [];
    const grouped = new Map();

    plans.forEach(plan => {
      const type = String(plan.tipo_ipt || "IPT");
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(plan);
    });

    const pairs = [];
    grouped.forEach((typePlans, type) => {
      const ordered = [...typePlans]
        .filter(plan => plan.registro !== undefined && plan.registro !== null)
        .sort((left, right) => dateValue(left.fecha).localeCompare(dateValue(right.fecha)));

      for (let index = 1; index < ordered.length; index += 1) {
        const previous = ordered[index - 1];
        const current = ordered[index];
        const key = `${previous.registro}__${current.registro}`;
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
          resumen_estrategico: `Se detectó una transición entre ${previous.nombre || type} (${previous.fecha || "sin fecha"}) y ${current.nombre || type} (${current.fecha || "sin fecha"}). Falta comparar ordenanza, memoria, planos y cartografía para identificar los cambios normativos efectivos y su impacto urbano.`,
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

  catalog.instrumentos.forEach(item => {
    const communeKey = `${normalize(item.region)}__${normalize(item.comuna)}`;
    const acts = Array.isArray(comparisons.actos_por_comuna?.[communeKey])
      ? comparisons.actos_por_comuna[communeKey]
      : [];
    const versionComparisons = comparisonPairs(item);

    item.actos_normativos = acts;
    item.cantidad_actos = acts.length;
    item.comparaciones_versiones = versionComparisons;
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

    const communalPlans = (item.instrumentos || [])
      .filter(plan => plan.tipo_ipt === "PRC" || plan.tipo_ipt === "PS" || plan.tipo_ipt === "LU")
      .sort((left, right) => dateValue(right.fecha).localeCompare(dateValue(left.fecha)));
    const intercommunalPlans = (item.instrumentos || [])
      .filter(plan => plan.tipo_ipt === "PRI" || plan.tipo_ipt === "PRM")
      .sort((left, right) => dateValue(right.fecha).localeCompare(dateValue(left.fecha)));

    const validatedComparison = versionComparisons.find(comparison => comparison.estado_analisis === "validado");
    const reviewedComparison = versionComparisons.find(comparison => comparison.estado_analisis === "en_revision");
    const strategicSource = validatedComparison || reviewedComparison || versionComparisons[0];

    item.lectura_estrategica = {
      instrumento_comunal_principal: communalPlans[0] || null,
      instrumento_intercomunal_principal: intercommunalPlans[0] || null,
      comparaciones_pendientes: versionComparisons.filter(comparison => comparison.estado_analisis !== "validado").length,
      modificaciones_vigentes: acts.filter(act => act.estado === "Vigente").length,
      verificaciones_sig_pendientes: acts.filter(act => act.incorporacion_sig === "pendiente_revision").length
        + versionComparisons.filter(comparison => comparison.estado_sig === "pendiente_revision").length,
      resumen: strategicSource?.resumen_estrategico
        || `En ${item.comuna} se registran ${item.cantidad_instrumentos || 0} instrumentos vigentes aplicables. La lectura estratégica debe distinguir el instrumento comunal, el marco intercomunal y los actos posteriores que alteran la capacidad de desarrollo.`,
      advertencia: "La interpretación estratégica identifica oportunidades y restricciones normativas, pero cada conclusión debe respaldarse con ordenanza, planos oficiales y verificación SIG."
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
