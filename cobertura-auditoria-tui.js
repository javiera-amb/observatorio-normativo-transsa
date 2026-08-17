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
    APROBAR_A_01: "Aprobada para 01",
    APROBAR_REFERENCIAL: "Aprobada · referencial",
    ACTUALIZAR_ANTES_DE_01: "Actualizar antes de 01",
    REEMPLAZAR_POR_VERSION_ACTUAL: "Reemplazar por versión actual",
    CONSOLIDAR_DUPLICADO: "Consolidar / resolver duplicado",
    REVISAR_FUENTE: "Revisar fuente",
    REVISAR_FUENTE_CRS: "Revisar fuente + CRS",
    MANTENER_REFERENCIAL: "Mantener como referencial",
    MANTENER_HISTORICO: "Mantener como histórico",
  };
  const STATUS_CLASS = {
    APROBAR_A_01: "audit-ok",
    APROBAR_REFERENCIAL: "audit-okref",
    ACTUALIZAR_ANTES_DE_01: "audit-update",
    REEMPLAZAR_POR_VERSION_ACTUAL: "audit-replace",
    CONSOLIDAR_DUPLICADO: "audit-consolidate",
    REVISAR_FUENTE: "audit-review",
    REVISAR_FUENTE_CRS: "audit-reviewcrs",
    MANTENER_REFERENCIAL: "audit-ref",
    MANTENER_HISTORICO: "audit-historical",
  };
  const CATEGORY_ORDER = [
    "01 · Límites y escalas", "02 · Movilidad y transporte", "03 · Equipamiento y servicios",
    "04 · Infraestructura", "05 · Demografía y tejido urbano", "06 · Medio ambiente y riesgos",
    "07 · Propiedad y base territorial", "08 · Complementarias no normativas",
  ];
  const state = { commune: "Coquimbo", search: "", category: "", coverage: "", sort: "categoria", regionSearch: "", regionSort: "nombre" };
  let rendering = false;

  const audit = () => window.CATALOGO_AUDITORIA_TUI || { capas: [] };
  const cross = () => window.COBERTURA_CAPAS_RESULTADOS || { capas: {} };
  const communesRaw = () => window.SEGUIMIENTO_NORMATIVO?.comunas || [];
  const iptRaw = () => window.VIGENCIA_CARTOGRAFICA?.instrumentos || [];

  function communes() {
    const rows = communesRaw();
    if (rows.length) return rows.map(r => ({ comuna:r.comuna, region:r.region }));
    return iptRaw().map(r => ({ comuna:r.comuna, region:r.region }));
  }
  function currentCommune() {
    const select = $("capasCommuneSelect");
    const wanted = select?.value || state.commune;
    const hit = communes().find(r => norm(r.comuna) === norm(wanted));
    return hit || { comuna:wanted || "Coquimbo", region:"" };
  }
  function iptCount(commune) {
    const group = iptRaw().find(r => norm(r.comuna) === norm(commune.comuna)
      && (!commune.region || norm(r.region) === norm(commune.region) || norm(r.region).includes(norm(commune.region)) || norm(commune.region).includes(norm(r.region))));
    return group?.instrumentos?.length || 0;
  }

  let crossIndex = null;
  function buildCrossIndex() {
    const src = cross().capas || {};
    const map = new Map();
    Object.entries(src).forEach(([key,val]) => { map.set(norm(key), val); });
    crossIndex = map;
  }
  function crossLayerFor(row) {
    if (!crossIndex) buildCrossIndex();
    return crossIndex.get(norm(row.r)) || crossIndex.get(norm(row.n)) || null;
  }
  function crossCommune(layer, commune) {
    if (!layer?.comunas) return null;
    const exact = layer.comunas[`${commune.region}|${commune.comuna}`];
    if (exact) return exact;
    const found = Object.entries(layer.comunas).find(([key,val]) => {
      const c = val?.comuna || key.split("|").at(-1);
      return norm(c) === norm(commune.comuna);
    });
    return found?.[1] || null;
  }

  function coverageFor(row, commune) {
    const layer = crossLayerFor(row);
    const cc = crossCommune(layer, commune);
    if (cc?.estado === "con_cobertura") return { state:"confirmada", label:`Cobertura confirmada · ${cc.elementos || 0} elementos`, detail:"Cruce geométrico ejecutado para esta comuna." };
    if (cc?.estado === "sin_elementos") return { state:"sin_elementos", label:"Sin elementos en la comuna", detail:"El cruce fue ejecutado y dio cero elementos." };
    if (cc?.estado === "sin_limite_comunal") return { state:"bloqueada", label:"Cruce bloqueado · falta límite comunal", detail:"La capa está disponible, pero la geometría comunal no pudo usarse." };
    if (layer?.estado === "error") return { state:"error", label:"Error de cruce", detail:layer.motivo || "La capa no pudo procesarse." };
    if (row.s === "REVISAR_FUENTE_CRS") return { state:"bloqueada", label:"Cruce bloqueado · fuente / CRS pendiente", detail:"La capa está inventariada, pero debe cerrarse su fuente y CRS antes de ejecutar cobertura comunal." };
    if (row.s === "CONSOLIDAR_DUPLICADO") return { state:"pendiente", label:"Cruce pendiente · consolidación previa", detail:"La capa existe, pero primero debe resolverse qué versión queda como maestra." };
    if (row.s === "REEMPLAZAR_POR_VERSION_ACTUAL") return { state:"pendiente", label:"Cruce pendiente · reemplazar versión", detail:"Existe una capa, pero debe sustituirse por la versión vigente antes de consolidar cobertura." };
    if (row.s === "ACTUALIZAR_ANTES_DE_01") return { state:"pendiente", label:"Cruce pendiente · actualizar versión", detail:"La capa existe y está catalogada; la versión debe actualizarse antes del cruce definitivo." };
    return { state:"pendiente", label:"Capa disponible · cruce comunal pendiente", detail:"La capa forma parte del universo auditado de TUI. Falta ejecutar o incorporar su matriz de intersección comunal." };
  }

  function qaNote(row) {
    return ({
      APROBAR_A_01:"QA técnico cerrado; candidata a la carpeta 01.",
      APROBAR_REFERENCIAL:"QA cerrado para uso referencial; no equivale a fuente normativa.",
      ACTUALIZAR_ANTES_DE_01:"La geometría es utilizable, pero la versión requiere actualización.",
      REEMPLAZAR_POR_VERSION_ACTUAL:"Existe una versión más vigente que debe reemplazar esta capa.",
      CONSOLIDAR_DUPLICADO:"Hay capas equivalentes o versiones paralelas; falta definir la maestra.",
      REVISAR_FUENTE:"La capa está disponible; falta cerrar trazabilidad, origen o vigencia.",
      REVISAR_FUENTE_CRS:"Falta cerrar trazabilidad y/o sistema de referencia antes de promoverla.",
      MANTENER_REFERENCIAL:"Se conserva como insumo contextual o de contraste.",
      MANTENER_HISTORICO:"Se conserva como corte histórico; no representa el estado vigente.",
    })[row.s] || "Estado de auditoría pendiente.";
  }

  function summaryFor(commune) {
    const results = audit().capas.map(row => coverageFor(row, commune));
    return {
      layers: results.length,
      confirmed: results.filter(r => r.state === "confirmada").length,
      pending: results.filter(r => ["pendiente","bloqueada","error"].includes(r.state)).length,
      notApplicable: results.filter(r => ["sin_elementos","no_aplica","proceso"].includes(r.state)).length,
      ipt: iptCount(commune),
    };
  }

  function renderRegions() {
    const host = $("capasRegionGrid"); if (!host) return;
    const query = norm(state.regionSearch || $("capasRegionSearch")?.value);
    const grouped = new Map();
    communes().forEach(row => {
      const region = row.region || "Sin región";
      if (!grouped.has(region)) grouped.set(region, []);
      grouped.get(region).push(row);
    });
    const selected = currentCommune();
    const groups = [...grouped.entries()].map(([region,rows]) => ({
      region,
      rows: rows.filter(r => !query || norm(`${region} ${r.comuna}`).includes(query)).map(r => ({...r, summary:summaryFor(r)}))
    })).filter(g => g.rows.length).sort((a,b) => a.region.localeCompare(b.region,"es"));
    host.innerHTML = groups.map(group => {
      const sorted = group.rows.sort((a,b) => {
        if (state.regionSort === "pendientes") return b.summary.pending-a.summary.pending || a.comuna.localeCompare(b.comuna,"es");
        if (state.regionSort === "confirmadas") return b.summary.confirmed-a.summary.confirmed || a.comuna.localeCompare(b.comuna,"es");
        return a.comuna.localeCompare(b.comuna,"es");
      });
      const regionStats = sorted.reduce((acc,r) => ({
        confirmed:acc.confirmed+(r.summary.confirmed>0?1:0),
        pending:acc.pending+(r.summary.pending>0?1:0),
        empty:acc.empty+(r.summary.notApplicable>0?1:0),
      }),{confirmed:0,pending:0,empty:0});
      const open = sorted.some(r => norm(r.comuna) === norm(selected.comuna));
      return `<details class="capas-region" ${open?"open":""}><summary><span><strong>${esc(group.region)}</strong><small>${sorted.length} comunas visibles</small></span><span class="capas-region-summary"><span class="capas-region-count confirmada">${regionStats.confirmed} con cruce</span><span class="capas-region-count pendiente">${regionStats.pending} con pendientes</span><span class="capas-region-count alerta">${regionStats.empty} sin elementos</span></span></summary><div class="capas-region-body">${sorted.map(r => `<button type="button" class="capas-commune-mini ${norm(r.comuna)===norm(selected.comuna)?"selected":""}" data-audit-commune="${esc(r.comuna)}"><strong>${esc(r.comuna)}</strong><small>${r.summary.ipt} IPT aplicables</small><span class="capas-commune-layer-link">${r.summary.layers} capas auditadas · ver detalle</span><span class="capas-commune-mini-kpis"><span>${r.summary.ipt}</span><span class="${r.summary.confirmed?"confirmada":""}">${r.summary.confirmed}</span><span class="${r.summary.pending?"pendiente":""}">${r.summary.pending}</span><span class="${r.summary.notApplicable?"alerta":""}">${r.summary.notApplicable}</span></span></button>`).join("")}</div></details>`;
    }).join("");
    if ($("capasRegionsCount")) $("capasRegionsCount").textContent = `${groups.length} regiones · ${audit().capas.length} capas en el universo`;
  }

  function filteredRows() {
    const commune = currentCommune();
    const q = norm(state.search || $("capasSearch")?.value);
    const cat = state.category || $("capasCategoryFilter")?.value || "";
    const cov = state.coverage || $("capasCoverageFilter")?.value || "";
    const sort = state.sort || $("capasSort")?.value || "categoria";
    const rows = audit().capas.map(row => ({ row, result:coverageFor(row,commune) }))
      .filter(x => !q || norm(`${x.row.n} ${x.row.r} ${x.row.o} ${x.row.d} ${STATUS_LABEL[x.row.s]} ${x.row.c}`).includes(q))
      .filter(x => !cat || x.row.c === cat)
      .filter(x => !cov || x.result.state === cov);
    const rank = c => { const i=CATEGORY_ORDER.indexOf(c); return i<0?99:i; };
    return rows.sort((a,b) => {
      if (sort === "nombre") return a.row.n.localeCompare(b.row.n,"es");
      if (sort === "estado") return a.result.label.localeCompare(b.result.label,"es");
      if (sort === "fecha") return String(b.row.d).localeCompare(String(a.row.d));
      return rank(a.row.c)-rank(b.row.c) || a.row.n.localeCompare(b.row.n,"es");
    });
  }

  function rowHtml(item) {
    const row=item.row, result=item.result;
    const category = row.c.replace(/^\d+ · /,"");
    const qaClass = STATUS_CLASS[row.s] || "audit-review";
    return `<tr>
      <td data-label="Capa"><span class="capas-table-category">${esc(category)}</span><strong>${esc(row.n)}</strong><small title="Dataset técnico">${esc(row.r)}</small></td>
      <td data-label="Cobertura en la comuna"><span class="capas-coverage-pill ${esc(result.state)}">${esc(result.label)}</span><small>${esc(result.detail)}</small></td>
      <td data-label="Origen / dataset"><strong>${esc(row.o)}</strong><small>Dataset: ${esc(row.r)}</small></td>
      <td data-label="Estado de auditoría"><span class="audit-badge ${qaClass}">${esc(STATUS_LABEL[row.s] || row.s)}</span><small>${esc(qaNote(row))}</small></td>
      <td data-label="QA de la capa"><span class="capas-status-pill ${row.s.startsWith("APROBAR")?"aprobado":row.s.includes("HISTORICO")||row.s.includes("REFERENCIAL")?"pendiente":"observaciones"}">${row.s.startsWith("APROBAR")?"QA técnico OK":row.s.includes("HISTORICO")?"Uso histórico":row.s.includes("REFERENCIAL")?"Uso referencial":"QA abierto"}</span><small>Estado sincronizado con el catálogo maestro de 102 capas.</small></td>
      <td data-label="Fecha del dato"><strong>${esc(row.d)}</strong><small>Fecha / corte acreditado en auditoría</small></td>
    </tr>`;
  }

  function renderTerritorial() {
    const body=$("capasCoverageBody"); if (!body) return;
    const rows=filteredRows();
    body.innerHTML=rows.map(rowHtml).join("");
    const scroll=body.closest(".capas-table-scroll"); if(scroll) scroll.hidden=rows.length===0;
    if($("capasCoverageEmpty")) $("capasCoverageEmpty").hidden=rows.length>0;
    if($("capasTerritorialCount")) $("capasTerritorialCount").textContent=`${rows.length} de ${audit().capas.length} capas`;
    const commune=currentCommune();
    if($("capasSelectedTitle")) $("capasSelectedTitle").textContent=`Cobertura de ${commune.comuna}`;
    if($("capasSelectedLayerTitle")) $("capasSelectedLayerTitle").textContent=commune.comuna;
    const all=audit().capas.map(row=>coverageFor(row,commune));
    if($("capasMetricCovered")) $("capasMetricCovered").textContent=all.filter(r=>r.state==="confirmada").length;
    if($("capasMetricPending")) $("capasMetricPending").textContent=all.filter(r=>["pendiente","bloqueada","error"].includes(r.state)).length;
    if($("capasMetricNotApplicable")) $("capasMetricNotApplicable").textContent=all.filter(r=>["sin_elementos","no_aplica","proceso"].includes(r.state)).length;
  }

  function configureUi() {
    const block2=document.querySelector(".capas-regions-section .capas-section-heading > div");
    if(block2) block2.innerHTML=`<p class="eyebrow">BLOQUE 2 · COBERTURA NACIONAL</p><h3>Estado por región y comuna</h3><p>Las comunas se evalúan contra el mismo universo maestro de <strong>${audit().capas.length} capas</strong>. Al incorporar los cruces geométricos, los conteos se actualizan sin cambiar de catálogo.</p>`;
    const block3=document.querySelector(".capas-coverage-section .capas-section-heading > div");
    if(block3) block3.innerHTML=`<p class="eyebrow">BLOQUE 3 · DETALLE TERRITORIAL</p><h3>Las ${audit().capas.length} capas en <span id="capasSelectedLayerTitle">la comuna</span></h3><p>El detalle usa exactamente el mismo catálogo del Bloque 1: nombre normalizado, origen, fecha y estado de auditoría, sumando la cobertura comunal cuando exista un cruce geométrico.</p>`;
    const thead=document.querySelector(".capas-coverage-table thead tr");
    if(thead) thead.innerHTML="<th>Capa</th><th>Cobertura en la comuna</th><th>Origen / dataset</th><th>Estado de auditoría</th><th>QA de la capa</th><th>Fecha del dato</th>";
    const category=$("capasCategoryFilter");
    if(category){ category.innerHTML='<option value="">Todas las categorías</option>'+CATEGORY_ORDER.map(c=>`<option value="${esc(c)}">${esc(c.replace(/^\d+ · /,""))}</option>`).join(""); }
    const bannerTitle=$("capasCrossBannerTitle"), bannerText=$("capasCrossBannerText");
    if(bannerTitle) bannerTitle.textContent=`Universo sincronizado · ${audit().capas.length} capas`;
    if(bannerText) bannerText.textContent="El catálogo, la cobertura nacional y el detalle territorial ya usan el mismo universo. Una capa puede estar visible aunque su cruce comunal, fuente, actualización o consolidación siga pendiente.";
  }

  function renderAll(){
    if(rendering || !audit().capas?.length) return;
    rendering=true;
    configureUi();
    state.commune=currentCommune().comuna;
    renderRegions(); renderTerritorial();
    rendering=false;
  }

  function bind(){
    $("capasCommuneSelect")?.addEventListener("change",()=>setTimeout(renderAll,0));
    $("capasSearch")?.addEventListener("input",e=>{state.search=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasCategoryFilter")?.addEventListener("change",e=>{state.category=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasCoverageFilter")?.addEventListener("change",e=>{state.coverage=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasSort")?.addEventListener("change",e=>{state.sort=e.target.value;setTimeout(renderTerritorial,0)});
    $("capasRegionSearch")?.addEventListener("input",e=>{state.regionSearch=e.target.value;setTimeout(renderRegions,0)});
    $("capasRegionSort")?.addEventListener("change",e=>{state.regionSort=e.target.value;setTimeout(renderRegions,0)});
    document.addEventListener("click",e=>{
      const btn=e.target.closest("[data-audit-commune]"); if(!btn)return;
      e.preventDefault(); e.stopPropagation();
      state.commune=btn.dataset.auditCommune;
      const select=$("capasCommuneSelect"); if(select) select.value=state.commune;
      renderAll();
      document.querySelector(".capas-coverage-section")?.scrollIntoView({behavior:"smooth",block:"start"});
    },true);
  }

  function protect(){
    [$("capasRegionGrid"),$("capasCoverageBody")].filter(Boolean).forEach(node=>{
      new MutationObserver(()=>{ if(!rendering) setTimeout(renderAll,0); }).observe(node,{childList:true});
    });
  }

  function init(){
    if(!audit().capas?.length){setTimeout(init,150);return;}
    configureUi(); bind(); renderAll(); protect();
    setTimeout(renderAll,350);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
