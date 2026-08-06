(()=>{
  const PORTAL='https://portalipt.minvu.cl/instrumentos';
  const IDE='https://ide.minvu.cl/pages/descargas';
  const rows=Array.isArray(window.VIGENCIA_IPT_ROWS)?window.VIGENCIA_IPT_ROWS:[];

  const normalize=value=>String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'');

  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
  const communeGroups=new Map();

  rows.forEach(r=>{
    const communes=Array.isArray(r[3])&&r[3].length?r[3]:String(r[2]||'').split(',').map(v=>v.trim()).filter(Boolean);
    const plan={
      registro:r[0],
      region:r[1],
      tipo_ipt:r[4],
      nivel_planificacion:r[5],
      nombre:r[6],
      fecha:r[7]||'',
      fuente:PORTAL
    };

    communes.forEach(commune=>{
      const key=`${normalize(r[1])}__${normalize(commune)}`;
      if(!communeGroups.has(key)){
        communeGroups.set(key,{
          id:`comuna-${normalize(r[1])}-${normalize(commune)}`,
          region:r[1],
          comuna:commune,
          instrumentos:[]
        });
      }
      communeGroups.get(key).instrumentos.push({...plan,comuna:commune});
    });
  });

  const comunas=[...communeGroups.values()].map(group=>{
    const instrumentos=group.instrumentos
      .sort((a,b)=>String(a.fecha||'9999-99-99').localeCompare(String(b.fecha||'9999-99-99'))||String(a.tipo_ipt).localeCompare(String(b.tipo_ipt),'es'));
    const tipos=[...new Set(instrumentos.map(item=>item.tipo_ipt).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const fechas=instrumentos.map(item=>item.fecha).filter(validDate).sort();
    const firstDate=fechas[0]||'';
    const lastDate=fechas[fechas.length-1]||'';

    return {
      id:group.id,
      region:group.region,
      comuna:group.comuna,
      comunas:[group.comuna],
      tipos_ipt:tipos,
      tipo_ipt:tipos.join(' · ')||'IPT',
      nivel_planificacion:'Comunal',
      nombre:`${instrumentos.length} ${instrumentos.length===1?'instrumento vigente':'instrumentos vigentes'}`,
      instrumentos,
      cantidad_instrumentos:instrumentos.length,
      fecha_instrumento_base:firstDate,
      fecha_ultimo_instrumento:lastDate,
      fecha_version_cartografica:'',
      fuente_portal_ipt:PORTAL,
      fuente_cartografia:IDE,
      actos_posteriores_pendientes:0,
      estado_alerta:'Revisión necesaria',
      confianza:'baja',
      resumen_alerta:`La ficha comunal reúne ${instrumentos.length} ${instrumentos.length===1?'instrumento vigente':'instrumentos vigentes'} identificados en la base de origen. Falta vincular modificaciones, enmiendas y archivos SIG para determinar su actualización.`,
      alertas:[
        {
          tipo:'Historial normativo incompleto',
          nivel:'medio',
          mensaje:'La exportación disponible contiene instrumentos de origen, pero todavía no incorpora el universo de modificaciones, enmiendas y rectificaciones.'
        },
        {
          tipo:'Cartografía pendiente de auditoría',
          nivel:'medio',
          mensaje:'Se mostrará el límite comunal oficial. La zonificación y los polígonos de cada plan se incorporarán al vincular los servicios y archivos SIG correspondientes.'
        }
      ],
      linea_tiempo:instrumentos.map(plan=>({
        fecha:plan.fecha||'Sin fecha',
        tipo:plan.tipo_ipt||'IPT',
        numero:`Registro Portal IPT ${plan.registro}`,
        estado:'Vigente',
        titulo:plan.nombre,
        resumen:`${plan.nivel_planificacion||'Instrumento'} aplicable a la comuna de ${group.comuna}.`,
        incorporacion:'base',
        fuente:PORTAL
      })),
      comparaciones_espaciales:[],
      archivo_geojson:'',
      campo_zona:'',
      zonas_presentes:[],
      mapa:{base_geojson:'',capas_modificaciones:[]},
      notas:'Ficha consolidada por comuna. Un mismo instrumento intercomunal o regional puede aparecer en todas las comunas a las que aplica.'
    };
  }).sort((a,b)=>String(a.region).localeCompare(String(b.region),'es')||String(a.comuna).localeCompare(String(b.comuna),'es'));

  window.VIGENCIA_CARTOGRAFICA={
    fecha_generacion:'2026-08-06 19:05',
    resumen:{
      instrumentos:comunas.length,
      comunas:comunas.length,
      instrumentos_fuente:rows.length,
      actualizados:0,
      probablemente_actualizados:0,
      revision_necesaria:comunas.length,
      desactualizados:0,
      sin_cartografia:0
    },
    instrumentos:comunas,
    word_url:'',
    csv_url:'',
    nota_metodologica:'Las líneas de tiempo se consolidan por comuna y reúnen todos los instrumentos vigentes aplicables identificados en la base de origen. Todavía no se han vinculado las modificaciones, enmiendas y rectificaciones ni se ha ejecutado la auditoría SIG; por eso todas las comunas permanecen en Revisión necesaria.'
  };
})();
