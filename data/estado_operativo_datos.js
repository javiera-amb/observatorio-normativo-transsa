window.ESTADO_OPERATIVO_DATOS = {
  corte: "2026-08-11",
  destino_publicacion: "Transsa / Propiteq",
  criterio: "Un archivo encontrado no se considera publicado ni con QA completo sin un registro operativo explícito.",
  valores_permitidos: {
    publicacion: ["no_registrada", "en_preparacion", "publicada"],
    qa: ["pendiente", "en_proceso", "completo"]
  },
  // Clave: "Región|Comuna". Solo registrar hechos confirmados por el equipo.
  // Ejemplo:
  // "Coquimbo|Coquimbo": {
  //   publicacion: "publicada",
  //   qa: "completo",
  //   fecha_publicacion: "2026-08-11",
  //   fecha_qa: "2026-08-11",
  //   responsable: "Nombre Apellido",
  //   evidencia: "URL o identificador del dataset publicado",
  //   nota: "Control final aprobado"
  // }
  comunas: {},

  // Clave: nombre exacto de la capa territorial en el Diccionario de Datos.
  capas: {}
};
