(() => {
  "use strict";

  const rows = Array.isArray(window.ACTOS_IPT_ROWS) ? window.ACTOS_IPT_ROWS : [];
  const reports = Array.isArray(window.REPORTES) ? window.REPORTES : [];
  const reviews = window.REVISION_SIG_IPT && typeof window.REVISION_SIG_IPT === "object"
    ? window.REVISION_SIG_IPT
    : {};
  const PORTAL = "https://portalipt.minvu.cl/instrumentos";

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bregion\b/g, " ")
    .replace(/\bdel\b|\bde\b|\bla\b|\blas\b|\blos\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const titleCase = value => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])([a-záéíóúñ])/g, (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\bDe\b/g, "de")
    .replace(/\bDel\b/g, "del")
    .replace(/\bLa\b/g, "la")
    .replace(/\bLas\b/g, "las")
    .replace(/\bLos\b/g, "los")
    .replace(/\bY\b/g, "y");

  const normalizeRegion = value => {
    const text = String(value || "").trim()
      .replace(/^Región\s+(de\s+|del\s+)?/i, "")
      .replace(/^Región\s+/i, "");
    const key = normalize(text);
    const names = {
      metropolitana: "Metropolitana de Santiago",
      "metropolitana santiago": "Metropolitana de Santiago",
      maule: "Maule",
      nuble: "Ñuble",
      biobio: "Biobío",
      araucania: "La Araucanía",
      "los rios": "Los Ríos",
      "los lagos": "Los Lagos",
      aysen: "Aysén del General Carlos Ibáñez del Campo",
      magallanes: "Magallanes y de la Antártica Chilena",
      valparaiso: "Valparaíso",
      coquimbo: "Coquimbo",
      atacama: "Atacama",
      antofagasta: "Antofagasta",
      tarapaca: "Tarapacá",
      "arica parinacota": "Arica y Parinacota",
      ohiggins: "Libertador General Bernardo O'Higgins",
      "libertador general bernardo ohiggins": "Libertador General Bernardo O'Higgins"
    };
    return names[key] || titleCase(text);
  };

  const inferActType = value => {
    const text = normalize(value);
    if (text.includes("enmienda")) return "Enmienda";
    if (text.includes("rectific")) return "Rectificación";
    if (text.includes("interpret")) return "Interpretación";
    if (text.includes("plano de detalle")) return "Plano de detalle";
    if (text.includes("seccional") && text.includes("modific")) return "Modificación mediante seccional";
    return "Modificación";
  };

  const isPlanningPublication = report => {
    const text = normalize([
      report.titulo,
      report.resumen,
      report.implicancia,
      report.tipo_norma
    ].join(" "));
    const instrumentTerms = [
      "plan regulador", "plan seccional", "plano seccional", "limite urbano",
      "instrumento planificacion territorial", " prc ", " pri ", " prm ", " prdu "
    ];
    const actionTerms = [
      "enmienda", "modific", "rectific", "aprueba", "promulga", "reemplaza",
      "deja sin efecto", "actualiza", "altera"
    ];
    const padded = ` ${text} `;
    return instrumentTerms.some(term => padded.includes(term))
      && actionTerms.some(term => padded.includes(term));
  };

  const tokenSet = value => new Set(
    normalize(value)
      .split(" ")
      .filter(token => token.length > 3)
      .filter(token => ![
        "plan", "regulador", "comunal", "intercomunal", "metropolitano",
        "modificacion", "modifica", "aprueba", "decreto", "resolucion",
        "exento", "exenta", "numero", "region", "comuna"
      ].includes(token))
  );

  const similarity = (left, right) => {
    const a = tokenSet(left);
    const b = tokenSet(right);
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter(token => b.has(token)).length;
    return intersection / Math.min(a.size, b.size);
  };

  const dateDistance = (left, right) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(left || "") || !/^\d{4}-\d{2}-\d{2}$/.test(right || "")) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.abs(new Date(`${left}T12:00:00Z`) - new Date(`${right}T12:00:00Z`)) / 86400000;
  };

  const communeOverlap = (left, right) => {
    const leftSet = new Set((left || []).map(normalize));
    return (right || []).some(commune => leftSet.has(normalize(commune)));
  };

  const applyReview = act => {
    const review = reviews[act.id] || {};
    return {
      ...act,
      ...review,
      id: act.id,
      codigos_origen_afectados: act.codigos_origen_afectados,
      comunas: act.comunas
    };
  };

  const portalActs = rows.map(row => ({
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
    consulta_indigena: row[16] || "",
    sistema_origen: "Portal IPT",
    confirmacion_portal: "confirmado"
  }));

  const diarioCandidates = reports
    .filter(isPlanningPublication)
    .map(report => ({
      id: `acto-do-${report.cve || report.event_id || normalize(report.titulo).replaceAll(" ", "-").slice(0, 50)}`,
      registro_portal: null,
      region: normalizeRegion(report.region),
      comunas: report.comuna ? [titleCase(report.comuna)] : [],
      nivel_planificacion: report.escala || "",
      tipo_ipt: "",
      clasificacion_portal: "Pendiente de validar",
      tipo_acto: inferActType(report.titulo),
      titulo: report.titulo || "Publicación IPT detectada en Diario Oficial",
      estado: "Detectado en Diario Oficial",
      fecha: report.fecha || "",
      fecha_derogacion: "",
      fecha_ultimo_hito: "",
      codigos_origen_afectados: [],
      vinculacion_origen: "pendiente",
      incorporacion_sig: "pendiente_revision",
      estado_revision: "Pendiente de validar en Portal IPT",
      fundamento_revision: report.resumen || report.implicancia || "",
      fuente_oficial: report.source_url || "",
      fuente_cartografia: "",
      documentos: report.source_url ? [report.source_url] : [],
      zonas_afectadas: [],
      archivo_geojson_cambio: "",
      evidencia_sig: "",
      cve: report.cve || "",
      event_id: report.event_id || "",
      sistema_origen: "Diario Oficial",
      confirmacion_portal: "pendiente",
      es_alerta_preliminar: true
    }));

  const acts = [...portalActs];
  diarioCandidates.forEach(candidate => {
    const match = acts.find(act => {
      if (!communeOverlap(act.comunas, candidate.comunas)) return false;
      if (inferActType(act.tipo_acto) !== inferActType(candidate.tipo_acto)) return false;
      const distance = dateDistance(act.fecha, candidate.fecha);
      const titleSimilarity = similarity(act.titulo, candidate.titulo);
      return (distance === 0 && titleSimilarity >= 0.2)
        || (distance <= 14 && titleSimilarity >= 0.55);
    });

    if (match) {
      match.deteccion_diario = {
        fecha: candidate.fecha,
        cve: candidate.cve,
        event_id: candidate.event_id,
        fuente: candidate.fuente_oficial
      };
      match.documentos = [...new Set([...(match.documentos || []), ...(candidate.documentos || [])])];
      return;
    }

    acts.push(candidate);
  });

  const reviewedActs = acts.map(applyReview);
  const count = type => reviewedActs.filter(act => act.tipo_acto === type).length;
  const modifications = reviewedActs.filter(act => String(act.tipo_acto).startsWith("Modificación")).length;
  const linked = reviewedActs.filter(act => act.codigos_origen_afectados.length).length;
  const pendingSig = reviewedActs.filter(act => act.incorporacion_sig === "pendiente_revision").length;
  const preliminary = reviewedActs.filter(act => act.es_alerta_preliminar).length;
  const maxDate = reviewedActs
    .map(act => act.fecha)
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1) || "";

  window.ACTOS_IPT = {
    fecha_carga: new Date().toISOString(),
    corte_fuente: maxDate,
    fuente: "Portal IPT MINVU + detección diaria del Diario Oficial",
    resumen: {
      total: reviewedActs.length,
      modificaciones: modifications,
      enmiendas: count("Enmienda"),
      rectificaciones: count("Rectificación"),
      interpretaciones: count("Interpretación"),
      planos_detalle: count("Plano de detalle"),
      vinculados_origen: linked,
      pendientes_vinculacion: reviewedActs.length - linked,
      pendientes_revision_sig: pendingSig,
      alertas_diario_oficial: preliminary
    },
    actos: reviewedActs,
    nota: "Las publicaciones IPT del Diario Oficial aparecen de inmediato como alertas preliminares. El Portal IPT confirma y consolida el acto posteriormente. La revisión cartográfica se conserva por separado en data/revision_sig_ipt.js."
  };
})();
