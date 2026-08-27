window.INVENTARIO_PRI_PRM_ONEDRIVE = {
  schema_version: 1,
  generado_en: "2026-08-26",
  raiz: "00_IPT_Nacional",
  criterio: "Inventario de evidencia física PRI/PRM. No define por sí solo responsable ni QA. Un cierre *_ACTUALIZADO.gpkg sí puede activar el estado Actualizado del instrumento.",
  fuentes: [
    {
      id: "antofagasta|pri",
      region: "Antofagasta",
      tipo: "PRI",
      carpeta: "00_IPT_Nacional/IPT_Antofagasta/PRI",
      evidencia: "IPT_02_PRI_CosteroAntofagasta.shp",
      clasificacion: "instrumento_identificable"
    },
    {
      id: "metropolitana|prms",
      region: "Metropolitana",
      tipo: "PRMS",
      carpeta: "00_IPT_Nacional/IPT_Metropolitana/PRMS",
      evidencia: "Múltiples capas fuente del PRMS, entre ellas IPT_13_PRMS_LU.shp y capas de resguardo",
      clasificacion: "instrumento_multicapa"
    }
  ],
  instrumentos: [
    {
      id: "antofagasta|pri|costero-antofagasta",
      region: "Antofagasta",
      tipo: "PRI",
      nombre_detectado: "PRI Costero Antofagasta",
      archivo_seleccionado: "IPT_02_PRI_CosteroAntofagasta.shp",
      ruta_relativa: "00_IPT_Nacional/IPT_Antofagasta/PRI/IPT_02_PRI_CosteroAntofagasta.shp",
      estado_detectado: "pendiente",
      fecha_archivo: "2026-07-28"
    },
    {
      id: "metropolitana|prms|santiago",
      region: "Metropolitana",
      tipo: "PRMS",
      nombre_detectado: "Plan Regulador Metropolitano de Santiago",
      archivo_seleccionado: "Carpeta PRMS · múltiples capas fuente",
      ruta_relativa: "00_IPT_Nacional/IPT_Metropolitana/PRMS",
      estado_detectado: "pendiente",
      fecha_archivo: "2026-07-29"
    }
  ]
};
