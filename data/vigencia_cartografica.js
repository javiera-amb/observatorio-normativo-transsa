(()=>{
  const PORTAL='https://portalipt.minvu.cl/instrumentos';
  const IDE='https://ide.minvu.cl/pages/descargas';
  const rows=Array.isArray(window.VIGENCIA_IPT_ROWS)?window.VIGENCIA_IPT_ROWS:[];
  const instrumentos=rows.map(r=>({
    id:`ipt-${r[0]}`,
    registro:r[0],
    region:r[1],
    comuna:r[2],
    comunas:r[3],
    tipo_ipt:r[4],
    nivel_planificacion:r[5],
    nombre:r[6],
    fecha_instrumento_base:r[7],
    fecha_version_cartografica:'',
    fuente_portal_ipt:PORTAL,
    fuente_cartografia:IDE,
    actos_posteriores_pendientes:0,
    estado_alerta:'Revisión necesaria',
    confianza:'baja',
    resumen_alerta:'Instrumento vigente identificado. Falta vincular sus modificaciones y auditar el archivo SIG.',
    linea_tiempo:[{
      fecha:r[7],
      tipo:'Instrumento de origen',
      estado:'Vigente',
      titulo:r[6],
      incorporacion:'base',
      fuente:PORTAL
    }]
  }));

  window.VIGENCIA_CARTOGRAFICA={
    fecha_generacion:'2026-08-06 16:50',
    resumen:{
      instrumentos:instrumentos.length,
      actualizados:0,
      probablemente_actualizados:0,
      revision_necesaria:instrumentos.length,
      desactualizados:0,
      sin_cartografia:0
    },
    instrumentos,
    word_url:'',
    csv_url:'',
    nota_metodologica:'Carga inicial de instrumentos vigentes desde la exportación disponible del Portal IPT. Todavía no se han vinculado las modificaciones, enmiendas y rectificaciones ni se ha ejecutado la auditoría SIG; por eso todos permanecen en Revisión necesaria.'
  };
})();
