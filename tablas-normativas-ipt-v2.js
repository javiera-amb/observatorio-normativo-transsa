(() => {
  "use strict";

  const FIELDS = [
    "COMUNA","RIALCOMSII","CODIGO_PRC","ZONA","USO","SUBZONA_USO","EDIF","SUBZONA_EDIF",
    "DEFINICION_ZONA","ESPECIF_GENERAL","ESPECIF_ESPECIF","UPERM","UPROH","TABLA",
    "DETALLE_TABLA_ORDENANZA","DENS_HAB_HA","DENS_VIV_HA","SUB_PREDIAL","CONSTRUCCION",
    "OCUPACION","OCUPACION_SUP","PISOS_MAX","ALTURA_MIN","ALTURA_MAX","ARBORIZACION","PAGE",
    "AREA_LIBRE_MIN","AGRUPAMIENTO","RASANTE","DIST_MEDIANEROS","ADOSAMIENTO","ANTEJARDIN",
    "INCENTIVO","FUENTE","COMENTS_NORM"
  ];

  const STORAGE_KEY = "tui_tablas_normativas_ipt_v2";
  const NULL_LITERALS = new Set(["NULL","N/A","N/D","-"]);
  const GROUP_ORDER = ["AISLADO","PAREADO","CONTINUO"];
  const DECIMAL_FIELDS = new Set(["CONSTRUCCION","OCUPACION","OCUPACION_SUP","ALTURA_MIN","ALTURA_MAX","AREA_LIBRE_MIN"]);
  const RANGE_FIELDS = new Set(["DENS_HAB_HA","DENS_VIV_HA","SUB_PREDIAL"]);

  const state = {
    search: "", region: "", status: "", selectedKey: "",
    audits: {}, results: {}, folderFiles: new Map(), folderName: "", current: null
  };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  function normalizeKey(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function fileCommuneKey(name) {
    return normalizeKey(String(name || "")
      .replace(/^PRC_/i, "")
      .replace(/_35_CAMPOS\.(csv|xlsx|xls)$/i, "")
      .replace(/_/g, " "));
  }

  function loadLocal() {
    try { state.audits = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { state.audits = {}; }
  }

  function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.audits)); }

  function catalog() { return window.TABLAS_NORMATIVAS_SHAREPOINT || {archivos:[]}; }

  function catalogIndex() {
    return new Map((catalog().archivos || []).map(name => [fileCommuneKey(name), {fileName:name}]));
  }

  function sourceBundle(region, comuna) {
    const registry = window.FUENTES_MULTIFUENTE_IPT?.por_comuna || {};
    const slug = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const exact = `${slug(region)}__${slug(comuna)}`;
    if (registry[exact]) return registry[exact];
    return Object.entries(registry).find(([key]) => key.endsWith(`__${slug(comuna)}`))?.[1] || null;
  }

  function universe() {
    const base = window.AVANCE_BASES_DATOS?.comunas || {};
    const seguimiento = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas) ? window.SEGUIMIENTO_NORMATIVO.comunas : [];
    const segIndex = new Map(seguimiento.map(item => [normalizeKey(item.comuna), item]));
    const sp = catalogIndex();

    return Object.entries(base).map(([key,item]) => {
      const seg = segIndex.get(normalizeKey(item.comuna)) || {};
      const canonical = sp.get(normalizeKey(item.comuna)) || null;
      const local = state.audits[key] || {};
      const hasAudit = Boolean(local.lastAudit);
      const critical = Number(local.critical || 0);
      const warnings = Number(local.warnings || 0);
      const approvals = local.approvals || {};
      const stagingReady = hasAudit && critical === 0 && warnings === 0 && approvals.sources && approvals.zones && approvals.codes;
      let status = canonical ? "TABLA GENERADA" : "SIN TABLA";
      if (hasAudit && critical > 0) status = "CON OBSERVACIONES";
      else if (hasAudit && warnings > 0) status = "EN AUDITORÍA";
      else if (hasAudit && stagingReady) status = "LISTA PARA STAGING";
      else if (hasAudit) status = "CORREGIDA";
      const sessionFile = state.folderFiles.get(normalizeKey(item.comuna)) || null;
      return {
        key, region:item.region, comuna:item.comuna, rialcomsii:item.codigo_sii || "",
        prc:item.prc || {}, instrumento:seg.prc_nombre || "", estadoFuente:seg.estado_fuente || "",
        canonical, sessionFile, local, status, hasAudit, stagingReady,
        observations:critical + warnings, sourceRegistered:Boolean(sourceBundle(item.region,item.comuna))
      };
    }).sort((a,b)=>a.region.localeCompare(b.region,"es") || a.comuna.localeCompare(b.comuna,"es"));
  }

  function statusClass(status) {
    if (status === "LISTA PARA STAGING") return "stage";
    if (status === "CORREGIDA" || status === "TABLA GENERADA") return "ok";
    if (status === "CON OBSERVACIONES") return "warn";
    if (status === "EN AUDITORÍA") return "audit";
    return "inventory";
  }

  function injectStyles() {
    if (document.getElementById("tablasNormativasStylesV2")) return;
    const style = document.createElement("style");
    style.id = "tablasNormativasStylesV2";
    style.textContent = `
      #module-tablas-normativas{padding-bottom:40px}.tn-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:20px 0}
      .tn-kpi,.tn-panel,.tn-table-card,.tn-detail{border:1px solid var(--line);background:#fff;border-radius:18px;box-shadow:var(--shadow)}.tn-kpi{padding:16px}.tn-kpi span{display:block;color:var(--muted);font-size:.74rem}.tn-kpi strong{display:block;margin-top:5px;color:var(--transsa-navy);font-size:1.55rem}
      .tn-panel{padding:18px;margin:16px 0}.tn-toolbar{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;align-items:end}.tn-toolbar label span{display:block;margin-bottom:5px;color:var(--muted);font-size:.73rem}.tn-toolbar input,.tn-toolbar select{width:100%;min-height:40px;border:1px solid var(--line);border-radius:10px;padding:0 10px;background:#fff}
      .tn-folder{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;align-items:start}.tn-folder-box{padding:16px;border:1px dashed #b8b8cc;border-radius:14px;background:#fafaff}.tn-folder-box input{width:100%;margin-top:10px}.tn-folder-status{padding:14px;border-radius:12px;background:#f7f7fb;color:var(--muted);font-size:.8rem}
      .tn-table-card{overflow:hidden}.tn-table-scroll{overflow:auto;max-height:650px}.tn-table{width:100%;border-collapse:collapse;font-size:.8rem}.tn-table th{position:sticky;top:0;z-index:1;background:#f7f7fb;text-align:left;color:var(--muted);font-weight:600}.tn-table th,.tn-table td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}.tn-table tbody tr:hover{background:#fafaff}.tn-table button{border:0;background:transparent;color:var(--transsa-blue);font-weight:600}
      .tn-pill{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:.67rem;font-weight:600;white-space:nowrap}.tn-pill.inventory{background:#f1f2f6;color:#666}.tn-pill.audit{background:#fff3d7;color:#8a5a00}.tn-pill.warn{background:#fff0f0;color:#a02f2f}.tn-pill.ok{background:#edf7f2;color:#2b7a5a}.tn-pill.stage{background:#e9ecff;color:#3437c9}
      .tn-detail{margin-top:20px;padding:21px}.tn-detail-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.tn-detail-head h3{margin:2px 0;color:var(--transsa-navy)}.tn-subtle{color:var(--muted);font-size:.8rem}.tn-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:17px 0}.tn-tab{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px}.tn-tab.active{background:var(--transsa-blue);border-color:var(--transsa-blue);color:#fff}
      .tn-note{padding:12px 14px;border-radius:12px;background:#f7f7fb;color:var(--muted);font-size:.79rem}.tn-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tn-field{padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#fff;font-size:.74rem}.tn-field strong{color:var(--transsa-navy)}
      .tn-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.tn-summary-grid div{padding:12px;border:1px solid var(--line);border-radius:12px}.tn-summary-grid span{display:block;color:var(--muted);font-size:.7rem}.tn-summary-grid strong{display:block;margin-top:5px;color:var(--transsa-navy)}
      .tn-findings,.tn-preview{overflow:auto;max-height:430px;border:1px solid var(--line);border-radius:12px}.tn-findings table,.tn-preview table{width:100%;border-collapse:collapse;font-size:.74rem}.tn-findings th,.tn-findings td,.tn-preview th,.tn-preview td{padding:8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;white-space:nowrap}.tn-findings th,.tn-preview th{background:#f7f7fb;position:sticky;top:0}.tn-preview td{max-width:220px;overflow:hidden;text-overflow:ellipsis}
      .tn-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.tn-actions button{min-height:39px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:#fff}.tn-actions .primary{background:var(--transsa-blue);border-color:var(--transsa-blue);color:#fff}.tn-actions button:disabled{opacity:.45;cursor:not-allowed}
      .tn-banner{margin:0 0 16px;padding:13px 15px;border-left:4px solid var(--transsa-blue);border-radius:0 12px 12px 0;background:#f3f3ff;color:#4b4b69;font-size:.8rem}.tn-checks{display:grid;gap:9px}.tn-check{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px;border:1px solid var(--line);border-radius:12px}.tn-check label{display:flex;gap:8px;align-items:center}
      @media(max-width:1000px){.tn-kpis{grid-template-columns:repeat(2,1fr)}.tn-folder{grid-template-columns:1fr}.tn-toolbar{grid-template-columns:1fr 1fr}.tn-fields{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.tn-kpis,.tn-summary-grid,.tn-toolbar,.tn-fields{grid-template-columns:1fr}.tn-detail-head{display:block}}
    `;
    document.head.appendChild(style);
  }

  function removeLegacyModule() {
    document.querySelector('[data-module="tablas-normativas"]')?.remove();
    document.querySelector('[data-module-jump="tablas-normativas"]')?.remove();
    document.getElementById("module-tablas-normativas")?.remove();
  }

  function addNavAndSection() {
    removeLegacyModule();
    const nav = document.querySelector(".module-nav");
    const main = document.querySelector("main");
    if (!nav || !main) return;
    const navButton = document.createElement("button");
    navButton.className = "module-tab"; navButton.dataset.module = "tablas-normativas"; navButton.textContent = "Tablas Normativas IPT"; nav.appendChild(navButton);
    const overview = document.querySelector(".tui-overview-grid");
    if (overview) {
      const card = document.createElement("button"); card.dataset.moduleJump = "tablas-normativas";
      card.innerHTML = '<span>05</span><strong>Tablas Normativas IPT</strong><small>SharePoint → auditoría → corrección → staging.</small>'; overview.appendChild(card); card.onclick = activateModule;
    }
    const section = document.createElement("section"); section.id = "module-tablas-normativas"; section.className = "module-panel";
    section.innerHTML = `
      <div class="module-header"><div><p class="eyebrow">TABLAS NORMATIVAS IPT</p><h2>Normalización comunal desde SharePoint</h2><p>La tabla canónica se conserva; la TUI genera una versión normalizada y un QA separado.</p></div></div>
      <div class="tn-banner"><strong>Origen:</strong> SharePoint DEI · <strong>Entrada:</strong> ${esc(catalog().carpeta_entrada || "01_TABLAS_CANONICAS")} · <strong>Salidas:</strong> ${esc(catalog().carpeta_salida_normalizadas || "02_TABLAS_NORMALIZADAS")} y ${esc(catalog().carpeta_salida_qa || "03_QA_TRAZABILIDAD")}. Los archivos seleccionados se procesan localmente en el navegador y no se publican en GitHub.</div>
      <section class="tn-panel"><div class="tn-folder"><div class="tn-folder-box"><strong>Seleccionar carpeta sincronizada de SharePoint</strong><p class="tn-subtle">Elige la carpeta <b>01_TABLAS_CANONICAS</b> desde el Explorador de Windows. Se reconocerán automáticamente los archivos por comuna.</p><input id="tnFolderInput" type="file" webkitdirectory directory multiple accept=".csv,.xlsx,.xls"><div class="tn-actions"><button id="tnAuditFolder" class="primary" type="button" disabled>Auditar carpeta completa</button></div></div><div id="tnFolderStatus" class="tn-folder-status">Inventario SharePoint registrado: <strong>${(catalog().archivos || []).length}</strong> tablas canónicas. Aún no se ha seleccionado la carpeta en esta sesión.</div></div></section>
      <section class="tn-kpis"><article class="tn-kpi"><span>Comunas universo TUI</span><strong id="tnMetricTotal">0</strong></article><article class="tn-kpi"><span>Tablas canónicas SharePoint</span><strong id="tnMetricCanonical">0</strong></article><article class="tn-kpi"><span>Auditadas</span><strong id="tnMetricAudited">0</strong></article><article class="tn-kpi"><span>Con observaciones</span><strong id="tnMetricObserved">0</strong></article><article class="tn-kpi"><span>Listas staging</span><strong id="tnMetricReady">0</strong></article></section>
      <section class="tn-panel"><div class="tn-toolbar"><label><span>Buscar comuna</span><input id="tnSearch" type="search" placeholder="Peñalolén, Puerto Octay…"></label><label><span>Región</span><select id="tnRegion"><option value="">Todas</option></select></label><label><span>Estado</span><select id="tnStatus"><option value="">Todos</option><option>SIN TABLA</option><option>TABLA GENERADA</option><option>EN AUDITORÍA</option><option>CON OBSERVACIONES</option><option>CORREGIDA</option><option>LISTA PARA STAGING</option></select></label><button id="tnClear" class="secondary-button" type="button">Limpiar</button></div></section>
      <section class="tn-table-card"><div class="tn-table-scroll"><table class="tn-table"><thead><tr><th>Región / comuna</th><th>Tabla SharePoint</th><th>Fuentes</th><th>Auditoría</th><th>Obs.</th><th>Estado</th><th></th></tr></thead><tbody id="tnTableBody"></tbody></table></div></section>
      <section id="tnDetail" class="tn-detail" hidden></section>`;
    main.appendChild(section);
    navButton.onclick = activateModule;
    document.getElementById("tnSearch").oninput = e => { state.search=e.target.value; renderTable(); };
    document.getElementById("tnRegion").onchange = e => { state.region=e.target.value; renderTable(); };
    document.getElementById("tnStatus").onchange = e => { state.status=e.target.value; renderTable(); };
    document.getElementById("tnClear").onclick = () => { state.search=state.region=state.status=""; document.getElementById("tnSearch").value=""; document.getElementById("tnRegion").value=""; document.getElementById("tnStatus").value=""; renderTable(); };
    document.getElementById("tnFolderInput").onchange = handleFolderSelection;
    document.getElementById("tnAuditFolder").onclick = auditFolder;
  }

  function activateModule() {
    document.querySelectorAll(".module-tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.module==="tablas-normativas"));
    document.querySelectorAll(".module-panel").forEach(panel=>panel.classList.toggle("active",panel.id==="module-tablas-normativas"));
    history.replaceState(null,"","#tablas-normativas"); renderAll();
  }

  function populateRegions() {
    const select=document.getElementById("tnRegion"); if(!select || select.options.length>1) return;
    [...new Set(universe().map(x=>x.region))].sort((a,b)=>a.localeCompare(b,"es")).forEach(region=>{const o=document.createElement("option");o.value=region;o.textContent=region;select.appendChild(o);});
  }

  function filtered() {
    const q=normalizeKey(state.search);
    return universe().filter(x=>!state.region||x.region===state.region).filter(x=>!state.status||x.status===state.status)
      .filter(x=>!q||normalizeKey(`${x.comuna} ${x.region} ${x.instrumento}`).includes(q));
  }

  function renderMetrics() {
    const items=universe();
    document.getElementById("tnMetricTotal").textContent=items.length;
    document.getElementById("tnMetricCanonical").textContent=items.filter(x=>x.canonical).length;
    document.getElementById("tnMetricAudited").textContent=items.filter(x=>x.hasAudit).length;
    document.getElementById("tnMetricObserved").textContent=items.filter(x=>x.observations>0).length;
    document.getElementById("tnMetricReady").textContent=items.filter(x=>x.stagingReady).length;
  }

  function renderTable() {
    const body=document.getElementById("tnTableBody"); if(!body) return;
    body.innerHTML=filtered().map(item=>`<tr><td><strong>${esc(item.comuna)}</strong><div class="tn-subtle">${esc(item.region)} · SII ${esc(item.rialcomsii||"—")}</div></td><td>${item.canonical?`<span class="tn-pill ok">${esc(item.canonical.fileName)}</span>${item.sessionFile?'<div class="tn-subtle">Disponible en sesión</div>':''}`:'<span class="tn-pill inventory">Sin tabla</span>'}</td><td><span class="tn-pill ${item.sourceRegistered?'ok':'inventory'}">${item.sourceRegistered?'Registradas':'Búsqueda pendiente'}</span></td><td>${esc(item.local.lastAudit||"—")}</td><td>${item.observations}</td><td><span class="tn-pill ${statusClass(item.status)}">${esc(item.status)}</span></td><td><button type="button" data-tn-open="${esc(item.key)}">Abrir →</button></td></tr>`).join("");
    body.querySelectorAll("[data-tn-open]").forEach(btn=>btn.onclick=()=>openDetail(btn.dataset.tnOpen));
  }

  function openDetail(key) {
    state.selectedKey=key; const item=universe().find(x=>x.key===key); if(!item) return;
    const detail=document.getElementById("tnDetail"); detail.hidden=false;
    detail.innerHTML=`<div class="tn-detail-head"><div><p class="eyebrow">FICHA COMUNAL</p><h3>${esc(item.comuna)}</h3><p class="tn-subtle">${esc(item.region)} · ${esc(item.instrumento||"Instrumento por verificar")}</p></div><span class="tn-pill ${statusClass(item.status)}">${esc(item.status)}</span></div><div class="tn-tabs"><button class="tn-tab active" data-tn-tab="resumen">Resumen</button><button class="tn-tab" data-tn-tab="campos">35 campos</button><button class="tn-tab" data-tn-tab="tabla">Tabla actual</button><button class="tn-tab" data-tn-tab="auditoria">Auditoría</button><button class="tn-tab" data-tn-tab="correcciones">Correcciones</button><button class="tn-tab" data-tn-tab="staging">Staging</button></div><div id="tnTabContent"></div>`;
    detail.querySelectorAll("[data-tn-tab]").forEach(btn=>btn.onclick=()=>{detail.querySelectorAll("[data-tn-tab]").forEach(x=>x.classList.toggle("active",x===btn));renderDetailTab(btn.dataset.tnTab,item);});
    renderDetailTab("resumen",item); detail.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderDetailTab(tab,item) {
    const box=document.getElementById("tnTabContent"); if(!box) return;
    if(tab==="campos"){box.innerHTML=`<div class="tn-note">Los nombres y el orden son contractuales. TIPO_VARIANTE y MOTIVO_VARIANTE se agregan después en staging.</div><div class="tn-fields" style="margin-top:14px">${FIELDS.map((f,i)=>`<div class="tn-field"><strong>${i+1}.</strong> ${esc(f)}</div>`).join("")}</div>`;return;}
    if(tab==="tabla"){renderTablePreview(box,item);return;}
    if(tab==="auditoria"){renderAuditTab(box,item);return;}
    if(tab==="correcciones"){renderCorrectionsTab(box,item);return;}
    if(tab==="staging"){renderStagingTab(box,item);return;}
    const file=item.sessionFile;
    box.innerHTML=`<div class="tn-summary-grid"><div><span>Tabla canónica SharePoint</span><strong>${esc(item.canonical?.fileName||"SIN TABLA")}</strong></div><div><span>Disponible en sesión</span><strong>${file?"SÍ":"NO"}</strong></div><div><span>Última auditoría</span><strong>${esc(item.local.lastAudit||"—")}</strong></div><div><span>Observaciones</span><strong>${item.observations}</strong></div></div><div class="tn-folder"><div class="tn-folder-box"><strong>Auditar tabla de ${esc(item.comuna)}</strong><p class="tn-subtle">${file?"La tabla fue reconocida desde la carpeta SharePoint seleccionada.":"Selecciona este archivo manualmente si aún no cargaste la carpeta SharePoint."}</p><input id="tnFileInput" type="file" accept=".csv,.xlsx,.xls"><div class="tn-actions">${file?'<button id="tnAuditSessionFile" class="primary" type="button">Auditar archivo reconocido</button>':''}</div></div><div class="tn-note"><strong>Normalización determinística inicial</strong><br>35 campos, vacíos, caracteres invisibles, decimales, agrupamiento, OCR sospechoso, CODIGO_PRC descriptivo, PISOS_MAX decimal, negativos, alturas incompatibles, duplicados y señales de columnas corridas. ZONA y CODIGO_PRC nunca se reemplazan globalmente sin fuente oficial.</div></div><div id="tnAuditPreview"></div>`;
    document.getElementById("tnFileInput")?.addEventListener("change",e=>auditSingleFile(e.target.files?.[0],item));
    document.getElementById("tnAuditSessionFile")?.addEventListener("click",()=>auditSingleFile(file,item));
    if(state.results[item.key]) renderAuditPreview(item);
  }

  async function ensureXlsx() {
    if(window.XLSX) return true;
    return new Promise(resolve=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);});
  }

  function makeFinding(row,field,original,proposed,type,confidence,reason,source="") { return {row,field,original,proposed,type,confidence,reason,source}; }

  function cleanCell(value,field,rowIndex,findings) {
    if(value===null||value===undefined) return "";
    const original=value;
    if(typeof value==="string"){
      value=value.replace(/[\u200B-\u200D\uFEFF]/g,"").trim().replace(/\s+/g," ");
      if(NULL_LITERALS.has(value.toUpperCase())){findings.push(makeFinding(rowIndex,field,original,"","NORMALIZACIÓN DE FORMATO","ALTA","Literal de ausencia reemplazado por celda vacía."));return "";}
    }
    if(field==="AGRUPAMIENTO"&&value){const tokens=String(value).toUpperCase().split(/[;,/]+/).map(x=>x.trim()).filter(Boolean);if(tokens.every(x=>GROUP_ORDER.includes(x))){const proposed=GROUP_ORDER.filter(x=>tokens.includes(x)).join("; ");if(proposed!==String(value))findings.push(makeFinding(rowIndex,field,original,proposed,"NORMALIZACIÓN DE FORMATO","ALTA","Agrupamiento normalizado sin duplicar filas."));return proposed;}}
    if(DECIMAL_FIELDS.has(field)&&typeof value==="string"&&/^-?\d+[.,]\d+$/.test(value.trim())){const num=Number(value.replace(",","."));if(Number.isFinite(num)){if(String(original)!==String(num))findings.push(makeFinding(rowIndex,field,original,num,"NORMALIZACIÓN DE FORMATO","ALTA","Separador decimal normalizado y valor convertido a número."));return num;}}
    return value;
  }

  function analyzeRows(headers,objects) {
    const findings=[]; const missing=FIELDS.filter(f=>!headers.includes(f)); const extras=headers.filter(h=>!FIELDS.includes(h));
    if(missing.length)findings.push(makeFinding(0,"ESTRUCTURA",missing.join(", "),"","ERROR CONFIRMADO","ALTA","Faltan campos productivos obligatorios."));
    if(extras.length)findings.push(makeFinding(0,"ESTRUCTURA",extras.join(", "),"","POSIBLE ERROR","MEDIA","Columnas adicionales; quedan fuera de la tabla productiva."));
    if(headers.length===FIELDS.length&&headers.some((h,i)=>h!==FIELDS[i]))findings.push(makeFinding(0,"ESTRUCTURA",headers.join(" | "),FIELDS.join(" | "),"NORMALIZACIÓN DE FORMATO","ALTA","Los 35 campos existen pero requieren orden productivo."));
    const originalRows=objects.map(row=>({...row}));
    const rows=objects.map((row,idx)=>{const out={};FIELDS.forEach(field=>out[field]=cleanCell(row[field],field,idx+2,findings));return out;});
    rows.forEach((row,idx)=>{
      const r=idx+2; const code=String(row.CODIGO_PRC||"").trim(); const zone=String(row.ZONA||"").trim();
      if(code&&(((code.match(/\s+/g)||[]).length>=2)||code.length>28))findings.push(makeFinding(r,"CODIGO_PRC",code,"","POSIBLE ERROR","MEDIA","Parece descripción y no identificador; requiere contraste por comuna e instrumento."));
      if(/^u[-\s]?\d+$/i.test(zone))findings.push(makeFinding(r,"ZONA",zone,"","POSIBLE ERROR","MEDIA","Nomenclatura candidata a normalización (p. ej. ZU#), pero no se reemplaza sin catálogo oficial del instrumento."));
      const pisos=row.PISOS_MAX; if((typeof pisos==="number"&&!Number.isInteger(pisos))||(typeof pisos==="string"&&/^\d+[.,]\d+$/.test(pisos)))findings.push(makeFinding(r,"PISOS_MAX",pisos,"","POSIBLE ERROR","ALTA","PISOS_MAX decimal; requiere fuente y nunca se trunca automáticamente."));
      ["CONSTRUCCION","OCUPACION","OCUPACION_SUP","ALTURA_MIN","ALTURA_MAX","AREA_LIBRE_MIN"].forEach(field=>{const v=row[field];if(typeof v==="number"&&v<0)findings.push(makeFinding(r,field,v,"","POSIBLE ERROR","MEDIA","Valor negativo inusual en parámetro normativo."));if(typeof v==="string"&&/(^|[^A-Z])[OPIl][.,]?\d|\d[.,]?[OIl]($|[^A-Z])/i.test(v))findings.push(makeFinding(r,field,v,"","POSIBLE ERROR","MEDIA","Patrón compatible con OCR O/0, P/0 o I/l/1; no se autocorrige sin fuente."));});
      RANGE_FIELDS.forEach(field=>{const v=String(row[field]||"").trim();if(v&&/\d\s*[-–]\s*\d/.test(v)===false&&/[A-Za-z]/.test(v)===false&&!/^\d+(?:[.,]\d+)?$/.test(v))findings.push(makeFinding(r,field,v,"","POSIBLE ERROR","BAJA","Formato no reconocido como número, rango o código especial."));});
      const amin=Number(String(row.ALTURA_MIN).replace(",",".")); const amax=Number(String(row.ALTURA_MAX).replace(",",".")); if(Number.isFinite(amin)&&Number.isFinite(amax)&&amin>amax)findings.push(makeFinding(r,"ALTURA_MIN / ALTURA_MAX",`${row.ALTURA_MIN} > ${row.ALTURA_MAX}`,"","ERROR CONFIRMADO","ALTA","ALTURA_MIN es mayor que ALTURA_MAX."));
      if(/AISLADO|PAREADO|CONTINUO/i.test(String(row.AREA_LIBRE_MIN||"")))findings.push(makeFinding(r,"AREA_LIBRE_MIN",row.AREA_LIBRE_MIN,"","POSIBLE ERROR","MEDIA","Contenido compatible con AGRUPAMIENTO; posible desplazamiento de columnas."));
      if(/AISLADO|PAREADO|CONTINUO/i.test(String(row.RASANTE||"")))findings.push(makeFinding(r,"RASANTE",row.RASANTE,"","POSIBLE ERROR","MEDIA","Contenido incompatible con rasante; posible desplazamiento de columnas."));
      const page=String(row.PAGE||"").trim(); if(page&&!/^\d+(?:\s*[-–]\s*\d+)?$/.test(page))findings.push(makeFinding(r,"PAGE",page,"","POSIBLE ERROR","BAJA","PAGE no parece página o rango de páginas."));
    });
    const seen=new Map(); rows.forEach((row,idx)=>{const sig=JSON.stringify(FIELDS.map(f=>row[f]));if(seen.has(sig))findings.push(makeFinding(idx+2,"FILA",`Duplicada con fila ${seen.get(sig)}`,"","ERROR CONFIRMADO","ALTA","Registro completamente duplicado."));else seen.set(sig,idx+2);});
    const zoneGroups=new Map(); rows.forEach((row,idx)=>{const k=normalizeKey(`${row.CODIGO_PRC}|${row.ZONA}`);if(!k)return;const sig=JSON.stringify([row.UPERM,row.UPROH,row.DENS_HAB_HA,row.DENS_VIV_HA,row.SUB_PREDIAL,row.CONSTRUCCION,row.OCUPACION,row.OCUPACION_SUP,row.PISOS_MAX,row.ALTURA_MIN,row.ALTURA_MAX,row.AGRUPAMIENTO,row.RASANTE,row.ANTEJARDIN]);if(!zoneGroups.has(k))zoneGroups.set(k,new Map());const g=zoneGroups.get(k);g.set(sig,[...(g.get(sig)||[]),idx+2]);});
    zoneGroups.forEach(g=>{if(g.size>1){const rowsConflict=[...g.values()].flat();findings.push(makeFinding(rowsConflict.join(", "),"CODIGO_PRC / ZONA","Mismo código/zona con parámetros distintos","","POSIBLE ERROR","MEDIA","Puede ser subzona válida o contradicción; revisar instrumento y alcance espacial."));}});
    const critical=findings.filter(f=>f.type==="ERROR CONFIRMADO").length; const warnings=findings.filter(f=>f.type==="POSIBLE ERROR").length; const auto=findings.filter(f=>f.type==="NORMALIZACIÓN DE FORMATO").length;
    return {headers,originalRows,rows,findings,critical,warnings,auto,missing,extras};
  }

  async function parseFile(file) {
    const ok=await ensureXlsx(); if(!ok) throw new Error("No se pudo cargar SheetJS");
    const data=await file.arrayBuffer(); const wb=XLSX.read(data,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]]; const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:true});
    const headers=(matrix[0]||[]).map(x=>String(x).trim()); const objects=matrix.slice(1).filter(r=>r.some(v=>String(v).trim()!=="")).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??""])));
    return analyzeRows(headers,objects);
  }

  function persistAudit(item,file,result) {
    state.results[item.key]={key:item.key,fileName:file.name,...result}; state.current=state.results[item.key];
    state.audits[item.key]={...(state.audits[item.key]||{}),lastAudit:new Date().toLocaleString("es-CL"),fileName:file.name,critical:result.critical,warnings:result.warnings,auto:result.auto,rows:result.rows.length,missing:result.missing.length,approvals:state.audits[item.key]?.approvals||{sources:false,zones:false,codes:false}}; saveLocal();
  }

  async function auditSingleFile(file,item) {
    if(!file)return; try{const result=await parseFile(file);persistAudit(item,file,result);renderMetrics();renderTable();openDetail(item.key);renderAuditPreview(item);}catch(error){console.error(error);alert("No se pudo leer la tabla seleccionada.");}
  }

  function handleFolderSelection(event) {
    const files=[...(event.target.files||[])].filter(f=>/\.(csv|xlsx|xls)$/i.test(f.name)); state.folderFiles.clear();
    files.forEach(file=>state.folderFiles.set(fileCommuneKey(file.name),file)); state.folderName=files[0]?.webkitRelativePath?.split("/")[0]||"carpeta seleccionada";
    const expected=catalogIndex(); const matched=[...state.folderFiles.keys()].filter(k=>expected.has(k)).length; const extra=[...state.folderFiles.keys()].filter(k=>!expected.has(k)).length;
    document.getElementById("tnFolderStatus").innerHTML=`Carpeta seleccionada: <strong>${esc(state.folderName)}</strong><br>Archivos compatibles: <strong>${files.length}</strong> · Coinciden con inventario SharePoint: <strong>${matched}</strong>${extra?` · No inventariados: <strong>${extra}</strong>`:""}.`;
    document.getElementById("tnAuditFolder").disabled=matched===0; renderTable(); if(state.selectedKey)openDetail(state.selectedKey);
  }

  async function auditFolder() {
    const button=document.getElementById("tnAuditFolder"); const items=universe().filter(x=>x.sessionFile); if(!items.length)return;
    button.disabled=true; const original=button.textContent; let done=0;
    for(const item of items){button.textContent=`Auditando ${done+1}/${items.length}…`;try{const result=await parseFile(item.sessionFile);persistAudit(item,item.sessionFile,result);}catch(error){console.error("Error en",item.comuna,error);}done++;}
    button.textContent=original; button.disabled=false; renderMetrics();renderTable(); if(state.selectedKey)openDetail(state.selectedKey);
  }

  function renderAuditPreview(item) {
    const box=document.getElementById("tnAuditPreview"); const cur=state.results[item.key]; if(!box||!cur)return;
    box.innerHTML=`<div class="tn-summary-grid"><div><span>Filas</span><strong>${cur.rows.length}</strong></div><div><span>Errores confirmados</span><strong>${cur.critical}</strong></div><div><span>Posibles errores</span><strong>${cur.warnings}</strong></div><div><span>Normalizaciones formato</span><strong>${cur.auto}</strong></div></div><div class="tn-actions"><button class="primary" id="tnOpenAudit" type="button">Ver auditoría</button><button id="tnOpenCorrections" type="button">Ver correcciones</button><button id="tnExportTable" type="button">Exportar normalizada</button><button id="tnExportQa" type="button">Exportar QA</button></div>`;
    document.getElementById("tnOpenAudit").onclick=()=>document.querySelector('[data-tn-tab="auditoria"]')?.click(); document.getElementById("tnOpenCorrections").onclick=()=>document.querySelector('[data-tn-tab="correcciones"]')?.click(); document.getElementById("tnExportTable").onclick=()=>exportNormalized(item,cur); document.getElementById("tnExportQa").onclick=()=>exportQa(item,cur);
  }

  function renderTablePreview(box,item) {
    const cur=state.results[item.key]; if(!cur){box.innerHTML='<div class="tn-note">Audita la tabla para visualizar aquí la versión original cargada. La TUI no destruye ni reemplaza el archivo canónico de SharePoint.</div>';return;}
    const show=cur.originalRows.slice(0,50); box.innerHTML=`<div class="tn-note">Vista de la tabla original cargada. Se muestran hasta 50 filas.</div><div class="tn-preview" style="margin-top:12px"><table><thead><tr>${FIELDS.map(f=>`<th>${esc(f)}</th>`).join("")}</tr></thead><tbody>${show.map(row=>`<tr>${FIELDS.map(f=>`<td title="${esc(row[f]??"")}">${esc(row[f]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderAuditTab(box,item) {
    const cur=state.results[item.key]; if(!cur){box.innerHTML='<div class="tn-note">Carga o audita la tabla canónica para ejecutar QA.</div>';return;}
    box.innerHTML=`<div class="tn-findings"><table><thead><tr><th>Fila</th><th>Campo</th><th>Original</th><th>Propuesto</th><th>Estado</th><th>Confianza</th><th>Motivo</th></tr></thead><tbody>${cur.findings.map(f=>`<tr><td>${esc(f.row||"—")}</td><td>${esc(f.field)}</td><td>${esc(f.original)}</td><td>${esc(f.proposed)}</td><td>${esc(f.type)}</td><td>${esc(f.confidence)}</td><td>${esc(f.reason)}</td></tr>`).join("")||'<tr><td colspan="7">Sin hallazgos automáticos.</td></tr>'}</tbody></table></div>`;
  }

  function renderCorrectionsTab(box,item) {
    const cur=state.results[item.key]; if(!cur){box.innerHTML='<div class="tn-note">Audita la tabla para generar propuestas de corrección.</div>';return;}
    const corrections=cur.findings.filter(f=>f.proposed!==""&&f.proposed!==undefined);
    box.innerHTML=`<div class="tn-note"><strong>Regla:</strong> sólo las normalizaciones determinísticas de alta confianza se aplican automáticamente. Correcciones de CODIGO_PRC, ZONA, OCR o conflicto normativo requieren fuente oficial.</div><div class="tn-findings" style="margin-top:12px"><table><thead><tr><th>Fila</th><th>Campo</th><th>Valor original</th><th>Valor nuevo</th><th>Motivo</th><th>Fuente</th><th>Confianza</th></tr></thead><tbody>${corrections.map(f=>`<tr><td>${esc(f.row)}</td><td>${esc(f.field)}</td><td>${esc(f.original)}</td><td>${esc(f.proposed)}</td><td>${esc(f.reason)}</td><td>${esc(f.source||"—")}</td><td>${esc(f.confidence)}</td></tr>`).join("")||'<tr><td colspan="7">No hay correcciones automáticas propuestas.</td></tr>'}</tbody></table></div><div class="tn-actions"><button class="primary" id="tnExportCorrected" type="button">Exportar tabla corregida</button><button id="tnExportTrace" type="button">Exportar trazabilidad QA</button></div>`;
    box.querySelector("#tnExportCorrected").onclick=()=>exportNormalized(item,cur); box.querySelector("#tnExportTrace").onclick=()=>exportQa(item,cur);
  }

  function renderStagingTab(box,item) {
    const local=state.audits[item.key]||{}; const a=local.approvals||{sources:false,zones:false,codes:false};
    const checks=[["Tiene auditoría de tabla",Boolean(local.lastAudit),false],["Tiene exactamente 35 campos productivos",Boolean(local.lastAudit)&&Number(local.missing||0)===0,false],["Sin errores confirmados",Boolean(local.lastAudit)&&Number(local.critical||0)===0,false],["Sin posibles errores pendientes",Boolean(local.lastAudit)&&Number(local.warnings||0)===0,false],["Fuentes normativas contrastadas",Boolean(a.sources),"sources"],["Zonas validadas contra instrumento",Boolean(a.zones),"zones"],["CODIGO_PRC validado",Boolean(a.codes),"codes"]];
    const ready=checks.every(x=>x[1]); box.innerHTML=`<div class="tn-note">Las aprobaciones documentales siguen siendo humanas hasta que el comparador por instrumento tenga evidencia suficiente. Nunca se marca una fuente como validada sólo por existir.</div><div class="tn-checks" style="margin-top:13px">${checks.map(([label,ok,key])=>`<div class="tn-check"><label>${key?`<input type="checkbox" data-tn-approval="${key}" ${ok?"checked":""}>`:""}<span>${esc(label)}</span></label><span class="tn-pill ${ok?'ok':'warn'}">${ok?'OK':'PENDIENTE'}</span></div>`).join("")}</div><div class="tn-actions"><button class="primary" ${ready?'':'disabled'} type="button">${ready?'LISTA PARA STAGING':'NO LISTA PARA STAGING'}</button></div>`;
    box.querySelectorAll("[data-tn-approval]").forEach(input=>input.onchange=()=>{const rec=state.audits[item.key]||{};rec.approvals=rec.approvals||{};rec.approvals[input.dataset.tnApproval]=input.checked;state.audits[item.key]=rec;saveLocal();renderMetrics();renderTable();renderStagingTab(box,universe().find(x=>x.key===item.key));});
  }

  function safeName(comuna) { return comuna.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,"").toUpperCase(); }

  function exportNormalized(item,cur) {
    const ws=XLSX.utils.json_to_sheet(cur.rows,{header:FIELDS}); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"TABLA_NORMALIZADA"); XLSX.writeFile(wb,`PRC_${safeName(item.comuna)}_NORMALIZADO.xlsx`);
  }

  function exportQa(item,cur) {
    const qa=cur.findings.map(f=>({COMUNA:item.comuna,FILA:f.row,CAMPO:f.field,"Valor original":f.original,"Valor nuevo":f.proposed,Motivo:f.reason,Fuente:f.source||"",Confianza:f.confidence,Estado:f.type})); const ws=XLSX.utils.json_to_sheet(qa); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"QA_TRAZABILIDAD"); XLSX.writeFile(wb,`QA_PRC_${safeName(item.comuna)}.xlsx`);
  }

  function renderAll(){populateRegions();renderMetrics();renderTable();if(state.selectedKey)openDetail(state.selectedKey);}

  function init(){loadLocal();injectStyles();addNavAndSection();populateRegions();renderAll();if(location.hash==="#tablas-normativas")activateModule();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
