(() => {
  "use strict";
  if (window.__TUI_COBERTURA_AUDITADA_LOADED) return;
  window.__TUI_COBERTURA_AUDITADA_LOADED = true;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const norm = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ").trim();

  const STATUS_LABEL = {
    APROBAR_A_01:"Aprobada para 01", APROBAR_REFERENCIAL:"Aprobada · referencial",
    ACTUALIZAR_ANTES_DE_01:"Actualizar antes de 01", REEMPLAZAR_POR_VERSION_ACTUAL:"Reemplazar por versión actual",
    CONSOLIDAR_DUPLICADO:"Consolidar / resolver duplicado", REVISAR_FUENTE:"Revisar fuente",
    REVISAR_FUENTE_CRS:"Revisar fuente + CRS", MANTENER_REFERENCIAL:"Mantener como referencial",
    MANTENER_HISTORICO:"Mantener como histórico", FUENTE_LOCALIZADA:"Fuente localizada · por incorporar",
    FALTANTE_POR_INCORPORAR:"Faltante · por incorporar", DESARROLLO_TRANSSA:"En desarrollo Transsa",
  };
  const STATUS_CLASS = {
    APROBAR_A_01:"audit-ok", APROBAR_REFERENCIAL:"audit-okref", ACTUALIZAR_ANTES_DE_01:"audit-update",
    REEMPLAZAR_POR_VERSION_ACTUAL:"audit-replace", CONSOLIDAR_DUPLICADO:"audit-consolidate",
    REVISAR_FUENTE:"audit-review", REVISAR_FUENTE_CRS:"audit-reviewcrs", MANTENER_REFERENCIAL:"audit-ref",
    MANTENER_HISTORICO:"audit-historical", FUENTE_LOCALIZADA:"audit-located",
    FALTANTE_POR_INCORPORAR:"audit-missing-target", DESARROLLO_TRANSSA:"audit-development",
  };
  const CATEGORY_ORDER = [
    "01 · Límites y escalas", "02 · Movilidad y transporte", "03 · Equipamiento y servicios",
    "04 · Infraestructura", "05 · Demografía y tejido urbano", "06 · Medio ambiente y riesgos",
    "07 · Propiedad y base territorial", "08 · Complementarias no normativas",
  ];
  const NOT_INCORPORATED = new Set(["FUENTE_LOCALIZADA","FALTANTE_POR_INCORPORAR","DESARROLLO_TRANSSA"]);
  const state = { commune:"Coquimbo", search:"", category:"", coverage:"", sort:"categoria", regionSearch:"", regionSort:"nombre" };
  let rendering = false;

  const audit = () => window.CATALOGO_AUDITORIA_TUI || { capas:[] };
  const cross = () => window.COBERTURA_CAPAS_RESULTADOS || { capas:{} };
  const communeData = () => window.SEGUIMIENTO_NORMATIVO?.comunas || [];
  const iptData = () => window.VIGENCIA_CARTOGRAFICA?.instrumentos || [];

  function incorporatedCount(){return audit().capas.filter(r=>!NOT_INCORPORATED.has(r.s)).length;}
  function communes(){
    const rows=communeData();
    return (rows.length?rows:iptData()).map(r=>({comuna:r.comuna,region:r.region}));
  }
  function currentCommune(){
    const wanted=$("capasCommuneSelect")?.value||state.commune;
    return communes().find(r=>norm(r.comuna)===norm(wanted))||{comuna:wanted||"Coquimbo",region:""};
  }
  function iptCount(commune){
    const group=iptData().find(r=>norm(r.comuna)===norm(commune.comuna)&&(!commune.region||norm(r.region)===norm(commune.region)||norm(r.region).includes(norm(commune.region))||norm(commune.region).includes(norm(r.region))));
    return group?.instrumentos?.length||0;
  }

  let crossIndex;
  function ensureCrossIndex(){
    if(crossIndex)return;
    crossIndex=new Map();Object.entries(cross().capas||{}).forEach(([k,v])=>crossIndex.set(norm(k),v));
  }
  function crossLayerFor(row){ensureCrossIndex();return crossIndex.get(norm(row.r))||crossIndex.get(norm(row.n))||null;}
  function crossCommune(layer,commune){
    if(!layer?.comunas)return null;
    const exact=layer.comunas[`${commune.region}|${commune.comuna}`];if(exact)return exact;
    return Object.entries(layer.comunas).find(([k,v])=>norm(v?.comuna||k.split("|").at(-1))===norm(commune.comuna))?.[1]||null;
  }
  function coverageFor(row,commune){
    const layer=crossLayerFor(row),cc=crossCommune(layer,commune);
    if(cc?.estado==="con_cobertura")return{state:"confirmada",label:`Cobertura confirmada · ${cc.elementos||0} elementos`,detail:"Cruce geométrico ejecutado para esta comuna."};
    if(cc?.estado==="sin_elementos")return{state:"sin_elementos",label:"Sin elementos en la comuna",detail:"El cruce fue ejecutado y dio cero elementos."};
    if(cc?.estado==="sin_limite_comunal")return{state:"bloqueada",label:"Cruce bloqueado · falta límite comunal",detail:"La capa está disponible, pero la geometría comunal no pudo usarse."};
    if(layer?.estado==="error")return{state:"error",label:"Error de cruce",detail:layer.motivo||"La capa no pudo procesarse."};
    if(row.s==="FALTANTE_POR_INCORPORAR")return{state:"bloqueada",label:"Faltante · sin capa incorporada",detail:"Forma parte del universo objetivo, pero todavía falta localizar o consolidar una fuente utilizable."};
    if(row.s==="FUENTE_LOCALIZADA")return{state:"pendiente",label:"Fuente localizada · falta incorporar",detail:"La fuente ya fue identificada. Falta descargar/materializar, convertir si corresponde, pasar QA y ejecutar el cruce comunal."};
    if(row.s==="DESARROLLO_TRANSSA")return{state:"pendiente",label:"En desarrollo Transsa",detail:"La capa se levanta o construye internamente y se incorporará al cruce comunal cuando ingrese al estándar TUI."};
    if(row.s==="REVISAR_FUENTE_CRS")return{state:"bloqueada",label:"Cruce bloqueado · fuente / CRS pendiente",detail:"Debe cerrarse su fuente y CRS antes de ejecutar cobertura comunal."};
    if(row.s==="CONSOLIDAR_DUPLICADO")return{state:"pendiente",label:"Cruce pendiente · consolidación previa",detail:"Primero debe resolverse qué versión queda como maestra."};
    if(row.s==="REEMPLAZAR_POR_VERSION_ACTUAL")return{state:"pendiente",label:"Cruce pendiente · reemplazar versión",detail:"Debe sustituirse por la versión vigente antes del cruce definitivo."};
    if(row.s==="ACTUALIZAR_ANTES_DE_01")return{state:"pendiente",label:"Cruce pendiente · actualizar versión",detail:"La versión debe actualizarse antes del cruce definitivo."};
    return{state:"pendiente",label:"Capa incorporada · cruce comunal pendiente",detail:"Ya forma parte del inventario auditado; falta ejecutar o sincronizar su matriz de intersección comunal."};
  }
  function qaNote(row){return({
    APROBAR_A_01:"QA técnico cerrado; candidata a la carpeta 01.",APROBAR_REFERENCIAL:"QA cerrado para uso referencial.",
    ACTUALIZAR_ANTES_DE_01:"Geometría utilizable, pero la versión requiere actualización.",REEMPLAZAR_POR_VERSION_ACTUAL:"Debe reemplazarse por una versión más vigente.",
    CONSOLIDAR_DUPLICADO:"Falta definir la versión maestra.",REVISAR_FUENTE:"Falta cerrar trazabilidad, origen o vigencia.",
    REVISAR_FUENTE_CRS:"Falta cerrar trazabilidad y/o CRS.",MANTENER_REFERENCIAL:"Se conserva como insumo contextual.",MANTENER_HISTORICO:"Se conserva como corte histórico.",
    FUENTE_LOCALIZADA:"Fuente identificada; falta incorporación y QA local.",FALTANTE_POR_INCORPORAR:"Objetivo TUI aún sin capa utilizable.",DESARROLLO_TRANSSA:"Levantamiento o construcción interna en curso."
  })[row.s]||"Estado de auditoría pendiente.";}
  function summaryFor(commune){
    const results=audit().capas.map(row=>coverageFor(row,commune));
    return{layers:results.length,confirmed:results.filter(r=>r.state==="confirmada").length,pending:results.filter(r=>["pendiente","bloqueada","error"].includes(r.state)).length,notApplicable:results.filter(r=>["sin_elementos","no_aplica","proceso"].includes(r.state)).length,ipt:iptCount(commune)};
  }

  function renderRegions(){
    const host=$("capasRegionGrid");if(!host)return;
    const query=norm(state.regionSearch||$("capasRegionSearch")?.value),grouped=new Map(),selected=currentCommune();
    communes().forEach(r=>{const region=r.region||"Sin región";if(!grouped.has(region))grouped.set(region,[]);grouped.get(region).push(r);});
    const groups=[...grouped.entries()].map(([region,rows])=>({region,rows:rows.filter(r=>!query||norm(`${region} ${r.comuna}`).includes(query)).map(r=>({...r,summary:summaryFor(r)}))})).filter(g=>g.rows.length).sort((a,b)=>a.region.localeCompare(b.region,"es"));
    host.innerHTML=groups.map(group=>{
      const sorted=group.rows.sort((a,b)=>state.regionSort==="pendientes"?b.summary.pending-a.summary.pending||a.comuna.localeCompare(b.comuna,"es"):state.regionSort==="confirmadas"?b.summary.confirmed-a.summary.confirmed||a.comuna.localeCompare(b.comuna,"es"):a.comuna.localeCompare(b.comuna,"es"));
      const stats=sorted.reduce((a,r)=>({confirmed:a.confirmed+(r.summary.confirmed>0?1:0),pending:a.pending+(r.summary.pending>0?1:0),empty:a.empty+(r.summary.notApplicable>0?1:0)}),{confirmed:0,pending:0,empty:0});
      const open=sorted.some(r=>norm(r.comuna)===norm(selected.comuna));
      return `<details class="capas-region" ${open?"open":""}><summary><span><strong>${esc(group.region)}</strong><small>${sorted.length} comunas visibles</small></span><span class="capas-region-summary"><span class="capas-region-count confirmada">${stats.confirmed} con cruce</span><span class="capas-region-count pendiente">${stats.pending} con pendientes</span><span class="capas-region-count alerta">${stats.empty} sin elementos</span></span></summary><div class="capas-region-body">${sorted.map(r=>`<button type="button" class="capas-commune-mini ${norm(r.comuna)===norm(selected.comuna)?"selected":""}" data-audit-commune="${esc(r.comuna)}"><strong>${esc(r.comuna)}</strong><small>${r.summary.ipt} IPT aplicables</small><span class="capas-commune-layer-link">${r.summary.layers} capas objetivo · ver detalle</span><span class="capas-commune-mini-kpis"><span>${r.summary.ipt}</span><span class="${r.summary.confirmed?"confirmada":""}">${r.summary.confirmed}</span><span class="${r.summary.pending?"pendiente":""}">${r.summary.pending}</span><span class="${r.summary.notApplicable?"alerta":""}">${r.summary.notApplicable}</span></span></button>`).join("")}</div></details>`;
    }).join("");
    host.dataset.auditCoverage="1";
    if($("capasRegionsCount"))$("capasRegionsCount").textContent=`${groups.length} regiones · ${audit().capas.length} objetivo · ${incorporatedCount()} incorporadas`;
  }

  function filteredRows(){
    const commune=currentCommune(),q=norm(state.search||$("capasSearch")?.value),cat=state.category||$("capasCategoryFilter")?.value||"",cov=state.coverage||$("capasCoverageFilter")?.value||"",sort=state.sort||$("capasSort")?.value||"categoria";
    const rows=audit().capas.map(row=>({row,result:coverageFor(row,commune)})).filter(x=>!q||norm(`${x.row.n} ${x.row.r} ${x.row.o} ${x.row.d} ${STATUS_LABEL[x.row.s]} ${x.row.c}`).includes(q)).filter(x=>!cat||x.row.c===cat).filter(x=>!cov||x.result.state===cov);
    const rank=c=>{const i=CATEGORY_ORDER.indexOf(c);return i<0?99:i;};
    return rows.sort((a,b)=>sort==="nombre"?a.row.n.localeCompare(b.row.n,"es"):sort==="estado"?a.result.label.localeCompare(b.result.label,"es"):sort==="fecha"?String(b.row.d).localeCompare(String(a.row.d)):rank(a.row.c)-rank(b.row.c)||a.row.n.localeCompare(b.row.n,"es"));
  }
  function rowHtml({row,result}){
    const category=row.c.replace(/^\d+ · /,""),qaClass=STATUS_CLASS[row.s]||"audit-review";
    const isNotIncorporated=NOT_INCORPORATED.has(row.s);
    const qaKind=row.s.startsWith("APROBAR")?"aprobado":isNotIncorporated?"pendiente":row.s.includes("HISTORICO")||row.s.includes("REFERENCIAL")?"pendiente":"observaciones";
    const qaText=row.s.startsWith("APROBAR")?"QA técnico OK":row.s==="FUENTE_LOCALIZADA"?"Pendiente de incorporación":row.s==="FALTANTE_POR_INCORPORAR"?"Sin capa aún":row.s==="DESARROLLO_TRANSSA"?"En desarrollo":row.s.includes("HISTORICO")?"Uso histórico":row.s.includes("REFERENCIAL")?"Uso referencial":"QA abierto";
    return `<tr data-audit-row="1"><td data-label="Capa"><span class="capas-table-category">${esc(category)}</span><strong>${esc(row.n)}</strong><small title="Dataset técnico">${esc(row.r)}</small></td><td data-label="Cobertura en la comuna"><span class="capas-coverage-pill ${esc(result.state)}">${esc(result.label)}</span><small>${esc(result.detail)}</small></td><td data-label="Origen / dataset"><strong>${esc(row.o)}</strong><small>Dataset: ${esc(row.r)}</small>${row.u?`<a href="${esc(row.u)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>`:""}</td><td data-label="Estado de auditoría"><span class="audit-badge ${qaClass}">${esc(STATUS_LABEL[row.s]||row.s)}</span><small>${esc(qaNote(row))}</small></td><td data-label="QA de la capa"><span class="capas-status-pill ${qaKind}">${qaText}</span><small>${isNotIncorporated?"Aún no forma parte de las 102 capas auditadas.":`Sincronizado con las ${incorporatedCount()} capas incorporadas.`}</small></td><td data-label="Fecha del dato"><strong>${esc(row.d)}</strong><small>Fecha / corte declarado o por validar</small></td></tr>`;
  }
  function renderTerritorial(){
    const body=$("capasCoverageBody");if(!body)return;const rows=filteredRows();body.innerHTML=rows.map(rowHtml).join("");body.dataset.auditCoverage="1";
    const scroll=body.closest(".capas-table-scroll");if(scroll)scroll.hidden=rows.length===0;if($("capasCoverageEmpty"))$("capasCoverageEmpty").hidden=rows.length>0;if($("capasTerritorialCount"))$("capasTerritorialCount").textContent=`${rows.length} de ${audit().capas.length} capas objetivo`;
    const commune=currentCommune();if($("capasSelectedTitle"))$("capasSelectedTitle").textContent=`Cobertura de ${commune.comuna}`;if($("capasSelectedLayerTitle"))$("capasSelectedLayerTitle").textContent=commune.comuna;
    const all=audit().capas.map(row=>coverageFor(row,commune));if($("capasMetricCovered"))$("capasMetricCovered").textContent=all.filter(r=>r.state==="confirmada").length;if($("capasMetricPending"))$("capasMetricPending").textContent=all.filter(r=>["pendiente","bloqueada","error"].includes(r.state)).length;if($("capasMetricNotApplicable"))$("capasMetricNotApplicable").textContent=all.filter(r=>["sin_elementos","no_aplica","proceso"].includes(r.state)).length;
  }

  function configureUi(){
    const block2=document.querySelector(".capas-regions-section .capas-section-heading > div");if(block2)block2.innerHTML=`<p class="eyebrow">BLOQUE 2 · COBERTURA NACIONAL</p><h3>Estado por región y comuna</h3><p>Las comunas se evalúan contra el mismo universo objetivo de <strong>${audit().capas.length} capas</strong>. De ellas, ${incorporatedCount()} ya están incorporadas y el resto se mantiene visible como fuente localizada, faltante o desarrollo interno.</p>`;
    const block3=document.querySelector(".capas-coverage-section .capas-section-heading > div");if(block3)block3.innerHTML=`<p class="eyebrow">BLOQUE 3 · DETALLE TERRITORIAL</p><h3>Las ${audit().capas.length} capas objetivo en <span id="capasSelectedLayerTitle">la comuna</span></h3><p>El detalle usa exactamente el mismo catálogo del Bloque 1. Las capas aún no incorporadas aparecen explícitamente con su estado; no se ocultan ni se confunden con cobertura confirmada.</p>`;
    const thead=document.querySelector(".capas-coverage-table thead tr");if(thead)thead.innerHTML="<th>Capa</th><th>Cobertura en la comuna</th><th>Origen / dataset</th><th>Estado de auditoría</th><th>QA de la capa</th><th>Fecha del dato</th>";
    const category=$("capasCategoryFilter");if(category)category.innerHTML='<option value="">Todas las categorías</option>'+CATEGORY_ORDER.map(c=>`<option value="${esc(c)}">${esc(c.replace(/^\d+ · /,""))}</option>`).join("");
    if($("capasCrossBannerTitle"))$("capasCrossBannerTitle").textContent=`Universo objetivo sincronizado · ${audit().capas.length} capas`;
    if($("capasCrossBannerText"))$("capasCrossBannerText").textContent=`Hay ${incorporatedCount()} capas incorporadas y ${audit().capas.length-incorporatedCount()} por incorporar o desarrollar. Una capa puede aparecer aunque su cruce comunal, fuente o QA siga pendiente.`;
  }
  function renderAll(){if(rendering||!audit().capas?.length)return;rendering=true;configureUi();state.commune=currentCommune().comuna;renderRegions();renderTerritorial();rendering=false;}
  function bind(){
    $("capasCommuneSelect")?.addEventListener("change",()=>setTimeout(renderAll,0));
    $("capasSearch")?.addEventListener("input",e=>{state.search=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasCategoryFilter")?.addEventListener("change",e=>{state.category=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasCoverageFilter")?.addEventListener("change",e=>{state.coverage=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasSort")?.addEventListener("change",e=>{state.sort=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasRegionSearch")?.addEventListener("input",e=>{state.regionSearch=e.target.value;setTimeout(renderRegions,0)});
    $("capasRegionSort")?.addEventListener("change",e=>{state.regionSort=e.target.value;setTimeout(renderRegions,0)});
    document.addEventListener("click",e=>{const btn=e.target.closest("[data-audit-commune]");if(!btn)return;e.preventDefault();e.stopPropagation();state.commune=btn.dataset.auditCommune;const select=$("capasCommuneSelect");if(select)select.value=state.commune;setTimeout(()=>{renderAll();document.querySelector(".capas-coverage-section")?.scrollIntoView({behavior:"smooth",block:"start"});},0);},true);
  }
  function init(){if(!audit().capas?.length){setTimeout(init,150);return;}configureUi();bind();renderAll();setTimeout(renderAll,350);setTimeout(renderAll,1000);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();