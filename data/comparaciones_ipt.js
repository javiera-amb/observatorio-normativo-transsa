// Comparaciones documentales y cartográficas entre versiones de un mismo IPT.
// La clave se construye como: "registro_anterior__registro_nuevo".
// Este archivo se mantiene separado de la sincronización oficial para conservar
// la revisión estratégica y SIG realizada por el equipo.
window.COMPARACIONES_IPT = window.COMPARACIONES_IPT || {
  versiones: {}
};

/*
Ejemplo de registro validado:
window.COMPARACIONES_IPT.versiones["123__456"] = {
  estado_analisis: "validado",
  estado_sig: "incorporado",
  resumen_estrategico: "El nuevo PRC amplía el área urbana y modifica las intensidades de edificación en el sector norte.",
  cambios: [
    {
      materia: "Zonificación",
      antes: "Zona ZH-2",
      despues: "Zonas ZH-2 y ZM-1",
      impacto: "Habilita mayor mezcla de usos y modifica el potencial de desarrollo.",
      fuente: "URL o referencia documental"
    }
  ],
  evidencia_documental: [],
  evidencia_sig: []
};
*/
