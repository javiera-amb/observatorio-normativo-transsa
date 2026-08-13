window.ESTADO_OPERATIVO_DATOS = {
  corte: "2026-08-13",
  destino_publicacion: "Transsa / Propiteq",
  criterio: "El equipo informa pendiente, en desarrollo, actualizado o enviado. La plataforma compara el PRC consolidado con las correcciones detectadas y calcula el QA automático; lo que no pueda comprobarse queda pendiente de revisión para Javiera.",
  valores_permitidos: {
    estado_produccion: ["pendiente", "en_desarrollo", "actualizado", "enviado"],
    qa_plataforma: ["pendiente", "observaciones", "aprobado"],
    qa_revision_javiera: ["pendiente", "observaciones", "aprobado"],
    etapa_interna: ["levantamiento", "comparacion", "actualizacion_sig", "qa", "publicacion"],
    prioridad: ["critica", "alta", "media", "baja"]
  },
  equipo: [
    { nombre: "Cristóbal", rol: "Producción SIG" },
    { nombre: "Annabel", rol: "Producción SIG" },
    { nombre: "Fernanda", rol: "Producción SIG" },
    { nombre: "Javiera", rol: "Administración y QA" }
  ],
  almacenamiento: {
    archivos_sig: "OneDrive Transsa",
    inventario_publicado: "data/inventario_prc_onedrive.js",
    estados_compartidos: "Git / datos versionados de la plataforma",
    nota: "La web publica rutas relativas, huellas y resultados; nunca la ruta C: del usuario ni los binarios SIG."
  },
  criterio_produccion_directa: "PRC identificado, archivo vinculado, sin actos posteriores detectados y apto preliminarmente para visor. Antes de marcar actualizado se debe homologar la columna de usos al lenguaje Transsa.",
  // Clave: "Región|Comuna". Estas entradas prevalecen sobre la carga inicial
  // del Excel y sobre el estado detectado desde el nombre del archivo.
  comunas: {},
  // Clave: nombre exacto de la capa territorial en el catálogo.
  capas: {}
};
