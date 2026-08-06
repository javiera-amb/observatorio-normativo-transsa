(()=>{
  const PORTAL='https://portalipt.minvu.cl/instrumentos';
  const IDE='https://ide.minvu.cl/pages/descargas';
  const rows=Array.isArray(window.VIGENCIA_IPT_ROWS)?window.VIGENCIA_IPT_ROWS:[];
  const actos=Array.isArray(window.ACTOS_IPT?.actos)?window.ACTOS_IPT.actos:[];

  const normalize=value=>String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'');

  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
  const communeGroups=new Map();
  const originIndex=new Map();

  const ensureGroup=(region,commune)=>{
    const key=`${normalize(region)}__${normalize(commune)}`;
    if(!communeGroups.has(key)){
      communeGroups.set(key,{
        id:`comuna-${normalize(region)}-${normalize(commune)}`,
        region,
        comuna:commune,
        instrumentos:[],
        actos_normativos:[]
      });
    }
    return communeGroups.get(key);
  };

  rows.forEach(r=>{
    const communes=Array.isArray(r[3])&&r[3].length?r[3]:String(r[2]||'').split(',').map(v=>v.trim()).filter(Boolean);
    const plan={
      registro:r[0],
      region:r[1],
      comunas:communes,
      tipo_ipt:r[4],
      nivel_planificacion:r[5],
      nombre:r[6],
      fecha:r[7]||'',
      fuente:PORTAL,
      actos:[]
    };
    originIndex.set(Number(r[0]),plan);

    communes.forEach(commune=>{
      ensureGroup(r[1],commune).instrumentos.push({...plan,comuna:commune});
    });
  });

  const normalizedActStatus=value=>{
    const status=String(value||'pendiente_revision');
    if(['incorporado','probablemente_incorporado','no_incorporado','no_aplica','pendiente_revision'].includes(status)) return status;
    return 'pendiente_revision';
  };

  actos.forEach(acto=>{
    const affectedCodes=Array.isArray(acto.codigos_origen_afectados)
      ? acto.codigos_origen_afectados.map(Number).filter(Number.isFinite)
      : [];
    const matchedPlans=affectedCodes.map(code=>originIndex.get(code)).filter(Boolean);
    const destinations=new Map();

    matchedPlans.forEach(plan=>{
      plan.comunas.forEach(commune=>{
        destinations.set(`${normalize(plan.region)}__${normalize(commune)}`,{
          region:plan.region,
          commune
        });
      });
    });

    if(!destinations.size){
      const listedCommunes=Array.isArray(acto.comunas)?acto.comunas:[];
      listedCommunes.forEach(commune=>{
        destinations.set(`${normalize(acto.region)}__${normalize(commune)}`,{
          region:acto.region,
          commune
        });
      });
    }

    const enrichedAct={
      ...acto,
      codigos_origen_afectados:affectedCodes,
      incorporacion_sig:normalizedActStatus(acto.incorporacion_sig),
      origenes_encontrados:matchedPlans.map(plan=>plan.registro),
      origenes_no_encontrados:affectedCodes.filter(code=>!originIndex.has(code))
    };

    matchedPlans.forEach(plan=>plan.actos.push(enrichedAct));
    destinations.forEach(({region,commune})=>{
      ensureGroup(region,commune).actos_normativos.push(enrichedAct);
    });
  });

  const eventDate=value=>validDate(value)?value:'9999-99-99';
  const comunas=[...communeGroups.values()].map(group=>{
    const instrumentos=group.instrumentos
      .sort((a,b)=>eventDate(a.fecha).localeCompare(eventDate(b.fecha))||String(a.tipo_ipt).localeCompare(String(b.tipo_ipt),'es'));
    const acts=[...group.actos_normativos]
      .filter((act,index,array)=>array.findIndex(item=>item.id===act.id)===index)
      .sort((a,b)=>eventDate(a.fecha).localeCompare(eventDate(b.fecha))||String(a.titulo).localeCompare(String(b.titulo),'es'));
    const tipos=[...new Set(instrumentos.map(item=>item.tipo_ipt).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const fechas=instrumentos.map(item=>item.fecha).filter(validDate).sort();
    const firstDate=fechas[0]||'';
    const lastPlanDate=fechas[fechas.length-1]||'';
    const pendingActs=acts.filter(act=>act.incorporacion_sig==='pendiente_revision'||act.incorporacion_sig==='probablemente_incorporado');
    const missingActs=acts.filter(act=>act.incorporacion_sig==='no_incorporado');
    const hasChanges=acts.length>0;
    const status=missingActs.length?'Desactualizado':'Revisión necesaria';

    const baseEvents=instrumentos.map(plan=>({
      fecha:plan.fecha||'Sin fecha',
      tipo:plan.tipo_ipt||'IPT',
      numero:`Registro Portal IPT ${plan.registro}`,
      estado:'Vigente',
      titulo:plan.nombre,
      resumen:`${plan.nivel_planificacion||'Instrumento'} aplicable a la comuna de ${group.comuna}.`,
      incorporacion:'base',
      fuente:PORTAL,
      es_cambio:false,
      registro_origen:plan.registro
    }));

    const changeEvents=acts.map(act=>({
      fecha:act.fecha||'Sin fecha',
      tipo:act.tipo_acto||act.clasificacion_portal||'Modificación',
      numero:act.registro_portal?`Registro Portal IPT ${act.registro_portal}`:'',
      estado:act.estado||'Sin estado informado',
      titulo:act.titulo,
      resumen:act.fundamento_revision||`Acto posterior que debe verificarse contra la cartografía SIG aplicable a ${group.comuna}.`,
      incorporacion:act.incorporacion_sig||'pendiente_revision',
      fuente:act.fuente_oficial||PORTAL,
      documentos:act.documentos||[],
      zonas_afectadas:act.zonas_afectadas||[],
      es_cambio:true,
      acto_id:act.id,
      codigos_origen_afectados:act.codigos_origen_afectados||[],
      evidencia_sig:act.evidencia_sig||''
    }));

    const timeline=[...baseEvents,...changeEvents].sort((a,b)=>
      eventDate(a.fecha).localeCompare(eventDate(b.fecha))||Number(a.es_cambio)-Number(b.es_cambio)||String(a.titulo).localeCompare(String(b.titulo),'es')
    );

    const alerts=[
      {
        tipo:'Cartografía pendiente de auditoría',
        nivel:'medio',
        mensaje:'La zonificación y los polígonos de cada plan deben compararse con los actos posteriores identificados.'
      }
    ];
    if(!hasChanges){
      alerts.unshift({
        tipo:'Actos posteriores aún no cargados',
        nivel:'medio',
        mensaje:'La base actual contiene instrumentos de origen. Falta cargar la exportación oficial de modificaciones, enmiendas y rectificaciones del Portal IPT.'
      });
    }else if(pendingActs.length){
      alerts.unshift({
        tipo:'Cambios pendientes de revisión SIG',
        nivel:'alto',
        mensaje:`${pendingActs.length} ${pendingActs.length===1?'acto requiere':'actos requieren'} verificar si la geometría o norma modificada está incorporada en el plano SIG.`
      });
    }
    if(missingActs.length){
      alerts.unshift({
        tipo:'Cambios no incorporados',
        nivel:'alto',
        mensaje:`${missingActs.length} ${missingActs.length===1?'acto figura':'actos figuran'} como no incorporado en la cartografía revisada.`
      });
    }

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
      actos_normativos:acts,
      cantidad_instrumentos:instrumentos.length,
      cantidad_actos:acts.length,
      fecha_instrumento_base:firstDate,
      fecha_ultimo_instrumento:lastPlanDate,
      fecha_version_cartografica:'',
      fuente_portal_ipt:PORTAL,
      fuente_cartografia:IDE,
      actos_posteriores_pendientes:pendingActs.length+missingActs.length,
      estado_alerta:status,
      confianza:hasChanges?'media':'baja',
      resumen_alerta:hasChanges
        ? `La ficha reúne ${instrumentos.length} ${instrumentos.length===1?'instrumento vigente':'instrumentos vigentes'} y ${acts.length} ${acts.length===1?'acto posterior':'actos posteriores'}. Falta completar o validar la comparación SIG de cada cambio.`
        : `La ficha comunal reúne ${instrumentos.length} ${instrumentos.length===1?'instrumento vigente':'instrumentos vigentes'} identificados en la base de origen. Aún no se ha cargado el universo oficial de modificaciones y enmiendas.`,
      alertas,
      linea_tiempo:timeline,
      comparaciones_espaciales:acts.map(act=>({
        acto:act.titulo,
        acto_id:act.id,
        estado:act.incorporacion_sig||'pendiente_revision',
        coincidencia_porcentaje:null,
        observacion:act.evidencia_sig||act.fundamento_revision||'Pendiente de comparar documento, plano normativo y archivo SIG.'
      })),
      archivo_geojson:'',
      campo_zona:'',
      zonas_presentes:[],
      mapa:{
        base_geojson:'',
        capas_modificaciones:acts
          .filter(act=>act.archivo_geojson_cambio)
          .map(act=>({
            acto_id:act.id,
            titulo:act.titulo,
            archivo_geojson:act.archivo_geojson_cambio,
            incorporacion:act.incorporacion_sig,
            zona_esperada:(act.zonas_afectadas||[]).join(', ')
          }))
      },
      notas:'Ficha consolidada por comuna. Un mismo instrumento intercomunal o regional y sus modificaciones pueden aparecer en todas las comunas a las que aplican.'
    };
  }).sort((a,b)=>String(a.region).localeCompare(String(b.region),'es')||String(a.comuna).localeCompare(String(b.comuna),'es'));

  const allActs=comunas.flatMap(item=>item.actos_normativos||[]);
  const uniqueActs=[...new Map(allActs.map(act=>[act.id,act])).values()];
  const reviewCount=comunas.filter(item=>item.estado_alerta==='Revisión necesaria').length;
  const outdatedCount=comunas.filter(item=>item.estado_alerta==='Desactualizado').length;

  window.VIGENCIA_CARTOGRAFICA={
    fecha_generacion:'2026-08-06 17:25',
    resumen:{
      instrumentos:comunas.length,
      comunas:comunas.length,
      instrumentos_fuente:rows.length,
      actos_fuente:uniqueActs.length,
      actualizados:0,
      probablemente_actualizados:0,
      revision_necesaria:reviewCount,
      desactualizados:outdatedCount,
      sin_cartografia:0
    },
    instrumentos:comunas,
    word_url:'',
    csv_url:'',
    nota_metodologica:'Las líneas de tiempo se consolidan por comuna e integran instrumentos de origen y actos posteriores. Cada modificación, enmienda o rectificación mantiene un estado de incorporación SIG independiente y solo puede marcarse incorporada con evidencia documental y espacial.'
  };
})();
