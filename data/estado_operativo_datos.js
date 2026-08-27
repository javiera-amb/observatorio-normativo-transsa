window.ESTADO_OPERATIVO_DATOS = {
  corte: "2026-08-24",
  destino_publicacion: "Transsa / Propiteq",
  criterio: "El estado operativo vigente se toma desde Avance_Bases_de_datos.xlsx en SharePoint, salvo una regla automática: si TUI detecta un archivo cuyo nombre termina en _ACTUALIZADO.gpkg, esa evidencia cambia inmediatamente el estado visible de la comuna a Actualizado.",
  valores_permitidos: {
    estado_produccion: ["pendiente", "en_desarrollo", "actualizado", "enviado"],
    qa_plataforma: ["pendiente", "observaciones", "aprobado"],
    qa_revision_javiera: ["pendiente", "observaciones", "aprobado"],
    etapa_interna: ["levantamiento", "comparacion", "actualizacion_sig", "qa", "publicacion"],
    prioridad: ["critica", "alta", "media", "baja"]
  },
  equipo: [
    { nombre: "Cristóbal", rol: "Producción SIG" },
    { nombre: "Annabel", rol: "Producción SIG" },
    { nombre: "Fernanda", rol: "Producción SIG" },
    { nombre: "Javiera", rol: "Administración y QA" }
  ],
  almacenamiento: {
    archivos_sig: "SharePoint / OneDrive Transsa",
    matriz_avance: "Avance_Bases_de_datos.xlsx",
    inventario_publicado: "data/inventario_prc_onedrive.js",
    estados_compartidos: "Git / datos versionados de la plataforma",
    nota: "La web publica rutas relativas, estados y resultados de QA; nunca la ruta C: del usuario."
  },
  criterio_produccion_directa: "El PRC/IPT se procesa en un CRS proyectado adecuado, se corrigen geometrías, los seccionales reemplazan la normativa PRC anterior donde corresponda y luego se construye el overlay de normativas aplicables (riesgo, ZNE, edificación u otras). El cierre vuelve a EPSG:4326 y genera NOMBREIPT_ACTUALIZADO.gpkg. La aparición de ese archivo cambia automáticamente el estado a Actualizado; Enviado corresponde al traspaso posterior a Propiteq.",
  criterio_archivo_tui: "El archivo final detectable por TUI termina exactamente en _ACTUALIZADO.gpkg. Su sola detección activa el estado Actualizado; el QA se muestra de forma separada y no bloquea ese cambio de estado.",
  comunas: {},
  capas: {}
};

// Regla automática PRC: *_ACTUALIZADO.gpkg => Actualizado.
(() => {
  const inventarioRaiz = window.INVENTARIO_PRC_ONEDRIVE || {};
  const inventario = inventarioRaiz.comunas || {};
  const inicial = window.AVANCE_BASES_DATOS?.comunas || {};
  const equipo = window.ESTADO_EQUIPO_VERSIONADO?.comunas || {};
  const operativo = window.ESTADO_OPERATIVO_DATOS.comunas;

  const normalizar = valor => String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const buscarClaveCanonica = claveInventario => {
    if (inicial[claveInventario] || equipo[claveInventario]) return claveInventario;
    const comunaInventario = normalizar(String(claveInventario).split("|").at(-1));
    const candidatas = [...new Set([...Object.keys(inicial), ...Object.keys(equipo)])];
    return candidatas.find(clave => normalizar(clave.split("|").at(-1)) === comunaInventario) || claveInventario;
  };

  Object.entries(inventario).forEach(([claveInventario, registro]) => {
    const nombre = String(registro?.archivo_seleccionado || registro?.ruta_relativa || "");
    if (!/_ACTUALIZADO\.gpkg$/i.test(nombre)) return;

    registro.estado_detectado = "actualizado";
    registro.modelo_detectado = "tui_v2";
    registro.qa_archivo = registro.qa_archivo || {};
    registro.qa_archivo.estandar_tui_v2 = {
      ...(registro.qa_archivo.estandar_tui_v2 || {}),
      modelo_detectado: "tui_v2",
      cumple_estructura: true,
      bloqueos: [],
      activacion_estado: "nombre_archivo_actualizado",
      nota_estado: "El estado Actualizado se activa por la convención _ACTUALIZADO.gpkg; el QA geométrico sigue siendo un control independiente."
    };

    const clave = buscarClaveCanonica(claveInventario);
    const fecha = String(registro?.modificado_en || inventarioRaiz?.generado_en || "").slice(0, 10);
    operativo[clave] = {
      ...(operativo[clave] || {}),
      estado_produccion: "actualizado",
      ...(fecha ? { fecha_estado: fecha } : {}),
      ...(registro?.ruta_relativa ? { evidencia: registro.ruta_relativa } : {}),
      modelo_prc: "tui_v2",
      fuente_estado: "archivo_actualizado_automatico",
      nota: `Estado automático: se detectó ${nombre}.`
    };
  });
})();

