(() => {
  "use strict";

  const rows = Array.isArray(window.ACTOS_IPT_ROWS) ? window.ACTOS_IPT_ROWS : [];
  const reviews = window.REVISION_SIG_IPT && typeof window.REVISION_SIG_IPT === "object"
    ? window.REVISION_SIG_IPT
    : {};
  const PORTAL = "https://portalipt.minvu.cl/instrumentos";

  const acts = rows.map(row => {
    const act = {
      id: row[0],
      registro_portal: null,
      region: row[1],
      comunas: Array.isArray(row[2]) ? row[2] : [],
      nivel_planificacion: row[3] || "",
      tipo_ipt: row[4] || "",
      clasificacion_portal: "Modificación",
      tipo_acto: row[11] || "Modificación",
      titulo: row[5] || "Acto sin denominación",
      estado: row[6] || "",
      fecha: row[7] || "",
      fecha_derogacion: row[8] || "",
      fecha_ultimo_hito: row[9] || "",
      codigos_origen_afectados: Array.isArray(row[10]) ? row[10] : [],
      vinculacion_origen: Array.isArray(row[10]) && row[10].length ? "vinculado" : "pendiente",
      incorporacion_sig: "pendiente_revision",
      estado_revision: "Pendiente",
      fundamento_revision: "",
      fuente_oficial: PORTAL,
      fuente_cartografia: "",
      documentos: [],
      zonas_afectadas: [],
      archivo_geojson_cambio: "",
      evidencia_sig: "",
      modificacion_limite_urbano: row[12] || "",
      eae: row[13] || "",
      fecha_inicio_eae: row[14] || "",
      fecha_termino_eae: row[15] || "",
      consulta_indigena: row[16] || ""
    };

    const review = reviews[act.id] || {};
    return {
      ...act,
      ...review,
      id: act.id,
      codigos_origen_afectados: act.codigos_origen_afectados,
      comunas: act.comunas
    };
  });

  const count = type => acts.filter(act => act.tipo_acto === type).length;
  const modifications = acts.filter(act => String(act.tipo_acto).startsWith("Modificación")).length;
  const linked = acts.filter(act => act.codigos_origen_afectados.length).length;
  const pendingSig = acts.filter(act => act.incorporacion_sig === "pendiente_revision").length;
  const maxDate = acts
    .map(act => act.fecha)
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1) || "";

  window.ACTOS_IPT = {
    fecha_carga: new Date().toISOString(),
    corte_fuente: maxDate,
    fuente: "Portal IPT MINVU - sincronización automática",
    resumen: {
      total: acts.length,
      modificaciones: modifications,
      enmiendas: count("Enmienda"),
      rectificaciones: count("Rectificación"),
      interpretaciones: count("Interpretación"),
      planos_detalle: count("Plano de detalle"),
      vinculados_origen: linked,
      pendientes_vinculacion: acts.length - linked,
      pendientes_revision_sig: pendingSig
    },
    actos: acts,
    nota: "Los datos oficiales se sincronizan automáticamente. La revisión cartográfica se conserva por separado en data/revision_sig_ipt.js."
  };
})();
