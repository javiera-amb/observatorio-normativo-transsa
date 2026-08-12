window.ESTADO_OPERATIVO_DATOS = {
  corte: "2026-08-12",
  destino_publicacion: "Transsa / Propiteq",
  criterio: "El equipo actualiza el estado de producción. El QA se registra de forma independiente después de comparar cartografía, normativa y cambios aplicables.",
  valores_permitidos: {
    estado_produccion: ["pendiente", "en_desarrollo", "actualizado", "enviado"],
    qa_plataforma: ["pendiente", "observaciones", "aprobado"],
    qa_sharepoint: ["pendiente", "observaciones", "aprobado"],
    etapa_interna: ["levantamiento", "comparacion", "actualizacion_sig", "qa", "publicacion"],
    prioridad: ["critica", "alta", "media", "baja"]
  },
  equipo: [
    { nombre: "Cristóbal", rol: "Producción SIG" },
    { nombre: "Annabel", rol: "Producción SIG" },
    { nombre: "Fernanda", rol: "Producción SIG" },
    { nombre: "Javiera", rol: "Administración y QA" }
  ],
  // Son los 44 PRC construidos que forman el inventario histórico de Propiteq.
  // El estado enviado deja la carga del visor a cargo de Propiteq.
  prc_publicados_sin_qa: [
    "Chiguayante", "Chillán", "Chillán Viejo", "Colina", "Concepción", "Coquimbo", "Coyhaique", "Estación Central", "Frutillar", "Hualpén", "Huechuraba", "Independencia", "Iquique", "La Cisterna", "La Florida", "La Reina", "La Serena", "Las Condes", "Lo Barnechea", "Macul", "Maipú", "Melipilla", "Ñuñoa", "Osorno", "Peñalolén", "Providencia", "Pudahuel", "Puente Alto", "Puerto Montt", "Puerto Octay", "Puerto Varas", "Quinta Normal", "Rancagua", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Pedro de la Paz", "Santiago", "Talca", "Temuco", "Valdivia", "Viña del Mar", "Vitacura"
  ],
  fuente_publicacion_propiteq: {
    tipo: "tabla_sharepoint",
    url: "https://transsa.sharepoint.com/:x:/s/DEI/IQCb9mHRTxIRTrh2zci6DE4ZAa-AHtxnXz_E1IxSIq9FHWg?e=IAoqb9",
    columna_estado: "estado_produccion",
    descripcion: "Tabla SharePoint del equipo DEI con comuna, estado_produccion, qa_sharepoint, fecha, observaciones y evidencia. Estados: pendiente, en desarrollo, actualizado o enviado. Reemplaza la columna Sí/No."
  },
  criterio_produccion_directa: "PRC identificado, archivo vinculado, sin actos posteriores detectados y apto preliminarmente para visor. Antes de marcar actualizado se debe homologar la columna de usos al lenguaje Transsa.",
  // Clave: "Región|Comuna". Solo registrar hechos confirmados por el equipo.
  // Ejemplo:
  // "Coquimbo|Coquimbo": {
  //   estado_produccion: "enviado",
  //   qa_sharepoint: "aprobado",
  //   fecha_estado: "2026-08-11",
  //   fecha_qa_sharepoint: "2026-08-11",
  //   responsable: "Nombre Apellido",
  //   evidencia: "URL o identificador del dataset publicado",
  //   nota: "QA aprobado y capa visible en Propiteq",
  //   interno: {
  //     etapa: "qa",
  //     prioridad: "alta",
  //     avance: 80,
  //     proxima_accion: "Resolver observaciones y registrar evidencia",
  //     bloqueo: "Falta validar topología",
  //     fecha_actividad: "2026-08-11"
  //   }
  // }
  comunas: {
    // Registrado por el equipo en SharePoint. Enviado no equivale todavía a visible.
    "Metropolitana de Santiago|Las Condes": {
      estado_produccion: "enviado",
      nota_propiteq: "Versión enviada a Propiteq; la carga al visor queda a cargo de Propiteq.",
      interno: {
        etapa: "publicacion",
        prioridad: "alta",
        proxima_accion: "Confirmar visibilidad en el visor Propiteq y registrar evidencia.",
        fecha_actividad: "2026-08-12"
      }
    }
  },

  // Clave: nombre exacto de la capa territorial en el Diccionario de Datos.
  capas: {}
};
