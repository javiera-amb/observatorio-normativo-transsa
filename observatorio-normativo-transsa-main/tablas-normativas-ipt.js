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

  const NULL_LITERALS = new Set(["NULL","N/A","N/D","-"]);
  const NUMERICISH = new Set([
    "CONSTRUCCION","OCUPACION","OCUPACION_SUP","PISOS_MAX","ALTURA_MIN","ALTURA_MAX","AREA_LIBRE_MIN"
  ]);
  const GROUP_ORDER = ["AISLADO","PAREADO","CONTINUO"];
  const STORAGE_KEY = "tui_tablas_normativas_ipt_v1";

  const state = {
    search: "",
    region: "",
    status: "",
    selectedKey: "",
    audits: {},
    current: null
  };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  function normalizeKey(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function loadLocal() {
    try { state.audits = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { state.audits = {}; }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.audits));
  }

  function universe() {
    const base = window.AVANCE_BASES_DATOS?.comunas || {};
    const seguimiento = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
      ? window.SEGUIMIENTO_NORMATIVO.comunas : [];
    const segIndex = new Map(seguimiento.map(item => [normalizeKey(item.comuna), item]));

    return Object.entries(base).map(([key, item]) => {
      const seg = segIndex.get(normalizeKey(item.comuna)) || {};
      const local = state.audits[key] || {};
      const hasAudit = Boolean(local.lastAudit);
      const critical = Number(local.critical || 0);
      const warnings = Number(local.warnings || 0);
      const approvals = local.approvals || {};
      const stagingReady = hasAudit && critical === 0 && approvals.sources && approvals.zones && approvals.codes;
      let status = "POR INVENTARIAR";
      if (hasAudit && critical > 0) status = "CON OBSERVACIONES";
      else if (hasAudit && warnings > 0) status = "EN AUDITORÍA";
      else if (hasAudit && stagingReady) status = "LISTA PARA STAGING";
      else if (hasAudit) status = "CORREGIDA";
      return {
        key,
        region: item.region,
        comuna: item.comuna,
        rialcomsii: item.codigo_sii || "",
        prc: item.prc || {},
        instrumento: seg.prc_nombre || "",
        estadoFuente: seg.estado_fuente || "",
        local,
        status,
        stagingReady,
        hasAudit,
        observations: critical + warnings
      };
    }).sort((a,b) => a.region.localeCompare(b.region,"es") || a.comuna.localeCompare(b.comuna,"es"));
  }

  function injectStyles() {
    if (document.getElementById("tablasNormativasStyles")) return;
    const style = document.createElement("style");
    style.id = "tablasNormativasStyles";
    style.textContent = `
      #module-tablas-normativas{padding-bottom:40px}
      .tn-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:22px 0}
      .tn-kpi,.tn-panel,.tn-table-card,.tn-detail{border:1px solid var(--line);background:#fff;border-radius:18px;box-shadow:var(--shadow)}
      .tn-kpi{padding:18px}.tn-kpi span{display:block;color:var(--muted);font-size:.78rem}.tn-kpi strong{display:block;margin-top:6px;color:var(--transsa-navy);font-size:1.8rem}
      .tn-panel{padding:20px;margin:18px 0}.tn-toolbar{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px;align-items:end}
      .tn-toolbar label span{display:block;margin-bottom:6px;color:var(--muted);font-size:.75rem}.tn-toolbar input,.tn-toolbar select{width:100%;min-height:42px;border:1px solid var(--line);border-radius:10px;padding:0 11px;background:#fff}
      .tn-table-card{overflow:hidden}.tn-table-scroll{overflow:auto;max-height:640px}.tn-table{width:100%;border-collapse:collapse;font-size:.82rem}.tn-table th{position:sticky;top:0;z-index:1;background:#f7f7fb;text-align:left;color:var(--muted);font-weight:600}.tn-table th,.tn-table td{padding:12px 13px;border-bottom:1px solid var(--line);vertical-align:top}.tn-table tbody tr:hover{background:#fafaff}.tn-table button{border:0;background:transparent;color:var(--transsa-blue);font-weight:600}
      .tn-pill{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:.68rem;font-weight:600;white-space:nowrap}.tn-pill.inventory{background:#f1f2f6;color:#666}.tn-pill.audit{background:#fff3d7;color:#8a5a00}.tn-pill.warn{background:#fff0f0;color:#a02f2f}.tn-pill.ok{background:#edf7f2;color:#2b7a5a}.tn-pill.stage{background:#e9ecff;color:#3437c9}
      .tn-detail{margin-top:20px;padding:22px}.tn-detail-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.tn-detail-head h3{margin:2px 0;color:var(--transsa-navy)}.tn-subtle{color:var(--muted);font-size:.82rem}.tn-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.tn-tab{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px}.tn-tab.active{background:var(--transsa-blue);border-color:var(--transsa-blue);color:#fff}
      .tn-upload{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.tn-drop{padding:18px;border:1px dashed #b8b8cc;border-radius:14px;background:#fafaff}.tn-drop input{display:block;margin-top:10px;width:100%}.tn-note{padding:12px 14px;border-radius:12px;background:#f7f7fb;color:var(--muted);font-size:.8rem}
      .tn-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tn-field{padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#fff;font-size:.75rem}.tn-field strong{color:var(--transsa-navy)}
      .tn-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:15px 0}.tn-summary-grid div{padding:13px;border:1px solid var(--line);border-radius:12px}.tn-summary-grid span{display:block;color:var(--muted);font-size:.72rem}.tn-summary-grid strong{display:block;margin-top:5px;color:var(--transsa-navy)}
      .tn-findings{overflow:auto;max-height:420px;border:1px solid var(--line);border-radius:12px}.tn-findings table{width:100%;border-collapse:collapse;font-size:.76rem}.tn-findings th,.tn-findings td{padding:9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.tn-findings th{background:#f7f7fb;position:sticky;top:0}
      .tn-checks{display:grid;gap:10px}.tn-check{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:12px}.tn-check label{display:flex;gap:9px;align-items:center}.tn-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}.tn-actions button{min-height:40px;padding:0 13px;border-radius:10px;border:1px solid var(--line);background:#fff}.tn-actions .primary{background:var(--transsa-blue);border-color:var(--transsa-blue);color:#fff}.tn-actions button:disabled{opacity:.45;cursor:not-allowed}
      .tn-banner{margin:0 0 18px;padding:14px 16px;border-left:4px solid var(--transsa-blue);border-radius:0 12px 12px 0;background:#f3f3ff;color:#4b4b69;font-size:.82rem}
      @media(max-width:900px){.tn-kpis{grid-template-columns:repeat(2,1fr)}.tn-toolbar{grid-template-columns:1fr 1fr}.tn-upload{grid-template-columns:1fr}.tn-fields{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.tn-kpis,.tn-summary-grid,.tn-toolbar,.tn-fields{grid-template-columns:1fr}.tn-detail-head{display:block}}
    `;
    document.head.appendChild(style);
  }

  function statusClass(status) {
    if (status === "LISTA PARA STAGING") return "stage";
    if (status === "CORREGIDA") return "ok";
    if (status === "CON OBSERVACIONES") return "warn";
    if (status === "EN AUDITORÍA") return "audit";
    return "inventory";
  }

  function addNavAndSection() {
    if (document.querySelector('[data-module="tablas-normativas"]')) return;
    const nav = document.querySelector(".module-nav");
    const main = document.querySelector("main");
    if (!nav || !main) return;

    const navButton = document.createElement("button");
    navButton.className = "module-tab";
    navButton.dataset.module = "tablas-normativas";
    navButton.textContent = "Tablas Normativas IPT";
    nav.appendChild(navButton);

    const overview = document.querySelector(".tui-overview-grid");
    if (overview) {
      const card = document.createElement("button");
      card.dataset.moduleJump = "tablas-normativas";
      card.innerHTML = '<span>05</span><strong>Tablas Normativas IPT</strong><small>Auditoría, corrección, trazabilidad y preparación para staging.</small>';
      overview.appendChild(card);
      card.addEventListener("click", () => activateModule());
    }

    const section = document.createElement("section");
    section.id = "module-tablas-normativas";
    section.className = "module-panel";
    section.innerHTML = `
      <div class="module-header">
        <div><p class="eyebrow">TABLAS NORMATIVAS IPT</p><h2>Auditar, corregir y preparar tablas comunales</h2><p>Fuente normativa → auditoría → corrección → tabla normalizada por comuna.</p></div>
      </div>
      <div class="tn-banner">La tabla productiva mantiene exactamente 35 campos. Los hallazgos QA, fuentes, decisiones y aprobaciones se guardan separados. La auditoría de archivo se ejecuta localmente en el navegador: el Excel no se sube a GitHub.</div>
      <section class="tn-kpis">
        <article class="tn-kpi"><span>Comunas en universo TUI</span><strong id="tnMetricTotal">0</strong></article>
        <article class="tn-kpi"><span>Tablas auditadas localmente</span><strong id="tnMetricAudited">0</strong></article>
        <article class="tn-kpi"><span>Con observaciones</span><strong id="tnMetricObserved">0</strong></article>
        <article class="tn-kpi"><span>Listas para staging</span><strong id="tnMetricReady">0</strong></article>
      </section>
      <section class="tn-panel">
        <div class="tn-toolbar">
          <label><span>Buscar comuna</span><input id="tnSearch" type="search" placeholder="Peñalolén, Puerto Octay, Coquimbo…"></label>
          <label><span>Región</span><select id="tnRegion"><option value="">Todas</option></select></label>
          <label><span>Estado</span><select id="tnStatus"><option value="">Todos</option><option>POR INVENTARIAR</option><option>EN AUDITORÍA</option><option>CON OBSERVACIONES</option><option>CORREGIDA</option><option>LISTA PARA STAGING</option></select></label>
          <button id="tnClear" class="secondary-button" type="button">Limpiar</button>
        </div>
      </section>
      <section class="tn-table-card"><div class="tn-table-scroll"><table class="tn-table"><thead><tr><th>Región / comuna</th><th>Tabla</th><th>Instrumento identificado</th><th>Auditoría</th><th>Obs.</th><th>Estado</th><th></th></tr></thead><tbody id="tnTableBody"></tbody></table></div></section>
      <section id="tnDetail" class="tn-detail" hidden></section>
    `;
    main.appendChild(section);

    navButton.addEventListener("click", activateModule);
    document.getElementById("tnSearch").addEventListener("input", e => { state.search = e.target.value; renderTable(); });
    document.getElementById("tnRegion").addEventListener("change", e => { state.region = e.target.value; renderTable(); });
    document.getElementById("tnStatus").addEventListener("change", e => { state.status = e.target.value; renderTable(); });
    document.getElementById("tnClear").addEventListener("click", () => {
      state.search = state.region = state.status = "";
      document.getElementById("tnSearch").value = "";
      document.getElementById("tnRegion").value = "";
      document.getElementById("tnStatus").value = "";
      renderTable();
    });
  }

  function activateModule() {
    document.querySelectorAll(".module-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.module === "tablas-normativas"));
    document.querySelectorAll(".module-panel").forEach(panel => panel.classList.toggle("active", panel.id === "module-tablas-normativas"));
    history.replaceState(null, "", "#tablas-normativas");
    renderAll();
    document.getElementById("module-tablas-normativas")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function populateRegions() {
    const select = document.getElementById("tnRegion");
    if (!select || select.options.length > 1) return;
    [...new Set(universe().map(x => x.region))].sort((a,b)=>a.localeCompare(b,"es")).forEach(region => {
      const opt = document.createElement("option"); opt.value = region; opt.textContent = region; select.appendChild(opt);
    });
  }

  function filtered() {
    const q = normalizeKey(state.search);
    return universe().filter(item => !state.region || item.region === state.region)
      .filter(item => !state.status || item.status === state.status)
      .filter(item => !q || normalizeKey(`${item.comuna} ${item.region} ${item.instrumento}`).includes(q));
  }

  function renderMetrics() {
    const items = universe();
    document.getElementById("tnMetricTotal").textContent = items.length;
    document.getElementById("tnMetricAudited").textContent = items.filter(x=>x.hasAudit).length;
    document.getElementById("tnMetricObserved").textContent = items.filter(x=>x.observations>0).length;
    document.getElementById("tnMetricReady").textContent = items.filter(x=>x.stagingReady).length;
  }

  function renderTable() {
    const body = document.getElementById("tnTableBody");
    if (!body) return;
    body.innerHTML = filtered().map(item => `
      <tr>
        <td><strong>${esc(item.comuna)}</strong><div class="tn-subtle">${esc(item.region)} · SII ${esc(item.rialcomsii || "—")}</div></td>
        <td>${item.hasAudit ? '<span class="tn-pill ok">Auditada</span>' : '<span class="tn-pill inventory">No inventariada en módulo</span>'}</td>
        <td>${esc(item.instrumento || "Sin instrumento comunal consolidado")}</td>
        <td>${item.local.lastAudit ? esc(item.local.lastAudit) : "—"}</td>
        <td>${item.observations}</td>
        <td><span class="tn-pill ${statusClass(item.status)}">${esc(item.status)}</span></td>
        <td><button type="button" data-tn-open="${esc(item.key)}">Abrir →</button></td>
      </tr>`).join("");
    body.querySelectorAll("[data-tn-open]").forEach(btn => btn.addEventListener("click", () => openDetail(btn.dataset.tnOpen)));
  }

  function openDetail(key) {
    state.selectedKey = key;
    const item = universe().find(x=>x.key===key);
    if (!item) return;
    const detail = document.getElementById("tnDetail");
    detail.hidden = false;
    detail.innerHTML = `
      <div class="tn-detail-head"><div><p class="eyebrow">FICHA COMUNAL</p><h3>${esc(item.comuna)}</h3><p class="tn-subtle">${esc(item.region)} · ${esc(item.instrumento || "Instrumento comunal por verificar")}</p></div><span class="tn-pill ${statusClass(item.status)}">${esc(item.status)}</span></div>
      <div class="tn-tabs"><button class="tn-tab active" data-tn-tab="resumen">Resumen</button><button class="tn-tab" data-tn-tab="campos">35 campos</button><button class="tn-tab" data-tn-tab="auditoria">Auditoría</button><button class="tn-tab" data-tn-tab="staging">Staging</button></div>
      <div id="tnTabContent"></div>`;
    detail.querySelectorAll("[data-tn-tab]").forEach(btn => btn.addEventListener("click", () => {
      detail.querySelectorAll("[data-tn-tab]").forEach(x=>x.classList.toggle("active",x===btn));
      renderDetailTab(btn.dataset.tnTab,item);
    }));
    renderDetailTab("resumen", item);
    detail.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderDetailTab(tab, item) {
    const box = document.getElementById("tnTabContent");
    if (!box) return;
    if (tab === "campos") {
      box.innerHTML = `<div class="tn-note">Estos nombres y este orden son contractuales para producción. TIPO_VARIANTE y MOTIVO_VARIANTE se agregan después, en staging.</div><div class="tn-fields" style="margin-top:14px">${FIELDS.map((f,i)=>`<div class="tn-field"><strong>${i+1}.</strong> ${esc(f)}</div>`).join("")}</div>`;
      return;
    }
    if (tab === "auditoria") { renderAuditTab(box,item); return; }
    if (tab === "staging") { renderStagingTab(box,item); return; }

    box.innerHTML = `
      <div class="tn-summary-grid"><div><span>Estado PRC operativo</span><strong>${esc(item.prc.estado_produccion || "—")}</strong></div><div><span>Fuente / vigencia</span><strong>${esc(item.estadoFuente || "Por verificar")}</strong></div><div><span>Última auditoría tabla</span><strong>${esc(item.local.lastAudit || "—")}</strong></div><div><span>Observaciones tabla</span><strong>${item.observations}</strong></div></div>
      <div class="tn-upload"><div class="tn-drop"><strong>Auditar tabla existente</strong><p class="tn-subtle">Carga XLSX, XLS o CSV. El archivo se procesa sólo en tu navegador.</p><input id="tnFileInput" type="file" accept=".xlsx,.xls,.csv"></div><div class="tn-note"><strong>Qué revisa esta primera capa</strong><br>35 campos y orden, NULL literales, formatos, OCR sospechoso, CODIGO_PRC descriptivo, PISOS_MAX decimal, negativos, ALTURA_MIN > ALTURA_MAX, agrupamiento y posibles columnas corridas.</div></div>
      <div id="tnAuditPreview"></div>`;
    document.getElementById("tnFileInput")?.addEventListener("change", e => auditFile(e.target.files?.[0], item));
    if (state.current?.key === item.key) renderAuditPreview(item);
  }

  async function ensureXlsx() {
    if (window.XLSX) return true;
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload = () => resolve(true); s.onerror = () => resolve(false); document.head.appendChild(s);
    });
  }

  function cleanCell(value, field, rowIndex, findings) {
    if (value === null || value === undefined) return "";
    const original = value;
    if (typeof value === "string") {
      value = value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().replace(/\s+/g, " ");
      if (NULL_LITERALS.has(value.toUpperCase())) {
        findings.push(makeFinding(rowIndex, field, original, "", "NORMALIZACIÓN DE FORMATO", "ALTA", "Literal de ausencia reemplazado por celda vacía."));
        return "";
      }
    }
    if (field === "AGRUPAMIENTO" && value) {
      const tokens = String(value).toUpperCase().split(/[;,/]+/).map(x=>x.trim()).filter(Boolean);
      if (tokens.every(x=>GROUP_ORDER.includes(x))) {
        const proposed = GROUP_ORDER.filter(x=>tokens.includes(x)).join("; ");
        if (proposed !== String(value)) findings.push(makeFinding(rowIndex, field, original, proposed, "NORMALIZACIÓN DE FORMATO", "ALTA", "Agrupamiento normalizado sin dividir la fila."));
        return proposed;
      }
    }
    if (NUMERICISH.has(field) && typeof value === "string" && /^-?\d+[.,]\d+$/.test(value.trim())) {
      const num = Number(value.replace(",","."));
      if (Number.isFinite(num) && field !== "PISOS_MAX") return num;
    }
    return value;
  }

  function makeFinding(row, field, original, proposed, type, confidence, reason) {
    return {row,field,original,proposed,type,confidence,reason};
  }

  function analyzeRows(headers, rows) {
    const findings = [];
    const missing = FIELDS.filter(f=>!headers.includes(f));
    const extras = headers.filter(h=>!FIELDS.includes(h));
    if (missing.length) findings.push(makeFinding(0,"ESTRUCTURA",missing.join(", "),"","ERROR CONFIRMADO","ALTA","Faltan campos obligatorios."));
    if (extras.length) findings.push(makeFinding(0,"ESTRUCTURA",extras.join(", "),"","POSIBLE ERROR","MEDIA","Existen columnas adicionales; no se incluirán en la salida productiva."));
    if (headers.length===FIELDS.length && headers.some((h,i)=>h!==FIELDS[i])) findings.push(makeFinding(0,"ESTRUCTURA",headers.join(" | "),FIELDS.join(" | "),"NORMALIZACIÓN DE FORMATO","ALTA","Los 35 campos existen pero no están en el orden productivo."));

    const normalized = rows.map((row,idx) => {
      const out = {};
      FIELDS.forEach(field => out[field] = cleanCell(row[field],field,idx+2,findings));
      return out;
    });

    normalized.forEach((row,idx) => {
      const r = idx+2;
      const code = String(row.CODIGO_PRC || "").trim();
      if (code && ((code.match(/\s+/g)||[]).length >= 2 || code.length > 28)) findings.push(makeFinding(r,"CODIGO_PRC",code,"","POSIBLE ERROR","MEDIA","Parece una descripción más que un código identificador; debe verificarse contra la fuente."));
      const pisos = row.PISOS_MAX;
      if (typeof pisos === "number" && !Number.isInteger(pisos)) findings.push(makeFinding(r,"PISOS_MAX",pisos,"","POSIBLE ERROR","ALTA","PISOS_MAX no debería contener decimales; no se trunca sin fuente."));
      if (typeof pisos === "string" && /^\d+[.,]\d+$/.test(pisos)) findings.push(makeFinding(r,"PISOS_MAX",pisos,"","POSIBLE ERROR","ALTA","PISOS_MAX parece decimal; requiere contraste documental."));
      ["CONSTRUCCION","OCUPACION","OCUPACION_SUP","ALTURA_MIN","ALTURA_MAX","AREA_LIBRE_MIN"].forEach(field => {
        const v = row[field];
        if (typeof v === "number" && v < 0) findings.push(makeFinding(r,field,v,"","POSIBLE ERROR","MEDIA","Valor negativo en campo normativo que normalmente no lo admite."));
        if (typeof v === "string" && /(^|[^A-Z])[OPIl][.,]?\d|\d[.,]?[OIl]($|[^A-Z])/i.test(v)) findings.push(makeFinding(r,field,v,"","POSIBLE ERROR","MEDIA","Patrón compatible con error OCR O/0, P/0 o I/l/1. No se autocorrige sin fuente."));
      });
      const amin = Number(String(row.ALTURA_MIN).replace(",","."));
      const amax = Number(String(row.ALTURA_MAX).replace(",","."));
      if (Number.isFinite(amin) && Number.isFinite(amax) && amin > amax) findings.push(makeFinding(r,"ALTURA_MIN / ALTURA_MAX",`${row.ALTURA_MIN} > ${row.ALTURA_MAX}`,"","ERROR CONFIRMADO","ALTA","ALTURA_MIN es mayor que ALTURA_MAX."));
      if (/AISLADO|PAREADO|CONTINUO/i.test(String(row.AREA_LIBRE_MIN||""))) findings.push(makeFinding(r,"AREA_LIBRE_MIN",row.AREA_LIBRE_MIN,"","POSIBLE ERROR","MEDIA","Contenido compatible con AGRUPAMIENTO; posible desplazamiento de columnas."));
      if (/AISLADO|PAREADO|CONTINUO/i.test(String(row.RASANTE||""))) findings.push(makeFinding(r,"RASANTE",row.RASANTE,"","POSIBLE ERROR","MEDIA","Contenido incompatible con rasante; posible desplazamiento de columnas."));
    });

    const seen = new Map();
    normalized.forEach((row,idx)=>{
      const sig = JSON.stringify(FIELDS.map(f=>row[f]));
      if (seen.has(sig)) findings.push(makeFinding(idx+2,"FILA",`Duplicada con fila ${seen.get(sig)}`,"","ERROR CONFIRMADO","ALTA","Registro completamente duplicado."));
      else seen.set(sig,idx+2);
    });

    const critical = findings.filter(f=>f.type==="ERROR CONFIRMADO").length;
    const warnings = findings.filter(f=>f.type==="POSIBLE ERROR").length;
    const auto = findings.filter(f=>f.type==="NORMALIZACIÓN DE FORMATO").length;
    return {headers,rows:normalized,findings,critical,warnings,auto,missing,extras};
  }

  async function auditFile(file,item) {
    if (!file) return;
    const ok = await ensureXlsx();
    if (!ok) { alert("No se pudo cargar el lector de Excel. Puedes intentar con CSV o revisar la conexión."); return; }
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data,{type:"array"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:true});
      const headers = (matrix[0]||[]).map(x=>String(x).trim());
      const objects = matrix.slice(1).filter(r=>r.some(v=>String(v).trim()!=="")).map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i]??""])));
      const result = analyzeRows(headers,objects);
      state.current = {key:item.key,fileName:file.name,...result};
      state.audits[item.key] = {
        ...(state.audits[item.key]||{}),
        lastAudit:new Date().toLocaleDateString("es-CL"),
        fileName:file.name,
        critical:result.critical,
        warnings:result.warnings,
        auto:result.auto,
        rows:result.rows.length,
        approvals:state.audits[item.key]?.approvals || {sources:false,zones:false,codes:false}
      };
      saveLocal(); renderMetrics(); renderTable(); renderAuditPreview(item);
    } catch (error) { console.error(error); alert("No se pudo leer el archivo seleccionado."); }
  }

  function renderAuditPreview(item) {
    const box = document.getElementById("tnAuditPreview");
    const cur = state.current;
    if (!box || !cur || cur.key!==item.key) return;
    box.innerHTML = `
      <div class="tn-summary-grid"><div><span>Filas</span><strong>${cur.rows.length}</strong></div><div><span>Errores confirmados</span><strong>${cur.critical}</strong></div><div><span>Posibles errores</span><strong>${cur.warnings}</strong></div><div><span>Correcciones de formato</span><strong>${cur.auto}</strong></div></div>
      <div class="tn-actions"><button class="primary" id="tnOpenAudit" type="button">Ver hallazgos</button><button id="tnExportTable" type="button">Descargar tabla normalizada</button><button id="tnExportQa" type="button">Descargar QA</button></div>`;
    document.getElementById("tnOpenAudit").onclick = () => { document.querySelector('[data-tn-tab="auditoria"]').click(); };
    document.getElementById("tnExportTable").onclick = () => exportNormalized(item,cur);
    document.getElementById("tnExportQa").onclick = () => exportQa(item,cur);
  }

  function renderAuditTab(box,item) {
    const cur = state.current?.key===item.key ? state.current : null;
    if (!cur) { box.innerHTML = '<div class="tn-note">Carga primero una tabla desde la pestaña Resumen para ejecutar la auditoría de contenido.</div>'; return; }
    box.innerHTML = `<div class="tn-findings"><table><thead><tr><th>Fila</th><th>Campo</th><th>Original</th><th>Propuesto</th><th>Hallazgo</th><th>Confianza</th><th>Motivo</th></tr></thead><tbody>${cur.findings.map(f=>`<tr><td>${f.row||"—"}</td><td>${esc(f.field)}</td><td>${esc(f.original)}</td><td>${esc(f.proposed)}</td><td>${esc(f.type)}</td><td>${esc(f.confidence)}</td><td>${esc(f.reason)}</td></tr>`).join("") || '<tr><td colspan="7">Sin hallazgos automáticos.</td></tr>'}</tbody></table></div>`;
  }

  function renderStagingTab(box,item) {
    const local = state.audits[item.key] || {};
    const a = local.approvals || {sources:false,zones:false,codes:false};
    const checks = [
      ["Tiene auditoría de tabla",Boolean(local.lastAudit),false],
      ["Tiene 35 campos / estructura controlada",Boolean(local.lastAudit) && Number(local.critical||0)===0,false],
      ["Sin errores críticos pendientes",Boolean(local.lastAudit) && Number(local.critical||0)===0,false],
      ["Fuentes normativas contrastadas",Boolean(a.sources),"sources"],
      ["Zonas validadas contra instrumento",Boolean(a.zones),"zones"],
      ["CODIGO_PRC validado",Boolean(a.codes),"codes"]
    ];
    const ready = checks.every(x=>x[1]);
    box.innerHTML = `<div class="tn-note">Las tres validaciones documentales son aprobación humana en esta versión. La siguiente fase las conectará al catálogo de fuentes e instrumentos.</div><div class="tn-checks" style="margin-top:14px">${checks.map(([label,ok,key])=>`<div class="tn-check"><label>${key?`<input type="checkbox" data-tn-approval="${key}" ${ok?"checked":""}>`:""}<span>${esc(label)}</span></label><span class="tn-pill ${ok?"ok":"warn"}">${ok?"OK":"PENDIENTE"}</span></div>`).join("")}</div><div class="tn-actions"><button class="primary" ${ready?"":"disabled"} type="button">${ready?"LISTA PARA STAGING":"NO LISTA PARA STAGING"}</button></div>`;
    box.querySelectorAll("[data-tn-approval]").forEach(input => input.addEventListener("change", () => {
      const rec = state.audits[item.key] || {};
      rec.approvals = rec.approvals || {};
      rec.approvals[input.dataset.tnApproval] = input.checked;
      state.audits[item.key] = rec; saveLocal(); renderMetrics(); renderTable(); renderStagingTab(box,universe().find(x=>x.key===item.key));
    }));
  }

  function exportNormalized(item,cur) {
    const ws = XLSX.utils.json_to_sheet(cur.rows,{header:FIELDS});
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"TABLA_NORMALIZADA");
    const name = `PRC_${item.comuna.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9]+/g,"_").toUpperCase()}_NORMALIZADO.xlsx`;
    XLSX.writeFile(wb,name);
  }

  function exportQa(item,cur) {
    const qa = cur.findings.map(f=>({COMUNA:item.comuna,FILA:f.row,CAMPO:f.field,VALOR_ORIGINAL:f.original,VALOR_PROPUESTO:f.proposed,HALLAZGO:f.type,CONFIANZA:f.confidence,MOTIVO:f.reason}));
    const ws = XLSX.utils.json_to_sheet(qa); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"QA");
    XLSX.writeFile(wb,`QA_PRC_${item.comuna.replace(/[^A-Za-z0-9]+/g,"_")}.xlsx`);
  }

  function renderAll() { populateRegions(); renderMetrics(); renderTable(); if (state.selectedKey) openDetail(state.selectedKey); }

  function init() {
    loadLocal(); injectStyles(); addNavAndSection(); populateRegions(); renderAll();
    if (location.hash === "#tablas-normativas") activateModule();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
