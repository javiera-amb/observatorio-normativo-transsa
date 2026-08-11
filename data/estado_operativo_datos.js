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
