(() => {
  "use strict";

  // Configuración pública del módulo. No contiene credenciales ni resultados internos de auditoría.
  window.TABLAS_NORMATIVAS_SHAREPOINT = {
    origen: "SharePoint · sitio DEI",
    canal_oficial: "Sistema Operativo DEI",
    fecha_snapshot: "2026-08-31",
    ruta_base: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas",
    ruta_maestro: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas/01_TABLAS_CANONICAS/PRC_SQL2.xlsx",
    ruta_salida_normalizadas: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas/NORMALIZADAS",
    carpeta_entrada: "01_TABLAS_CANONICAS",
    carpeta_salida_normalizadas: "NORMALIZADAS",
    folder_ids: {
      entrada: "01MVUN5G6SI25ZNVSJHFEKZCC5RRLCHV7V",
      normalizadas: "01MVUN5G2INU4K3ZGVNNAZMLOPVE44YSU2"
    },
    maestro_vigente: "PRC_SQL2.xlsx",
    maestro_url: "https://transsa.sharepoint.com/sites/DEI/_layouts/15/Doc.aspx?sourcedoc=%7B365AFC22-6068-47D1-9F67-5191178769ED%7D&file=PRC_SQL2.xlsx&action=default&mobileredirect=true",
    politica_maestro: "PRC_SQL2.xlsx es la base tabular vigente; la normativa oficial determina la validez de cada valor.",
    campos_productivos: 35,
    automatizacion: {
      motor: "Python local",
      frecuencia_minutos: 15,
      estado: "Programador de tareas de Windows",
      publica_solo_validas: true
    },
    vinculo: {
      campo: "CODIGO_PRC",
      relacion: "muchos polígonos ↔ CODIGO_PRC ↔ una o varias filas normativas",
      variantes_por_codigo: true,
      conteo_poligonos_puede_diferir_de_filas: true,
      alias_solo_para_vinculo: true,
      alias_no_modifica_codigo_productivo: true
    },
    invariantes: {
      conservar_cantidad_y_orden_filas_normativas: true,
      preservar_codigo_prc_por_defecto: true,
      no_fusionar_variantes: true,
      no_eliminar_duplicados_automaticamente: true,
      salida_exacta_35_campos: true
    },
    // Inventario histórico usado para saber qué comunas están presentes en el maestro.
    archivos: [
      "PRC_CHIGUAYANTE_35_CAMPOS.csv","PRC_CHILLAN_35_CAMPOS.csv","PRC_CHILLAN_VIEJO_35_CAMPOS.csv",
      "PRC_COLINA_35_CAMPOS.csv","PRC_CONCEPCIÓN_35_CAMPOS.csv","PRC_COQUIMBO_35_CAMPOS.csv",
      "PRC_COYHAIQUE_35_CAMPOS.csv","PRC_ESTACION_CENTRAL_35_CAMPOS.csv","PRC_FRUTILLAR_35_CAMPOS.csv",
      "PRC_HUECHURABA_35_CAMPOS.csv","PRC_INDEPENDENCIA_35_CAMPOS.csv","PRC_IQUIQUE_35_CAMPOS.csv",
      "PRC_LA_CISTERNA_35_CAMPOS.csv","PRC_LA_FLORIDA_35_CAMPOS.csv","PRC_LA_REINA_35_CAMPOS.csv",
      "PRC_LA_SERENA_35_CAMPOS.csv","PRC_LAS_CONDES_35_CAMPOS.csv","PRC_LO_BARNECHEA_35_CAMPOS.csv",
      "PRC_MACHALÍ_35_CAMPOS.csv","PRC_MACUL_35_CAMPOS.csv","PRC_MAIPU_35_CAMPOS.csv","PRC_MELIPILLA_35_CAMPOS.csv",
      "PRC_ÑUÑOA_35_CAMPOS.csv","PRC_OSORNO_35_CAMPOS.csv","PRC_PEÑALOLEN_35_CAMPOS.csv",
      "PRC_PROVIDENCIA_35_CAMPOS.csv","PRC_PUDAHUEL_35_CAMPOS.csv","PRC_PUENTE_ALTO_35_CAMPOS.csv",
      "PRC_PUERTO_MONTT_35_CAMPOS.csv","PRC_PUERTO_OCTAY_35_CAMPOS.csv","PRC_PUNTA_ARENAS_35_CAMPOS.csv",
      "PRC_QUILPUE_35_CAMPOS.csv","PRC_QUINTA_NORMAL_35_CAMPOS.csv","PRC_RANCAGUA_35_CAMPOS.csv",
      "PRC_RECOLETA_35_CAMPOS.csv","PRC_RENCA_35_CAMPOS.csv","PRC_SAN_JOAQUIN_35_CAMPOS.csv",
      "PRC_SAN_MIGUEL_35_CAMPOS.csv","PRC_SAN_PEDRO_DE_LA_PAZ_35_CAMPOS.csv","PRC_SANTIAGO_35_CAMPOS.csv",
      "PRC_TALCA_35_CAMPOS.csv","PRC_TEMUCO_35_CAMPOS.csv","PRC_VALDIVIA_35_CAMPOS.csv",
      "PRC_VINA_DEL_MAR_35_CAMPOS.csv","PRC_VITACURA_35_CAMPOS.csv"
    ]
  };

  const cfg = window.TABLAS_NORMATIVAS_SHAREPOINT;
  let scheduled = false;

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function trackingFor(comuna) {
    const items = Array.isArray(window.SEGUIMIENTO_NORMATIVO?.comunas)
      ? window.SEGUIMIENTO_NORMATIVO.comunas : [];
    return items.find(item => normalize(item.comuna) === normalize(comuna)) || null;
  }

  function sourceBundleFor(comuna) {
    const registry = window.FUENTES_MULTIFUENTE_IPT?.por_comuna || {};
    const wanted = normalize(comuna).replace(/ /g, "_");
    return Object.entries(registry).find(([key]) => key.endsWith(`__${wanted}`))?.[1] || null;
  }

  function hasBaseTable(comuna) {
    const wanted = normalize(comuna);
    return (cfg.archivos || []).some(name => {
      const cleaned = String(name).replace(/^PRC_/i, "").replace(/_35_CAMPOS\.(csv|xlsx|xls)$/i, "").replace(/_/g, " ");
      return normalize(cleaned) === wanted;
    });
  }

  function pill(label, state = "inventory") {
    return `<span class="tn-pill ${state}">${label}</span>`;
  }

  function formatDate(value) {
    if (!value) return "—";
    const parts = String(value).split("-");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  }

  function patchStatusLabels(section) {
    section.querySelectorAll(".tn-pill").forEach(node => {
      if (node.textContent.trim() === "TABLA GENERADA") node.textContent = "TABLA BASE DETECTADA";
    });
    const option = [...section.querySelectorAll("#tnStatus option")]
      .find(node => node.textContent.trim() === "TABLA GENERADA");
    if (option) option.textContent = "TABLA BASE DETECTADA"; // conserva value para compatibilidad interna
  }

  function automaticSummary(detail) {
    const comuna = detail.querySelector(".tn-detail-head h3")?.textContent?.trim() || "";
    if (!comuna) return;
    const tracking = trackingFor(comuna);
    const baseTable = hasBaseTable(comuna);
    const bundle = sourceBundleFor(comuna);
    const richSources = (bundle?.fuentes_normativas?.length || 0) + (bundle?.fuentes_cartograficas?.length || 0);

    const manualBox = [...detail.querySelectorAll(".tn-folder-box")]
      .find(node => /Auditar tabla de/i.test(node.textContent || ""));
    if (manualBox) {
      const container = manualBox.closest(".tn-folder");
      if (container && !container.dataset.automaticSummary) {
        container.dataset.automaticSummary = "1";
        container.innerHTML = `
          <div class="tn-folder-box">
            <strong>Detección automática</strong>
            <p class="tn-subtle">No tienes que subir ningún archivo. El motor toma el PRC trabajado y la hoja de ${cfg.maestro_vigente} correspondiente a la comuna.</p>
            <div class="tn-summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:0">
              <div><span>PRC detectado</span><strong>${tracking?.prc_nombre ? "SÍ" : "POR RESOLVER"}</strong></div>
              <div><span>Tabla base</span><strong>${baseTable ? "DETECTADA" : "NO DETECTADA"}</strong></div>
              <div><span>PRC base</span><strong>${tracking?.prc_fecha ? formatDate(tracking.prc_fecha) : "—"}</strong></div>
              <div><span>Actos posteriores detectados</span><strong>${Number(tracking?.actos_posteriores || 0)}</strong></div>
            </div>
            <div class="tn-actions"><a class="primary" href="${cfg.maestro_url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;text-decoration:none">Abrir maestro en SharePoint</a></div>
          </div>
          <div class="tn-note">
            <strong>Vigencia automática</strong><br>
            ${tracking ? `${tracking.estado_fuente || "Estado por verificar"}. Último acto posterior: ${formatDate(tracking.ultimo_acto_posterior)}.` : "Todavía no existe seguimiento normativo consolidado para esta comuna."}
            ${richSources ? `<br>Fuentes oficiales detalladas registradas: <strong>${richSources}</strong>.` : "<br>El inventario detallado de fuentes todavía se está completando; esto no significa que los documentos no existan."}
          </div>`;
      }
    }
  }

  function patchStaging(detail) {
    const box = detail.querySelector("#tnTabContent");
    if (!box || !/Tiene auditoría de tabla|Fuentes normativas contrastadas/i.test(box.textContent || "")) return;
    const comuna = detail.querySelector(".tn-detail-head h3")?.textContent?.trim() || "";
    if (!comuna || box.dataset.automaticStaging) return;

    const tracking = trackingFor(comuna);
    const baseTable = hasBaseTable(comuna);
    const bundle = sourceBundleFor(comuna);
    const sourceCount = (bundle?.fuentes_normativas?.length || 0) + (bundle?.fuentes_cartograficas?.length || 0);
    const acts = Number(tracking?.actos_posteriores || 0);

    box.dataset.automaticStaging = "1";
    box.innerHTML = `
      <div class="tn-note"><strong>Control de staging automático.</strong> No tienes que marcar casillas. Cada control cambia cuando el motor aporta evidencia; la intervención humana queda reservada para conflictos normativos reales.</div>
      <div class="tn-checks" style="margin-top:14px">
        <div class="tn-check"><span>PRC vigente identificado</span>${tracking?.prc_nombre ? pill("DETECTADO", "ok") : pill("POR RESOLVER")}</div>
        <div class="tn-check"><span>Tabla base en ${cfg.maestro_vigente}</span>${baseTable ? pill("DETECTADA", "ok") : pill("NO DETECTADA", "warn")}</div>
        <div class="tn-check"><span>Actos posteriores</span>${acts ? pill(`${acts} DETECTADOS`, "audit") : pill("SIN ACTOS POSTERIORES", "ok")}</div>
        <div class="tn-check"><span>Fuentes oficiales detalladas</span>${sourceCount ? pill(`${sourceCount} REGISTRADAS`, "ok") : pill("LEVANTAMIENTO AUTOMÁTICO", "audit")}</div>
        <div class="tn-check"><span>Vínculo PRC ↔ CODIGO_PRC ↔ variantes</span>${pill("CONTROL MOTOR", "audit")}</div>
        <div class="tn-check"><span>35 campos productivos y QA</span>${pill("CONTROL MOTOR", "audit")}</div>
        <div class="tn-check"><span>Tabla final en NORMALIZADAS</span>${pill("SÓLO AL VALIDAR", "inventory")}</div>
      </div>
      <div class="tn-source-rule" style="margin-top:14px"><strong>Estado de vigencia:</strong> ${tracking?.estado_fuente || "Por verificar"}${tracking?.ultimo_acto_posterior ? ` · último acto detectado ${formatDate(tracking.ultimo_acto_posterior)}` : ""}.</div>`;
  }

  function patchDetail(section) {
    const detail = section.querySelector("#tnDetail");
    if (!detail || detail.hidden) return;
    patchStatusLabels(section);
    automaticSummary(detail);
    patchStaging(detail);
  }

  function refreshOfficialRouteUi() {
    const section = document.getElementById("module-tablas-normativas");
    if (!section) return false;

    const header = section.querySelector(".module-header");
    if (header) {
      setText(header.querySelector("h2"), "Auditoría y producción automática de tablas normativas");
      setText(header.querySelector("h2 + p"), "El PRC trabajado se vincula con la tabla normativa mediante CODIGO_PRC. Un código puede tener varias filas válidas cuando representan variantes normativas.");
    }

    const banner = section.querySelector(".tn-banner");
    if (banner) {
      banner.innerHTML = `<strong>Canal oficial:</strong> ${cfg.canal_oficial} · <strong>Maestro:</strong> ${cfg.maestro_vigente} · <strong>Vínculo:</strong> CODIGO_PRC · <strong>Salida final:</strong> ${cfg.carpeta_salida_normalizadas}. <span style="display:block;margin-top:6px;opacity:.82">El motor revisa cambios cada ${cfg.automatizacion.frecuencia_minutos} minutos. La existencia de una tabla base no significa que esté auditada: sólo se publica cuando pasan vínculo, fuentes oficiales y QA.</span>`;
    }

    // El selector de archivos era parte del prototipo. Se elimina del flujo normal.
    const topDiagnostic = section.querySelector(".tn-folder")?.closest(".tn-panel");
    if (topDiagnostic && !topDiagnostic.dataset.hiddenLegacyUpload) {
      topDiagnostic.dataset.hiddenLegacyUpload = "1";
      topDiagnostic.hidden = true;
    }

    const metricLabels = section.querySelectorAll(".tn-kpi span");
    const labels = ["Comunas universo TUI","Con tabla en maestro","Revisadas","Con observaciones","Listas staging"];
    metricLabels.forEach((node, index) => { if (labels[index]) node.textContent = labels[index]; });

    const tableHeaders = section.querySelectorAll(".tn-table thead th");
    if (tableHeaders[1]) tableHeaders[1].textContent = "Tabla base";
    if (tableHeaders[2]) tableHeaders[2].textContent = "Fuentes / vigencia";
    if (tableHeaders[3]) tableHeaders[3].textContent = "Auditoría";

    patchStatusLabels(section);
    patchDetail(section);
    return true;
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refreshOfficialRouteUi();
    });
  }

  scheduleRefresh();
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
