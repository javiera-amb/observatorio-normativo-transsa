(() => {
  "use strict";
  if (window.__TUI_AUDIT_CATALOG_UI_LOADED) {
    window.__TUI_AUDIT_CATALOG_RENDER?.();
    return;
  }
  window.__TUI_AUDIT_CATALOG_UI_LOADED = true;

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
    FUENTE_LOCALIZADA: "audit-located",
    FALTANTE_POR_INCORPORAR: "audit-missing-target",
    DESARROLLO_TRANSSA: "audit-development",
  };
  const CATEGORY_ORDER = [
    "01 · Límites y escalas", "02 · Movilidad y transporte", "03 · Equipamiento y servicios",
    "04 · Infraestructura", "05 · Demografía y tejido urbano", "06 · Medio ambiente y riesgos",
    "07 · Propiedad y base territorial", "08 · Complementarias no normativas",
  ];
  const INCORPORATION_STATUSES = new Set(["FUENTE_LOCALIZADA","FALTANTE_POR_INCORPORAR","DESARROLLO_TRANSSA"]);
  const KPI_GROUPS = [
    { key:"total", label:"Universo objetivo", statuses:null, cls:"total", note:"Capas objetivo TUI v1" },
    { key:"have", label:"Tenemos incorporadas", selector:r=>!INCORPORATION_STATUSES.has(r.s), cls:"have", note:"Ya ingresaron al inventario auditado" },
    { key:"ok", label:"OK / aprobables", statuses:["APROBAR_A_01","APROBAR_REFERENCIAL"], cls:"ok" },
    { key:"review", label:"Por revisar", statuses:["REVISAR_FUENTE","REVISAR_FUENTE_CRS"], cls:"review" },
    { key:"update", label:"Actualizar / reemplazar", statuses:["ACTUALIZAR_ANTES_DE_01","REEMPLAZAR_POR_VERSION_ACTUAL"], cls:"update" },
    { key:"consolidate", label:"Consolidar", statuses:["CONSOLIDAR_DUPLICADO"], cls:"consolidate" },
    { key:"reference", label:"Referencial / histórico", statuses:["MANTENER_REFERENCIAL","MANTENER_HISTORICO"], cls:"reference" },
    { key:"located", label:"Fuente localizada", statuses:["FUENTE_LOCALIZADA"], cls:"located", note:"Falta incorporar al flujo local" },
    { key:"missing", label:"Faltantes", statuses:["FALTANTE_POR_INCORPORAR"], cls:"missing", note:"Falta localizar/consolidar fuente" },
    { key:"development", label:"Desarrollo Transsa", statuses:["DESARROLLO_TRANSSA"], cls:"development", note:"Se construyen en la oficina" },
  ];
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const norm = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

  let filters = { q:"", status:"", category:"", group:"" };
  let rendering = false;

  function injectStyles() {
    if (document.getElementById("auditCatalogStyles")) return;
    const style = document.createElement("style");
    style.id = "auditCatalogStyles";
    style.textContent = `
      .audit-summary-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:0 0 14px}
      .audit-summary-kpi{position:relative;min-height:94px;padding:13px 14px;border:1px solid #e0e3e9;border-radius:13px;background:#fff;text-align:left;cursor:pointer;font:inherit;transition:.16s ease}
      .audit-summary-kpi:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(16,16,88,.07)}.audit-summary-kpi.active{outline:2px solid var(--transsa-blue)}
      .audit-summary-kpi span{display:block;color:#697383;font-size:.55rem;font-weight:650}.audit-summary-kpi strong{display:block;margin:5px 0 2px;color:var(--transsa-navy);font-size:1.65rem;line-height:1}.audit-summary-kpi small{color:#89909b;font-size:.49rem;line-height:1.25}
      .audit-summary-kpi.total{background:var(--transsa-navy)}.audit-summary-kpi.total span,.audit-summary-kpi.total strong,.audit-summary-kpi.total small{color:#fff}
      .audit-summary-kpi.have{border-top:4px solid #4b46ff}.audit-summary-kpi.ok{border-top:4px solid #39a66d}.audit-summary-kpi.review{border-top:4px solid #9a69c2}.audit-summary-kpi.update{border-top:4px solid #d2a52c}.audit-summary-kpi.consolidate{border-top:4px solid #527fc9}.audit-summary-kpi.reference{border-top:4px solid #7d8794}.audit-summary-kpi.located{border-top:4px solid #33a7a1}.audit-summary-kpi.missing{border-top:4px solid #df6b6b}.audit-summary-kpi.development{border-top:4px solid #ee8e34}
      .audit-catalog-toolbar{margin:0 0 14px}.audit-catalog-filters{display:grid;grid-template-columns:1.4fr .8fr .8fr auto;gap:8px;padding:10px;border-radius:11px;background:#f7f8fa}
      .audit-catalog-filters input,.audit-catalog-filters select,.audit-catalog-filters button{width:100%;min-height:39px;padding:8px 10px;border:1px solid #d8dbe3;border-radius:8px;background:#fff;color:#303946;font:inherit;font-size:.66rem}.audit-catalog-filters button{font-weight:700;cursor:pointer}
      .capas-catalog-grid.audit-mode{grid-template-columns:1fr}.audit-group{overflow:hidden;border:1px solid #e0e2e8;border-radius:14px;background:#fbfbfd}.audit-group>summary{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 16px;cursor:pointer;list-style:none}.audit-group>summary::-webkit-details-marker{display:none}
      .audit-group-title{display:flex;align-items:center;gap:9px}.audit-group-num{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--transsa-navy);color:#fff;font-size:.61rem;font-weight:750}.audit-group-title strong{color:var(--transsa-navy);font-size:.78rem}.audit-group-title small{display:block;margin-top:3px;color:#707987;font-size:.57rem}
      .audit-layer-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 12px 12px}.audit-layer{padding:11px;border:1px solid #e4e6eb;border-radius:10px;background:#fff}.audit-layer-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.audit-layer-name{color:var(--transsa-navy);font-size:.7rem;line-height:1.3}.audit-layer-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.audit-layer-meta span{display:block;padding:7px 8px;border:1px solid #e5e7ed;border-radius:8px;background:#fafbfc;color:#4e5867;font-size:.56rem;line-height:1.35}.audit-layer-meta b{display:block;margin-bottom:2px;color:#7a8290;font-size:.47rem;text-transform:uppercase}.audit-layer-source{display:inline-block;margin-top:7px;color:var(--transsa-blue);font-size:.54rem;font-weight:650;text-decoration:none}
      .audit-badge{display:inline-block;flex:none;padding:5px 7px;border-radius:999px;font-size:.5rem;font-weight:750;white-space:nowrap}.audit-ok{background:#e4f5ec;color:#176342}.audit-okref{background:#e8f3ed;color:#2b6851}.audit-update{background:#fff3cf;color:#735110}.audit-replace{background:#fde8ea;color:#922f38}.audit-consolidate{background:#e7efff;color:#315a9e}.audit-review{background:#f2eaff;color:#6a4494}.audit-reviewcrs{background:#ffe9e0;color:#914a29}.audit-ref{background:#edf0f4;color:#596473}.audit-historical{background:#e6e8ec;color:#424a57}.audit-located{background:#ddf5f3;color:#176761}.audit-missing-target{background:#fde9e9;color:#963b3b}.audit-development{background:#fff0df;color:#92531b}
      .audit-empty{padding:24px;border:1px dashed #d7d9e0;border-radius:12px;color:#707987;text-align:center;font-size:.68rem}
      @media(max-width:1100px){.audit-summary-kpis{grid-template-columns:repeat(3,1fr)}.audit-layer-list{grid-template-columns:1fr}}
      @media(max-width:760px){.audit-summary-kpis{grid-template-columns:repeat(2,1fr)}.audit-catalog-filters{grid-template-columns:1fr}.audit-layer-meta{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function countsByStatus(data) { return data.capas.reduce((acc,row)=>{acc[row.s]=(acc[row.s]||0)+1;return acc;},{}); }
  function groupCount(group, data, counts) {
    if (group.selector) return data.capas.filter(group.selector).length;
    if (!group.statuses) return data.capas.length;
    return group.statuses.reduce((n,s)=>n+(counts[s]||0),0);
  }
  function groupNote(group, data) {
    if (group.note) return group.note;
    if (!group.statuses) return "Universo objetivo completo";
    return group.statuses.map(s=>data.estados[s]).join(" + ");
  }
  function ensureToolbar(section, data) {
    let toolbar = document.getElementById("auditCatalogToolbar");
    if (toolbar) { document.getElementById("auditSummaryKpis")?.remove(); toolbar.remove(); }
    const counts = countsByStatus(data);
    const statusEntries = Object.entries(data.estados).filter(([key]) => counts[key]);
    const kpis = document.createElement("div");
    kpis.id = "auditSummaryKpis";
    kpis.className = "audit-summary-kpis";
    kpis.innerHTML = KPI_GROUPS.map(group => `<button type="button" class="audit-summary-kpi ${group.cls}" data-audit-group="${group.key}"><span>${esc(group.label)}</span><strong>${groupCount(group,data,counts)}</strong><small>${esc(groupNote(group,data))}</small></button>`).join("");
    const heading = section.querySelector(".capas-section-heading"); heading?.insertAdjacentElement("afterend", kpis);
    toolbar = document.createElement("div"); toolbar.id = "auditCatalogToolbar"; toolbar.className = "audit-catalog-toolbar";
    toolbar.innerHTML = `<div class="audit-catalog-filters"><input id="auditCatalogSearch" type="search" placeholder="Buscar capa, origen o fecha…"><select id="auditCatalogStatus"><option value="">Todos los estados (${data.capas.length})</option>${statusEntries.map(([key,label])=>`<option value="${esc(key)}">${esc(label)} (${counts[key]})</option>`).join("")}</select><select id="auditCatalogCategory"><option value="">Todas las categorías</option>${CATEGORY_ORDER.map(c=>`<option value="${esc(c)}">${esc(c.replace(/^\d+ · /,""))}</option>`).join("")}</select><button id="auditCatalogClear" type="button">Limpiar</button></div>`;
    const grid = document.getElementById("capasCatalogGrid"); section.insertBefore(toolbar, grid);
    toolbar.querySelector("#auditCatalogSearch").addEventListener("input",e=>{filters.q=e.target.value;render(false);});
    toolbar.querySelector("#auditCatalogStatus").addEventListener("change",e=>{filters.status=e.target.value;filters.group="";render(false);});
    toolbar.querySelector("#auditCatalogCategory").addEventListener("change",e=>{filters.category=e.target.value;render(false);});
    toolbar.querySelector("#auditCatalogClear").addEventListener("click",()=>{filters={q:"",status:"",category:"",group:""};render(true);});
    kpis.addEventListener("click",e=>{const btn=e.target.closest("[data-audit-group]");if(!btn)return;filters.group=filters.group===btn.dataset.auditGroup?"":btn.dataset.auditGroup;filters.status="";render(true);});
    return toolbar;
  }

  function rowInGroup(row) {
    if (!filters.group || filters.group === "total") return true;
    const group = KPI_GROUPS.find(g=>g.key===filters.group);
    if (group?.selector) return group.selector(row);
    return !group?.statuses || group.statuses.includes(row.s);
  }

  function render(rebuildToolbar=false) {
    if (rendering) return;
    const data=window.CATALOGO_AUDITORIA_TUI, grid=document.getElementById("capasCatalogGrid"), section=grid?.closest(".capas-catalog-section");
    if(!data?.capas?.length||!grid||!section)return;
    rendering=true; injectStyles(); if(rebuildToolbar || !document.getElementById("auditCatalogToolbar")) ensureToolbar(section,data);
    const heading=section.querySelector(".capas-section-heading > div:first-child");
    const have=data.capas.filter(r=>!INCORPORATION_STATUSES.has(r.s)).length;
    if(heading) heading.innerHTML=`<p class="eyebrow">BLOQUE 1 · CATÁLOGO NACIONAL</p><h3>Universo objetivo de capas territoriales</h3><p>El TUI muestra <strong>${data.capas.length} capas objetivo</strong>: ${have} ya incorporadas al inventario auditado y ${data.capas.length-have} por incorporar o desarrollar. Ninguna desaparece por estar pendiente; el estado muestra exactamente qué falta.</p>`;
    const count=document.getElementById("capasCatalogCount");if(count)count.textContent=`${data.capas.length} objetivo · ${have} incorporadas`;
    const query=norm(filters.q);
    const rows=data.capas.filter(row=>rowInGroup(row)&&(!filters.status||row.s===filters.status)&&(!filters.category||row.c===filters.category)&&(!query||norm([row.n,row.r,row.o,row.d,data.estados[row.s]].join(" ")).includes(query)));
    grid.classList.add("audit-mode");grid.dataset.auditCatalog="1";
    grid.innerHTML=CATEGORY_ORDER.map(category=>{const items=rows.filter(row=>row.c===category);if(!items.length)return"";const num=category.slice(0,2),label=category.replace(/^\d+ · /,"");return `<details class="audit-group" open><summary><span class="audit-group-title"><span class="audit-group-num">${esc(num)}</span><span><strong>${esc(label)}</strong><small>${items.length} ${items.length===1?"capa":"capas"}</small></span></span></summary><div class="audit-layer-list">${items.map(row=>`<article class="audit-layer" title="Dataset técnico: ${esc(row.r)}"><div class="audit-layer-top"><div><strong class="audit-layer-name">${esc(row.n)}</strong><div class="audit-layer-meta"><span><b>Origen</b>${esc(row.o)}</span><span><b>Fecha</b>${esc(row.d)}</span></div>${row.u?`<a class="audit-layer-source" href="${esc(row.u)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>`:""}</div><span class="audit-badge ${STATUS_CLASS[row.s]||"audit-review"}">${esc(data.estados[row.s]||row.s)}</span></div></article>`).join("")}</div></details>`;}).join("")||`<div class="audit-empty">No hay capas para los filtros seleccionados.</div>`;
    document.querySelectorAll(".audit-summary-kpi").forEach(btn=>btn.classList.toggle("active",btn.dataset.auditGroup===filters.group));
    const toolbar=document.getElementById("auditCatalogToolbar");
    if(toolbar){const q=toolbar.querySelector("#auditCatalogSearch");if(q&&q.value!==filters.q)q.value=filters.q;const s=toolbar.querySelector("#auditCatalogStatus");if(s)s.value=filters.status;const c=toolbar.querySelector("#auditCatalogCategory");if(c)c.value=filters.category;}
    rendering=false;
  }
  window.__TUI_AUDIT_CATALOG_RENDER=()=>render(false);

  function loadCoverageAdapter(){
    if(window.__TUI_COBERTURA_AUDITADA_LOADED)return;
    if(document.querySelector('script[data-tui-audit-coverage]'))return;
    const s=document.createElement("script");s.src="cobertura-auditoria-tui.js?v=20260817-3";s.dataset.tuiAuditCoverage="1";s.onerror=()=>console.warn("TUI: no se pudo cargar cobertura-auditoria-tui.js");document.head.appendChild(s);
  }
  function init(){render(true);setTimeout(()=>render(false),250);setTimeout(()=>render(false),900);loadCoverageAdapter();const grid=document.getElementById("capasCatalogGrid");if(grid){const observer=new MutationObserver(()=>{if(rendering)return;if(grid.dataset.auditCatalog!=="1"||!grid.querySelector(".audit-group"))setTimeout(()=>render(false),0);});observer.observe(grid,{childList:true});}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();