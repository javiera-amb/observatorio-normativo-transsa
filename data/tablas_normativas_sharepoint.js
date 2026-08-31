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
    // Inventario histórico de archivos comunales usado sólo para compatibilidad visual de la TUI.
    // El maestro productivo vigente es PRC_SQL2.xlsx.
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

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function refreshOfficialRouteUi() {
    const section = document.getElementById("module-tablas-normativas");
    if (!section) return false;
    const cfg = window.TABLAS_NORMATIVAS_SHAREPOINT;

    const header = section.querySelector(".module-header");
    if (header) {
      setText(header.querySelector("h2"), "Auditoría y producción automática de tablas normativas");
      setText(
        header.querySelector("h2 + p"),
        "El PRC trabajado se vincula con la tabla normativa mediante CODIGO_PRC. Un código puede tener varias filas válidas cuando representan variantes normativas."
      );
    }

    const banner = section.querySelector(".tn-banner");
    if (banner) {
      banner.innerHTML = `<strong>Canal oficial:</strong> ${cfg.canal_oficial} · <strong>Maestro:</strong> ${cfg.maestro_vigente} · <strong>Vínculo:</strong> CODIGO_PRC · <strong>Salida final:</strong> ${cfg.carpeta_salida_normalizadas}. <span style="display:block;margin-top:6px;opacity:.82">El motor revisa cambios cada ${cfg.automatizacion.frecuencia_minutos} minutos y sólo publica una tabla cuando pasan vínculo, fuentes oficiales y QA. El número de polígonos no tiene que coincidir con el número de filas porque un código puede tener múltiples variantes.</span>`;
    }

    const panel = section.querySelector(".tn-folder")?.closest(".tn-panel");
    const box = section.querySelector(".tn-folder-box");
    if (box) {
      const title = box.querySelector("strong");
      const help = box.querySelector(".tn-subtle");
      if (title) title.textContent = "Diagnóstico manual opcional";
      if (help) help.innerHTML = `No es parte del flujo productivo. Úsalo sólo si necesitas inspeccionar manualmente un archivo durante una revisión. La producción oficial usa <b>${cfg.maestro_vigente}</b> y los GPKG de <b>PRC Trabajado</b>.`;
    }
    if (panel) panel.dataset.optionalDiagnostic = "true";

    const status = section.querySelector("#tnFolderStatus");
    if (status && !status.dataset.officialRouteApplied) {
      status.innerHTML = `<strong>Flujo automático activo.</strong><br>PRC Trabajado + ${cfg.maestro_vigente} → vínculo por CODIGO_PRC → auditoría normativa → ${cfg.carpeta_salida_normalizadas}. La trazabilidad operativa se guarda fuera de SharePoint y las versiones finales usan el historial nativo de SharePoint.`;
      status.dataset.officialRouteApplied = "1";
    }

    const metricLabels = section.querySelectorAll(".tn-kpi span");
    const labels = [
      "Comunas universo TUI",
      "Con tabla en maestro",
      "Revisadas en sesión",
      "Con observaciones",
      "Listas staging"
    ];
    metricLabels.forEach((node, index) => { if (labels[index]) node.textContent = labels[index]; });

    const tableHeaders = section.querySelectorAll(".tn-table thead th");
    if (tableHeaders[1]) tableHeaders[1].textContent = "Tabla / maestro";
    if (tableHeaders[3]) tableHeaders[3].textContent = "Revisión local";

    return true;
  }

  if (!refreshOfficialRouteUi()) {
    const observer = new MutationObserver(() => {
      if (refreshOfficialRouteUi()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
