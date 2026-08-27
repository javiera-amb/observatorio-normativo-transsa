window.INVENTARIO_PRC_ONEDRIVE = {
  "schema_version": 4,
  "generado_en": "2026-08-24T17:50:00-04:00",
  "almacenamiento": "SharePoint / OneDrive Transsa. Inventario parcial de archivos comprobados directamente en la estructura 00_IPT_Nacional.",
  "criterio": "El estado de producción proviene de Avance_Bases_de_datos.xlsx. Este inventario solo aporta evidencia de archivo y QA; no cambia por sí solo el estado del equipo.",
  "resumen": {
    "archivos_comprobados": 6,
    "comunas_con_evidencia": 6,
    "archivos_actualizado": 1,
    "archivos_enviado": 4,
    "archivos_rgc_proceso": 1
  },
  "comunas": {
    "Antofagasta|Calama": {
      "archivo_seleccionado": "IPT_02_PRC_Calama_ACTUALIZADO.gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_Antofagasta/PRC/Calama/IPT_02_PRC_Calama_ACTUALIZADO.gpkg",
      "url_sharepoint": "https://transsa.sharepoint.com/sites/DEI/Documentos%20compartidos/General/Cartograf%C3%ADa%20Transsa_GENERAL/00_IPT_Nacional/IPT_Antofagasta/PRC/Calama/IPT_02_PRC_Calama_ACTUALIZADO.gpkg",
      "estado_detectado": "actualizado",
      "modelo_detectado": "tui_v2",
      "tabla_normativa": null,
      "qa_archivo": {
        "valido": true,
        "capa_principal_detectada": "IPT_02_PRC_Calama_ACTUALIZADO",
        "qa_geometria": {"estado":"ejecutado","valido":true,"total":92,"geometrias_nulas":0,"geometrias_vacias":0,"geometrias_invalidas":0,"crs":"EPSG:4326"},
        "estandar_tui_v2": {"modelo_detectado":"tui_v2","cumple_estructura":true,"bloqueos":[],"control_interseccion_riesgos":"integrado_en_overlay_normativo","regla":"Cierre desde 02_normativa_integrada, corrección STRUCTURE y salida final EPSG:4326."}
      },
      "qa_cierre": "IPT_02_PRC_Calama_ACTUALIZADO_QA.txt",
      "versiones_encontradas": 1
    },
    "Valparaíso|Concón": {
      "archivo_seleccionado": "Concón_5309 (RGC).gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_Valparaiso/PRC/Concon/Concón_5309 (RGC).gpkg",
      "estado_detectado": "en_desarrollo",
      "modelo_detectado": "sin_clasificar",
      "tabla_normativa": null,
      "qa_archivo": {"valido":null,"estado":"evidencia_archivo_sin_cierre"},
      "versiones_encontradas": 1
    },
    "Metropolitana de Santiago|Colina": {
      "archivo_seleccionado": "IPT_00_PRC_COLINA_Enviado.gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_Metropolitana/PRC/Colina/IPT_00_PRC_COLINA_Enviado.gpkg",
      "estado_detectado": "enviado",
      "modelo_detectado": "legado_v1",
      "tabla_normativa": "IPT_00_PRC_COLINA_Enviado.xlsx",
      "qa_archivo": {"valido":null,"estado":"archivo_enviado_historico"},
      "versiones_encontradas": 1
    },
    "Biobío|Concepción": {
      "archivo_seleccionado": "IPT_00_PRC_CONCEPCION_Enviado.gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_BIOBIO/PRC/Concepcion/IPT_00_PRC_CONCEPCION_Enviado.gpkg",
      "estado_detectado": "enviado",
      "modelo_detectado": "legado_v1",
      "tabla_normativa": "IPT_00_PRC_CONCEPCION_Enviado.xlsx",
      "qa_archivo": {"valido":null,"estado":"archivo_enviado_historico"},
      "versiones_encontradas": 1
    },
    "Metropolitana de Santiago|La Florida": {
      "archivo_seleccionado": "IPT_00_PRC_LAFLORIDA_Enviado.gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_Metropolitana/PRC/La Florida/IPT_00_PRC_LAFLORIDA_Enviado.gpkg",
      "estado_detectado": "enviado",
      "modelo_detectado": "legado_v1",
      "tabla_normativa": "IPT_00_PRC_LAFLORIDA_Enviado.xlsx",
      "qa_archivo": {"valido":null,"estado":"archivo_enviado_historico"},
      "versiones_encontradas": 1
    },
    "Metropolitana de Santiago|La Reina": {
      "archivo_seleccionado": "IPT_00_PRC_LAREINA_Enviado.gpkg",
      "ruta_relativa": "00_IPT_Nacional/IPT_Metropolitana/PRC/La Reina/IPT_00_PRC_LAREINA_Enviado.gpkg",
      "estado_detectado": "enviado",
      "modelo_detectado": "legado_v1",
      "tabla_normativa": "IPT_00_PRC_LAREINA_Enviado.xlsx",
      "qa_archivo": {"valido":null,"estado":"archivo_enviado_historico"},
      "versiones_encontradas": 1
    }
  }
};
