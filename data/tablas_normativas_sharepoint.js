(() => {
  "use strict";

  // Snapshot operativo del inventario canónico alojado en SharePoint DEI.
  // Sólo publica estructura lógica y nombres de archivo; no contiene credenciales.
  window.TABLAS_NORMATIVAS_SHAREPOINT = {
    origen: "SharePoint · sitio DEI",
    canal_oficial: "Sistema Operativo DEI",
    fecha_snapshot: "2026-08-31",
    ruta_base: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas",
    ruta_entrada: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas/01_TABLAS_CANONICAS",
    ruta_salida_normalizadas: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas/02_TABLAS_NORMALIZADAS",
    ruta_salida_qa: "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas/03_QA_TRAZABILIDAD",
    carpeta_entrada: "01_TABLAS_CANONICAS",
    carpeta_salida_normalizadas: "02_TABLAS_NORMALIZADAS",
    carpeta_salida_qa: "03_QA_TRAZABILIDAD",
    folder_ids: {
      entrada: "01MVUN5G6SI25ZNVSJHFEKZCC5RRLCHV7V",
      normalizadas: "01MVUN5GZHXKN3J24ST5ELWUBRPL7B5J3C",
      qa: "01MVUN5G7RKMMB3BDRPFF33VE65664L43T"
    },
    maestro_vigente: "PRC_SQL2.xlsx",
    politica_maestro: "PRC_SQL2.xlsx es la base tabular vigente; la normativa oficial determina la validez de cada valor.",
    campos_productivos: 35,
    invariantes: {
      una_fila_por_poligono: true,
      conservar_cantidad_y_orden_filas: true,
      preservar_codigo_prc_por_defecto: true
    },
    archivos: [
      "PRC_CHIGUAYANTE_35_CAMPOS.csv",
      "PRC_CHILLAN_35_CAMPOS.csv",
      "PRC_CHILLAN_VIEJO_35_CAMPOS.csv",
      "PRC_COLINA_35_CAMPOS.csv",
      "PRC_CONCEPCIÓN_35_CAMPOS.csv",
      "PRC_COQUIMBO_35_CAMPOS.csv",
      "PRC_COYHAIQUE_35_CAMPOS.csv",
      "PRC_ESTACION_CENTRAL_35_CAMPOS.csv",
      "PRC_FRUTILLAR_35_CAMPOS.csv",
      "PRC_HUECHURABA_35_CAMPOS.csv",
      "PRC_INDEPENDENCIA_35_CAMPOS.csv",
      "PRC_IQUIQUE_35_CAMPOS.csv",
      "PRC_LA_CISTERNA_35_CAMPOS.csv",
      "PRC_LA_FLORIDA_35_CAMPOS.csv",
      "PRC_LA_REINA_35_CAMPOS.csv",
      "PRC_LA_SERENA_35_CAMPOS.csv",
      "PRC_LAS_CONDES_35_CAMPOS.csv",
      "PRC_LO_BARNECHEA_35_CAMPOS.csv",
      "PRC_MACHALÍ_35_CAMPOS.csv",
      "PRC_MACUL_35_CAMPOS.csv",
      "PRC_MAIPU_35_CAMPOS.csv",
      "PRC_MELIPILLA_35_CAMPOS.csv",
      "PRC_ÑUÑOA_35_CAMPOS.csv",
      "PRC_OSORNO_35_CAMPOS.csv",
      "PRC_PEÑALOLEN_35_CAMPOS.csv",
      "PRC_PROVIDENCIA_35_CAMPOS.csv",
      "PRC_PUDAHUEL_35_CAMPOS.csv",
      "PRC_PUENTE_ALTO_35_CAMPOS.csv",
      "PRC_PUERTO_MONTT_35_CAMPOS.csv",
      "PRC_PUERTO_OCTAY_35_CAMPOS.csv",
      "PRC_PUNTA_ARENAS_35_CAMPOS.csv",
      "PRC_QUILPUE_35_CAMPOS.csv",
      "PRC_QUINTA_NORMAL_35_CAMPOS.csv",
      "PRC_RANCAGUA_35_CAMPOS.csv",
      "PRC_RECOLETA_35_CAMPOS.csv",
      "PRC_RENCA_35_CAMPOS.csv",
      "PRC_SAN_JOAQUIN_35_CAMPOS.csv",
      "PRC_SAN_MIGUEL_35_CAMPOS.csv",
      "PRC_SAN_PEDRO_DE_LA_PAZ_35_CAMPOS.csv",
      "PRC_SANTIAGO_35_CAMPOS.csv",
      "PRC_TALCA_35_CAMPOS.csv",
      "PRC_TEMUCO_35_CAMPOS.csv",
      "PRC_VALDIVIA_35_CAMPOS.csv",
      "PRC_VINA_DEL_MAR_35_CAMPOS.csv",
      "PRC_VITACURA_35_CAMPOS.csv"
    ]
  };
})();