const definicionActualizado = document.querySelector(".seguimiento-interpretation .ready p");
if (definicionActualizado) {
  definicionActualizado.textContent = "Actualizado se activa automáticamente cuando TUI detecta el archivo final _ACTUALIZADO.gpkg. El QA técnico se informa por separado.";
}

// Seguimiento IPT: PRC y PRI/PRM se administran como productos independientes.
(() => {
  const modulo = document.getElementById("module-seguimiento");
  if (!modulo) return;

  const nav = document.querySelector('[data-module="seguimiento"]');
  if (nav) nav.textContent = "Seguimiento IPT";
  const eyebrow = modulo.querySelector(".seguimiento-header .eyebrow");
  const titulo = modulo.querySelector(".seguimiento-header h2");
  if (eyebrow) eyebrow.textContent = "SEGUIMIENTO IPT";
  if (titulo) titulo.textContent = "PRC y PRI/PRM: estado, responsables y QA";

  const estilo = document.createElement("style");
  estilo.textContent = `
    .ipt-scope-switch{display:flex;gap:8px;margin:0 0 18px;align-items:center}
    .ipt-scope-switch button{border:1px solid #d8dce8;background:#fff;border-radius:999px;padding:9px 16px;font:inherit;cursor:pointer}
    .ipt-scope-switch button.active{background:#17176b;color:#fff;border-color:#17176b}
    #module-seguimiento.modo-pri #seguimientoExternalView,#module-seguimiento.modo-pri #seguimientoInternalView{display:none!important}
    #module-seguimiento.modo-pri .seguimiento-view-switch,#module-seguimiento.modo-pri #seguimientoDownloadCsv{display:none!important}
    .pri-prm-intro,.pri-prm-rule{background:#f6f7fb;border:1px solid #e3e6ef;border-radius:16px;padding:20px;margin-bottom:18px}
    .pri-prm-intro h3,.pri-prm-rule h3{margin:4px 0 8px}
    .pri-prm-intro p,.pri-prm-rule p{margin:0;line-height:1.55;color:#505465}
    .pri-prm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
    .pri-prm-kpis article{background:#fff;border:1px solid #e3e6ef;border-radius:14px;padding:16px}
    .pri-prm-kpis span,.pri-prm-kpis small{display:block;color:#6a6e7d}
    .pri-prm-kpis strong{display:block;font-size:28px;margin:4px 0}
    .pri-prm-controls{display:grid;grid-template-columns:2fr 1fr;gap:12px;margin:0 0 14px}
    .pri-prm-controls label{display:grid;gap:6px}.pri-prm-controls input,.pri-prm-controls select{padding:10px 12px;border:1px solid #d8dce8;border-radius:10px;background:#fff}
    .pri-prm-table-wrap{overflow:auto;border:1px solid #e3e6ef;border-radius:14px;background:#fff;margin-bottom:18px}
    .pri-prm-table{width:100%;border-collapse:collapse;min-width:980px}.pri-prm-table th,.pri-prm-table td{padding:12px 14px;border-bottom:1px solid #eceef4;text-align:left;vertical-align:top}
    .pri-prm-table th{font-size:12px;color:#666b7a;background:#f8f9fc;text-transform:uppercase;letter-spacing:.03em}
    .pri-status{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:600;background:#eef0f6}.pri-status.actualizado{background:#e4f4e9}.pri-status.en_desarrollo{background:#fff2d8}.pri-status.enviado{background:#e7e8fb}.pri-status.pendiente{background:#f0f1f4}
    .pri-prm-products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.pri-prm-products div{background:#fff;border:1px solid #e3e6ef;border-radius:12px;padding:14px}.pri-prm-products strong,.pri-prm-products span{display:block}.pri-prm-products span{margin-top:5px;color:#666b7a;font-size:13px}
    .pri-prm-empty{padding:30px;text-align:center;color:#6a6e7d}
    @media(max-width:900px){.pri-prm-kpis,.pri-prm-products{grid-template-columns:1fr 1fr}.pri-prm-controls{grid-template-columns:1fr}}
  `;
  document.head.appendChild(estilo);

  const header = modulo.querySelector(".seguimiento-header");
  const selector = document.createElement("div");
  selector.className = "ipt-scope-switch";
  selector.setAttribute("role", "tablist");
  selector.innerHTML = '<button type="button" class="active" data-ipt-scope="prc">PRC</button><button type="button" data-ipt-scope="pri">PRI / PRM</button>';
  header?.insertAdjacentElement("afterend", selector);

  const panel = document.createElement("div");
  panel.id = "seguimientoPriPrmView";
  panel.hidden = true;
  panel.innerHTML = `
    <section class="pri-prm-intro">
      <p class="eyebrow">IPT INTERCOMUNAL / METROPOLITANO</p>
      <h3>PRI y PRM se mantienen independientes del PRC</h3>
      <p>Se construyen, consolidan y validan como instrumentos propios. TUI registra qué comunas y PRC quedan dentro de su ámbito, pero no genera por defecto una geometría PRC+PRI. El cruce espacial queda disponible para análisis específicos.</p>
    </section>
    <section class="pri-prm-kpis" aria-label="Resumen PRI PRM">
      <article><span>Pendiente</span><strong id="priMetricPending">0</strong><small>Sin iniciar</small></article>
      <article><span>En desarrollo</span><strong id="priMetricDevelopment">0</strong><small>En procesamiento</small></article>
      <article><span>Actualizado</span><strong id="priMetricUpdated">0</strong><small>Producto consolidado</small></article>
      <article><span>Enviado</span><strong id="priMetricSent">0</strong><small>Transferido al visor</small></article>
    </section>
    <section class="pri-prm-controls">
      <label><span>Buscar instrumento</span><input id="priSearch" type="search" placeholder="PRI, PRM, región, ámbito o responsable…"></label>
      <label><span>Estado</span><select id="priStatus"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="en_desarrollo">En desarrollo</option><option value="actualizado">Actualizado</option><option value="enviado">Enviado</option></select></label>
    </section>
    <section class="pri-prm-table-wrap">
      <table class="pri-prm-table">
        <thead><tr><th>Instrumento</th><th>Región / ámbito</th><th>Comunas relacionadas</th><th>Estado</th><th>Responsable</th><th>Cartografía</th><th>QA</th><th>Última actualización</th></tr></thead>
        <tbody id="priTableBody"></tbody>
      </table>
      <div id="priEmpty" class="pri-prm-empty">Aún no hay PRI/PRM cargados en el seguimiento operativo.</div>
    </section>
    <section class="pri-prm-rule">
      <p class="eyebrow">REGLA DE PRODUCTO</p>
      <h3>Separar para mantener trazabilidad</h3>
      <p>El producto base no mezcla PRI/PRM con PRC. La relación entre ambos se conserva explícita y el cruce se hace solo cuando una herramienta o análisis lo requiera.</p>
      <div class="pri-prm-products">
        <div><strong>PRC</strong><span>PRC consolidado + tabla normativa PRC</span></div>
        <div><strong>PRI / PRM</strong><span>PRI/PRM consolidado + tabla normativa propia</span></div>
        <div><strong>Análisis</strong><span>Cruce PRC ↔ PRI/PRM solo para consultas específicas</span></div>
      </div>
    </section>`;
  selector.insertAdjacentElement("afterend", panel);

  const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const labels = {pendiente:"Pendiente",en_desarrollo:"En desarrollo",actualizado:"Actualizado",enviado:"Enviado"};

  const render = () => {
    const datos = window.ESTADO_PRI_PRM || {instrumentos:[]};
    const instrumentos = Array.isArray(datos.instrumentos) ? datos.instrumentos : [];
    const buscar = String(document.getElementById("priSearch")?.value || "").toLowerCase();
    const estado = document.getElementById("priStatus")?.value || "";
    const filtrados = instrumentos.filter(item => {
      const texto = [item.nombre,item.sigla,item.tipo,item.region,item.ambito,item.responsable,...(item.comunas || [])].join(" ").toLowerCase();
      return (!buscar || texto.includes(buscar)) && (!estado || item.estado_produccion === estado);
    });
    const cuenta = valor => instrumentos.filter(item => item.estado_produccion === valor).length;
    [
      ["priMetricPending",cuenta("pendiente")],
      ["priMetricDevelopment",cuenta("en_desarrollo")],
      ["priMetricUpdated",cuenta("actualizado")],
      ["priMetricSent",cuenta("enviado")]
    ].forEach(([id,valor]) => { const el=document.getElementById(id); if(el) el.textContent=valor; });

    const tbody = document.getElementById("priTableBody");
    const empty = document.getElementById("priEmpty");
    if (!tbody || !empty) return;
    tbody.innerHTML = filtrados.map(item => {
      const comunas = Array.isArray(item.comunas) && item.comunas.length ? item.comunas.join(", ") : "—";
      const estadoItem = item.estado_produccion || "pendiente";
      const archivo = item.archivo || item.ruta_relativa || "Sin archivo registrado";
      return `<tr>
        <td><strong>${escapeHtml(item.nombre || item.sigla || "PRI/PRM")}</strong><br><small>${escapeHtml(item.tipo || item.sigla || "")}</small></td>
        <td>${escapeHtml(item.region || "—")}<br><small>${escapeHtml(item.ambito || "")}</small></td>
        <td>${escapeHtml(comunas)}</td>
        <td><span class="pri-status ${escapeHtml(estadoItem)}">${escapeHtml(labels[estadoItem] || estadoItem)}</span></td>
        <td>${escapeHtml(item.responsable || "Sin responsable")}</td>
        <td>${escapeHtml(archivo)}</td>
        <td>${escapeHtml(item.qa || "pendiente")}</td>
        <td>${escapeHtml(item.fecha_estado || item.actualizado_en || "—")}</td>
      </tr>`;
    }).join("");
    empty.hidden = filtrados.length > 0;
  };

  document.getElementById("priSearch")?.addEventListener("input", render);
  document.getElementById("priStatus")?.addEventListener("change", render);

  const admin = modulo.querySelector('.seguimiento-header-actions a[href*="estado_operativo_datos.js"]');
  const adminHref = admin?.getAttribute("href") || "";
  const adminText = admin?.textContent || "Administrar datos ↗";
  const cambiarVista = vista => {
    const pri = vista === "pri";
    modulo.classList.toggle("modo-pri", pri);
    panel.hidden = !pri;
    selector.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn.dataset.iptScope === vista));
    if (admin) {
      admin.href = pri
        ? "https://github.com/javiera-amb/observatorio-normativo-transsa/edit/main/data/estado_pri_prm.js"
        : adminHref;
      admin.textContent = pri ? "Administrar PRI/PRM ↗" : adminText;
    }
    if (pri) render();
  };
  selector.addEventListener("click", event => {
    const boton = event.target.closest("[data-ipt-scope]");
    if (!boton) return;
    cambiarVista(boton.dataset.iptScope);
  });

  const cargarDatos = () => {
    if (window.ESTADO_PRI_PRM) return render();
    const script = document.createElement("script");
    script.src = "data/estado_pri_prm.js?v=20260825-pri-1";
    script.onload = render;
    document.head.appendChild(script);
  };
  cargarDatos();
  if (new URLSearchParams(window.location.search).get("ipt") === "pri") cambiarVista("pri");
})();
