window.ESTADO_OPERATIVO_DATOS = {
  corte: "2026-08-11",
  destino_publicacion: "Transsa / Propiteq",
  criterio: "El equipo actualiza el estado de producción. El QA se registra de forma independiente después de comparar cartografía, normativa y cambios aplicables.",
  valores_permitidos: {
    estado_produccion: ["pendiente", "en_desarrollo", "listo", "en_plataforma"],
    qa: ["pendiente", "observaciones", "aprobado"],
    etapa_interna: ["levantamiento", "comparacion", "actualizacion_sig", "qa", "publicacion"],
    prioridad: ["critica", "alta", "media", "baja"]
  },
  equipo: [
    { nombre: "Cristóbal", rol: "Producción SIG" },
    { nombre: "Annabel", rol: "Producción SIG" },
    { nombre: "Fernanda", rol: "Coordinación y revisión" },
    { nombre: "Javiera", rol: "Administración y QA" }
  ],
  // Son los 44 PRC que ya estaban construidos y visibles en Propiteq al corte.
  // Se cargan como "en la plataforma" porque existe publicación, pero con QA pendiente.
  prc_publicados_sin_qa: [
    "Chiguayante", "Chillán", "Chillán Viejo", "Colina", "Concepción", "Coquimbo", "Coyhaique", "Estación Central", "Frutillar", "Hualpén", "Huechuraba", "Independencia", "Iquique", "La Cisterna", "La Florida", "La Reina", "La Serena", "Las Condes", "Lo Barnechea", "Macul", "Maipú", "Melipilla", "Ñuñoa", "Osorno", "Peñalolén", "Providencia", "Pudahuel", "Puente Alto", "Puerto Montt", "Puerto Octay", "Puerto Varas", "Quinta Normal", "Rancagua", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Pedro de la Paz", "Santiago", "Talca", "Temuco", "Valdivia", "Viña del Mar", "Vitacura"
  ],
  fuente_publicacion_propiteq: {
    tipo: "tabla_drive",
    url: "",
    descripcion: "Tabla administrada por el equipo con comuna, arriba_en_propiteq (Sí/No), fecha de publicación y enlace de evidencia."
  },
  // Clave: "Región|Comuna". Solo registrar hechos confirmados por el equipo.
  // Ejemplo:
  // "Coquimbo|Coquimbo": {
  //   estado_produccion: "en_plataforma",
  //   qa: "aprobado",
  //   fecha_estado: "2026-08-11",
  //   fecha_qa: "2026-08-11",
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
  comunas: {},

  // Clave: nombre exacto de la capa territorial en el Diccionario de Datos.
  capas: {}
};
