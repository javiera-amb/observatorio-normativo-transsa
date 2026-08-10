(()=>{
  const PORTAL='https://portalipt.minvu.cl/instrumentos';
  const IDE='https://ide.minvu.cl/pages/descargas';
  const rows=Array.isArray(window.VIGENCIA_IPT_ROWS)?window.VIGENCIA_IPT_ROWS:[];
  const acts=Array.isArray(window.ACTOS_IPT?.actos)?window.ACTOS_IPT.actos:[];
  const comparisonOverrides=window.COMPARACIONES_IPT?.versiones||{};

  const normalize=value=>String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'');

  const normalizeText=value=>String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/\bregion\b/g,' ')
    .replace(/\bdel\b|\bde\b|\bla\b|\blas\b|\blos\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();

  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
  const sortDate=value=>validDate(value)?value:'9999-99-99';
  const communeGroups=new Map();

  const comparisonTopics=[
    'Límite urbano y extensión territorial',
    'Zonificación y usos de suelo',
    'Densidad, constructibilidad y ocupación de suelo',
    'Alturas, subdivisión predial y antejardines',
    'Vialidad estructurante y declaratorias de utilidad pública',
    'Áreas de riesgo, protección y espacios públicos'
  ];

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

  function actsForGroup(group,instruments){
    const commune=normalizeText(group.comuna);
    const region=normalizeText(group.region);
    const codes=new Set(instruments.map(item=>Number(item.registro)).filter(Number.isFinite));

    return acts.filter(act=>{
      const actCommunes=Array.isArray(act.comunas)?act.comunas.map(normalizeText):[];
      const sameCommune=actCommunes.includes(commune);
      const actRegion=normalizeText(act.region);
      const compatibleRegion=!actRegion||!region||actRegion===region||actRegion.includes(region)||region.includes(actRegion);
      const linkedByCode=(act.codigos_origen_afectados||[]).some(code=>codes.has(Number(code)));
      return linkedByCode||(sameCommune&&compatibleRegion);
    }).sort((a,b)=>String(a.fecha||'9999-99-99').localeCompare(String(b.fecha||'9999-99-99'))||String(a.titulo||'').localeCompare(String(b.titulo||''),'es'));
  }

  function buildComparisons(instruments,commune){
    const byType=new Map();
    instruments.forEach(plan=>{
      const key=String(plan.tipo_ipt||'IPT').trim();
      if(!byType.has(key))byType.set(key,[]);
      byType.get(key).push(plan);
    });

    const comparisons=[];
    byType.forEach((plans,type)=>{
      const ordered=[...plans].sort((a,b)=>sortDate(a.fecha).localeCompare(sortDate(b.fecha))||Number(a.registro)-Number(b.registro));
      for(let index=1;index<ordered.length;index+=1){
        const previous=ordered[index-1];
        const current=ordered[index];
        const key=`${previous.registro}__${current.registro}`;
        const override=comparisonOverrides[key]||{};
        comparisons.push({
          id:`comparacion-${key}`,
          clave:key,
          tipo_ipt:type,
          comuna:commune,
          instrumento_anterior:{...previous},
          instrumento_nuevo:{...current},
          fecha_anterior:previous.fecha||'',
          fecha_nueva:current.fecha||'',
          estado_analisis:override.estado_analisis||'pendiente_documentos',
          estado_sig:override.estado_sig||'pendiente_revision',
          resumen_estrategico:override.resumen_estrategico||`Se detectó una transición entre ${previous.nombre||type} (${previous.fecha||'sin fecha'}) y ${current.nombre||type} (${current.fecha||'sin fecha'}). Falta comparar ordenanza, memoria, planos y cartografía para identificar los cambios normativos efectivos y su impacto urbano.`,
          cambios:Array.isArray(override.cambios)?override.cambios:[],
          materias_a_comparar:Array.isArray(override.materias_a_comparar)&&override.materias_a_comparar.length?override.materias_a_comparar:comparisonTopics,
          evidencia_documental:Array.isArray(override.evidencia_documental)?override.evidencia_documental:[],
          evidencia_sig:Array.isArray(override.evidencia_sig)?override.evidencia_sig:[],
          fuente_anterior:override.fuente_anterior||previous.fuente||PORTAL,
          fuente_nueva:override.fuente_nueva||current.fuente||PORTAL
        });
      }
    });

    return comparisons.sort((a,b)=>sortDate(a.fecha_nueva).localeCompare(sortDate(b.fecha_nueva))||String(a.tipo_ipt).localeCompare(String(b.tipo_ipt),'es'));
  }

  function buildStrategicReading(group,instruments,comparisons,groupActs){
    const newest=[...instruments].sort((a,b)=>sortDate(b.fecha).localeCompare(sortDate(a.fecha)))[0]||null;
    const communal=[...instruments]
      .filter(item=>['PRC','PS','LU'].includes(String(item.tipo_ipt||'').trim()))
      .sort((a,b)=>sortDate(b.fecha).localeCompare(sortDate(a.fecha)))[0]||null;
    const intercommunal=[...instruments]
      .filter(item=>['PRI','PRM'].includes(String(item.tipo_ipt||'').trim()))
      .sort((a,b)=>sortDate(b.fecha).localeCompare(sortDate(a.fecha)))[0]||null;
    const validated=comparisons.filter(item=>item.estado_analisis==='validado').length;
    const pendingComparisons=comparisons.length-validated;
    const pendingSig=[
      ...comparisons.filter(item=>item.estado_sig==='pendiente_revision'||item.estado_sig==='no_incorporado'),
      ...groupActs.filter(item=>item.incorporacion_sig==='pendiente_revision'||item.incorporacion_sig==='no_incorporado')
    ].length;

    let summary=`La comuna tiene ${instruments.length} ${instruments.length===1?'instrumento vigente aplicable':'instrumentos vigentes aplicables'}.`;
    if(comparisons.length){
      const latest=comparisons[comparisons.length-1];
      summary+=` Se detectaron ${comparisons.length} ${comparisons.length===1?'transición entre versiones':'transiciones entre versiones'}; la más reciente corresponde a ${latest.tipo_ipt} ${latest.fecha_anterior||'sin fecha'} → ${latest.fecha_nueva||'sin fecha'}.`;
    }else{
      summary+=' No se detectó una versión anterior del mismo tipo dentro de la base cargada.';
    }
    if(groupActs.length){
      summary+=` Además, se asociaron ${groupActs.length} ${groupActs.length===1?'modificación, enmienda o rectificación':'modificaciones, enmiendas o rectificaciones'} para revisar.`;
    }

    return {
      nivel:validated===comparisons.length&&comparisons.length?'documental':'preliminar',
      resumen:summary,
      instrumento_comunal_principal:communal,
      instrumento_intercomunal_principal:intercommunal,
      instrumento_mas_reciente:newest,
      transiciones_detectadas:comparisons.length,
      comparaciones_validadas:validated,
      comparaciones_pendientes:pendingComparisons,
      actos_asociados:groupActs.length,
      verificaciones_sig_pendientes:pendingSig,
      ejes_impacto:comparisonTopics,
      advertencia:'La lectura estratégica distingue hechos validados de materias pendientes. Un cambio solo se presentará como confirmado cuando exista evidencia documental y, para su incorporación cartográfica, evidencia SIG.'
    };
  }

  const comunas=[...communeGroups.values()].map(group=>{
    const instrumentos=group.instrumentos
      .sort((a,b)=>sortDate(a.fecha).localeCompare(sortDate(b.fecha))||String(a.tipo_ipt).localeCompare(String(b.tipo_ipt),'es'));
    const tipos=[...new Set(instrumentos.map(item=>item.tipo_ipt).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const fechas=instrumentos.map(item=>item.fecha).filter(validDate).sort();
    const firstDate=fechas[0]||'';
    const lastDate=fechas[fechas.length-1]||'';
    const actosNormativos=actsForGroup(group,instrumentos);
    const comparacionesVersiones=buildComparisons(instrumentos,group.comuna);
    const lecturaEstrategica=buildStrategicReading(group,instrumentos,comparacionesVersiones,actosNormativos);
    const pendientesSig=actosNormativos.filter(act=>!['incorporado','no_aplica'].includes(act.incorporacion_sig)).length+
      comparacionesVersiones.filter(item=>item.estado_sig!=='incorporado').length;

    const baseTimeline=instrumentos.map(plan=>({
      fecha:plan.fecha||'Sin fecha',
      tipo:plan.tipo_ipt||'IPT',
      numero:`Registro Portal IPT ${plan.registro}`,
      estado:'Vigente',
      titulo:plan.nombre,
      resumen:`${plan.nivel_planificacion||'Instrumento'} aplicable a la comuna de ${group.comuna}.`,
      incorporacion:'base',
      fuente:PORTAL,
      clase_evento:'instrumento'
    }));

    const comparisonTimeline=comparacionesVersiones.map(comparison=>({
      fecha:comparison.fecha_nueva||'Sin fecha',
      tipo:`Comparación ${comparison.tipo_ipt}`,
      numero:`Registros ${comparison.instrumento_anterior.registro} → ${comparison.instrumento_nuevo.registro}`,
      estado:comparison.estado_analisis==='validado'?'Cambios validados':'Pendiente de análisis documental',
      titulo:`${comparison.instrumento_anterior.nombre} → ${comparison.instrumento_nuevo.nombre}`,
      resumen:comparison.resumen_estrategico,
      incorporacion:comparison.estado_sig,
      fuente:comparison.fuente_nueva||PORTAL,
      clase_evento:'comparacion_versiones',
      comparacion_id:comparison.id,
      cambios:comparison.cambios
    }));

    const actsTimeline=actosNormativos.map(act=>({
      fecha:act.fecha||'Sin fecha',
      tipo:act.tipo_acto||'Modificación',
      numero:act.registro_portal?`Registro Portal IPT ${act.registro_portal}`:'Acto posterior',
      estado:act.estado||act.estado_revision||'Pendiente',
      titulo:act.titulo||'Acto normativo posterior',
      resumen:act.fundamento_revision||'',
      incorporacion:act.incorporacion_sig||'pendiente_revision',
      fuente:act.fuente_oficial||PORTAL,
      clase_evento:'acto_posterior',
      acto_id:act.id
    }));

    const lineaTiempo=[...baseTimeline,...comparisonTimeline,...actsTimeline]
      .sort((a,b)=>sortDate(a.fecha).localeCompare(sortDate(b.fecha))||String(a.tipo).localeCompare(String(b.tipo),'es'));

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
      actos_normativos:actosNormativos,
      cantidad_actos:actosNormativos.length,
      comparaciones_versiones:comparacionesVersiones,
      cantidad_comparaciones:comparacionesVersiones.length,
      lectura_estrategica:lecturaEstrategica,
      actos_posteriores_pendientes:pendientesSig,
      estado_alerta:'Revisión necesaria',
      confianza:'baja',
      resumen_alerta:`La ficha comunal reúne ${instrumentos.length} ${instrumentos.length===1?'instrumento vigente':'instrumentos vigentes'}, ${comparacionesVersiones.length} ${comparacionesVersiones.length===1?'comparación entre versiones':'comparaciones entre versiones'} y ${actosNormativos.length} ${actosNormativos.length===1?'acto posterior asociado':'actos posteriores asociados'}. Falta completar la lectura documental y la verificación SIG.`,
      alertas:[
        {
          tipo:'Comparación normativa pendiente',
          nivel:'medio',
          mensaje:comparacionesVersiones.length
            ?`Se detectaron ${comparacionesVersiones.length} transiciones entre versiones. Deben compararse ordenanzas, memorias y planos para identificar cambios efectivos.`
            :'No existe una versión anterior del mismo tipo en la base cargada; esto no descarta modificaciones o enmiendas.'
        },
        {
          tipo:'Cartografía pendiente de auditoría',
          nivel:'medio',
          mensaje:'Se mostrará el límite comunal oficial. La zonificación y los polígonos de cada plan se incorporarán al vincular los servicios y archivos SIG correspondientes.'
        }
      ],
      linea_tiempo:lineaTiempo,
      comparaciones_espaciales:[],
      archivo_geojson:'',
      campo_zona:'',
      zonas_presentes:[],
      mapa:{base_geojson:'',capas_modificaciones:[]},
      notas:'Ficha consolidada por comuna. Un mismo instrumento intercomunal o regional puede aparecer en todas las comunas a las que aplica. Las comparaciones automáticas identifican pares de versiones, pero no afirman cambios específicos hasta completar la revisión documental.'
    };
  }).sort((a,b)=>String(a.region).localeCompare(String(b.region),'es')||String(a.comuna).localeCompare(String(b.comuna),'es'));

  const totalComparisons=comunas.reduce((sum,item)=>sum+item.cantidad_comparaciones,0);
  const totalActs=comunas.reduce((sum,item)=>sum+item.cantidad_actos,0);

  window.VIGENCIA_CARTOGRAFICA={
    fecha_generacion:new Date().toISOString(),
    resumen:{
      instrumentos:comunas.length,
      comunas:comunas.length,
      instrumentos_fuente:rows.length,
      comparaciones_versiones:totalComparisons,
      actos_asociados:totalActs,
      actualizados:0,
      probablemente_actualizados:0,
      revision_necesaria:comunas.length,
      desactualizados:0,
      sin_cartografia:0
    },
    instrumentos:comunas,
    word_url:'',
    csv_url:'',
    nota_metodologica:'Las fichas se consolidan por comuna. Cada versión posterior del mismo tipo de IPT se empareja con su versión anterior para crear una comparación documental y SIG. Las modificaciones, enmiendas y rectificaciones se vinculan por comuna o código de instrumento de origen. Ningún cambio se considera confirmado ni incorporado en SIG sin evidencia específica.'
  };
})();
