// Compatibilidad temporal: la vista IPT/vigencia ya no carga catálogos legacy.
// La fuente canónica se inicializa desde data/seguimiento_normativo.js y
// vigencia-seguimiento-unificado.js reemplaza este objeto al iniciar la vista.
window.VIGENCIA_CARTOGRAFICA = {
  fuente: "SEGUIMIENTO_NORMATIVO",
  deprecated_legacy_loader: true,
  resumen: {},
  instrumentos: [],
  word_url: "",
  csv_url: ""
};
