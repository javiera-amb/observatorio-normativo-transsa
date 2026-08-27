window.COBERTURA_CAPAS_COMUNAL = {
  corte: "2026-08-11",
  criterio: "La cobertura solo se confirma mediante intersección geométrica del archivo espacial con el límite comunal. Notion aporta inventario y referencias, no resultados de cobertura.",
  ejecucion: {
    estado: "bloqueada",
    fecha: "2026-08-11",
    comunas_objetivo: 346,
    capas_procesadas: 0,
    motivo: "El límite comunal ya fue recibido y auditado. El barrido externo localizó 13 fuentes recuperables o potencialmente recuperables; aún falta descargarlas, controlar su versión y ejecutar sus intersecciones."
  },
  limite_base: {
    archivo: "Comunas SII-Transsa 2.gpkg",
    capa: "comunas_siitranssa",
    sha256: "dd27030c04285cdbf078c8d1434b79b8a8a55499234a23b6744ecc87c6602089",
    registros_origen: 347,
    geometrias_comunales: 345,
    comunas_objetivo: 346,
    crs: "SIRGAS-Chile 2002",
    ajuste_santiago: "Santiago, Santiago Sur y Santiago Oeste se disuelven como una comuna.",
    sin_geometria: ["Antártica"],
    normalizaciones: ["Paiguano → Paihuano", "Tiltil → Til Til", "Alto Biobío → Alto Bio Bio", "Cholchol → Chol Chol", "Coihaique → Coyhaique"]
  },
  fuentes: {
    "Áreas Protegidas": { estado: "sin_archivo", archivos: [] },
    "Scraping AH": { estado: "no_es_capa", archivos: [] },
    "Base predios": { estado: "sin_archivo", archivos: [] },
    "Sitios Prioritarios": { estado: "referencia_incompleta", archivos: ["Sitios_Prioritarios.shp"], detalle: "Un SHP aislado no acredita un shapefile completo; faltan al menos SHX y DBF." },
    "Establecimientos Educacionales": { estado: "sin_archivo", archivos: [] },
    "Transporte Urbano (RED)": { estado: "referencia_identificada", archivos: ["Trips_Transporte.RED.gpkg", "trips.txt", "stop_times.txt", "routes.txt", "shapes.txt"] },
    "Barrios Transsa": { estado: "referencia_identificada", archivos: ["Barrios-020426_v3.gpkg", "Barrios_Transsa_020426.kml"] },
    "División Político Regional": { estado: "formato_no_espacial", archivos: ["Poligono_regiones.qmd"] },
    "División Político Comunal": { estado: "referencia_identificada", archivos: ["Comunas_SII-Transsa.gpkg", "Comunas_SII-Transsa.kml"], detalle: "La carpeta fuente está enlazada desde Notion a OneDrive/SharePoint." },
    "EOD": { estado: "referencia_identificada", archivos: ["Zonas_EOD.gpkg"] },
    "Caletas Pesqueras": { estado: "sin_archivo", archivos: [] },
    "Embalses": { estado: "referencia_identificada", archivos: ["Embalse_2026.gpkg", "Embalse_kmz.kmz"] },
    "Transporte Urbano": { estado: "referencia_identificada", archivos: ["Red_de_Interconexin_2018.zip", "CICLOVchile_shp.zip", "Base_Paraderos_Junio_2012.rar"] },
    "Censo 2024": { estado: "referencia_identificada", archivos: ["CENSO_2024-MANZANET.gpkg"] },
    "Inmuebles de Conservación Histórica": { estado: "referencia_incompleta", archivos: ["ICH.shp"], detalle: "Un SHP aislado no acredita un shapefile completo." },
    "Unidades Operativas PDI": { estado: "referencia_identificada", archivos: ["Unidades_Operativas_PDI.gpkg"] },
    "Cuerpo de Bomberos": { estado: "referencia_identificada", archivos: ["Cuerpo_de_bomberos.gpkg"] },
    "Cuarteles de Carabineros": { estado: "referencia_identificada", archivos: ["Cuarteles_carabineros.gpkg"] },
    "Juntas Vecinales": { estado: "referencia_identificada", archivos: ["Juntas_vecinales.gpkg"] },
    "Predios SII": { estado: "referencia_identificada", archivos: ["Poligonos_Vitacura.gpkg"] },
    "Campamentos Chile": { estado: "referencia_identificada", archivos: ["Campamentos_2024.gpkg", "CNCTECHO_2024-2025.kmz"] },
    "Zonas de Conservación Histórica": { estado: "sin_archivo", archivos: [] },
    "Plan Regulador Metropolitano de Santiago": { estado: "sin_archivo", archivos: [] },
    "Áreas Homogéneas SII": { estado: "referencia_identificada", archivos: ["AH_08-25.gpkg", "AH_12-24.gpkg"] },
    "Catastro Pre Censal 2024": { estado: "sin_archivo", archivos: [] },
    "Metro de Santiago": { estado: "referencia_identificada", archivos: ["Estaciones_Metro_2026.gpkg", "Trazado_Metro_2026.gpkg", "Anillo_300_mts.gpkg"] },
    "Sectores Oficinas": { estado: "referencia_identificada", archivos: ["Sectores_Oficinas.gpkg"] },
    "Antenas de Servicios Ley de Torres": { estado: "sin_archivo", archivos: [] },
    "Infraestructura Deportiva": { estado: "sin_archivo", archivos: [] },
    "Red Vial": { estado: "sin_archivo", archivos: [] },
    "Áreas Pobladas": { estado: "sin_archivo", archivos: [] },
    "Amenaza de Tsunami": { estado: "sin_archivo", archivos: [] },
    "Amenaza de Volcanes": { estado: "sin_archivo", archivos: [] }
  },
  capas: {
    "Áreas Protegidas": {
      modo: "nacional_declarada",
      fecha_dato: "2025-01",
      fecha_etiqueta: "Revisión de la fuente",
      detalle: "Inventario referencial del Sistema Nacional de Áreas Protegidas. La presencia de elementos por comuna requiere cruce espacial."
    },
    "Campamentos Chile": {
      modo: "nacional_declarada",
      fecha_dato: "2024-2025",
      fecha_etiqueta: "Catastro TECHO",
      detalle: "Catastro Nacional de Campamentos. Cobertura nacional declarada; falta contar elementos por comuna."
    },
    "Censo 2024": {
      modo: "nacional_declarada",
      fecha_dato: "2024",
      fecha_etiqueta: "Año censal",
      detalle: "Archivo de manzanas y entidades del Censo 2024."
    },
    "Catastro Pre Censal 2024": {
      modo: "nacional_declarada",
      fecha_dato: "2024",
      fecha_etiqueta: "Año del catastro",
      detalle: "Cobertura nacional declarada por el nombre de la fuente; falta verificar el archivo por comuna."
    },
    "División Político Comunal": {
      modo: "nacional_declarada",
      fecha_dato: "2026",
      fecha_etiqueta: "Versión Transsa",
      detalle: "Límites comunales nacionales con códigos SII y sectores Transsa."
    },
    "División Político Regional": {
      modo: "nacional_declarada",
      fecha_dato: "2026.1",
      fecha_etiqueta: "Versión de catálogo",
      detalle: "División regional nacional; el archivo adjunto debe normalizarse a un formato espacial consumible."
    },
    "Establecimientos Educacionales": {
      modo: "nacional_declarada",
      fecha_dato: "2026",
      fecha_etiqueta: "Versión declarada",
      detalle: "La ficha identifica un compilado nacional; falta recuperar el archivo y contar establecimientos por comuna."
    },
    "Planes Reguladores Comunales": {
      modo: "comunas_versionadas",
      fecha_dato: "2026-07-02",
      fecha_etiqueta: "Último archivo adjunto",
      detalle: "Cobertura del consolidado vectorial Transsa. No equivale al estado de auditoría del PRC comunal.",
      versiones: [
        { version: "1.1", fecha: "2026-01-30", comunas: ["La Reina","Puerto Varas","Providencia","Iquique","Ñuñoa","Chillán","Las Condes","Vitacura","Lo Barnechea","La Cisterna","Puente Alto","Maipú","Independencia"] },
        { version: "1.2", fecha: "2026-02-27", comunas: ["Pudahuel","Renca","Quinta Normal","La Serena","Macul","San Miguel","La Florida"] },
        { version: "1.3", fecha: "2026-03-24", comunas: ["Colina","Estación Central","Huechuraba","Melipilla","Puerto Montt","Recoleta","San Joaquín","Santiago","Talca","Viña del Mar"] },
        { version: "2.0", fecha: "2026-04-27", fecha_archivo: "2026-05-05", comunas: ["Concepción","San Pedro de la Paz","Hualpén","Chiguayante","Puerto Octay","Frutillar","Osorno","Rancagua","Coquimbo","Chillán Viejo","Temuco","Peñalolén","Coyhaique"] },
        { version: "2.1", fecha: "Por confirmar", fecha_archivo: "2026-07-02", observacion: "La ficha muestra 2027-07-02; posible error de digitación.", comunas: ["Valdivia"] }
      ]
    },
    "Áreas Homogéneas SII": {
      modo: "regiones_y_comunas",
      fecha_dato: "2025-08",
      fecha_etiqueta: "Último archivo AH",
      regiones: ["Metropolitana de Santiago","Valparaíso"],
      comunas: ["Punta Arenas","Alto Hospicio","Iquique","Osorno","Temuco"],
      detalle: "RM y Región de Valparaíso corresponden a referencia 2022; además se declaran cinco comunas específicas."
    },
    "Metro de Santiago": {
      modo: "region_exclusiva_por_confirmar",
      fecha_dato: "2026-02-24",
      fecha_etiqueta: "Fecha de archivos KML",
      regiones: ["Metropolitana de Santiago"],
      detalle: "Estaciones, trazados y anillos de 300 m. Dentro de la RM falta intersectar los archivos para confirmar cada comuna."
    },
    "Plan Regulador Metropolitano de Santiago": {
      modo: "region_exclusiva_por_confirmar",
      fecha_dato: "Sin fecha de archivo",
      fecha_etiqueta: "Fecha del dato",
      regiones: ["Metropolitana de Santiago"],
      detalle: "La aplicabilidad normativa se muestra en el bloque IPT. Aquí falta acreditar la cobertura del archivo vectorial."
    },
    "Predios SII": {
      modo: "comunas_declaradas",
      fecha_dato: "2026.1",
      fecha_etiqueta: "Versión de catálogo",
      comunas: ["Vitacura"],
      detalle: "La única cobertura explícita recuperada desde la ficha corresponde al archivo Poligonos_Vitacura.gpkg."
    },
    "Barrios Transsa": {
      modo: "por_confirmar",
      fecha_dato: "2026-04-02",
      fecha_etiqueta: "Última versión adjunta",
      detalle: "La ficha contiene varias versiones nacionales y RM; falta cruzar el GeoPackage vigente por comuna."
    },
    "Embalses": {
      modo: "por_confirmar",
      fecha_dato: "2026",
      fecha_etiqueta: "Nombre del archivo",
      detalle: "Existe Embalse_2026.gpkg, pero la ficha no enumera cobertura comunal."
    },
    "EOD": {
      modo: "por_confirmar",
      fecha_dato: "2025.2",
      fecha_etiqueta: "Versión",
      detalle: "Existe Zonas_EOD.gpkg; falta determinar comunas mediante cruce espacial."
    },
    "Juntas Vecinales": {
      modo: "por_confirmar",
      fecha_dato: "2024",
      fecha_etiqueta: "Año declarado",
      detalle: "La ficha declara juntas vecinales 2024 con información comunal Transsa."
    },
    "Transporte Urbano ": {
      modo: "por_confirmar",
      fecha_dato: "2012 / 2018",
      fecha_etiqueta: "Fechas visibles en archivos",
      detalle: "Mezcla paraderos 2012, redes 2018 y ciclovías sin una versión consolidada."
    },
    "Transporte Urbano": {
      modo: "por_confirmar",
      fecha_dato: "2012 / 2018",
      fecha_etiqueta: "Fechas visibles en archivos",
      detalle: "Mezcla paraderos 2012, redes 2018 y ciclovías sin una versión consolidada."
    },
    "Transporte Urbano (RED)": {
      modo: "region_exclusiva_por_confirmar",
      fecha_dato: "2026.1",
      fecha_etiqueta: "Versión de catálogo",
      regiones: ["Metropolitana de Santiago"],
      detalle: "Hay archivos GTFS y Trips_Transporte.RED.gpkg; falta confirmar su fecha efectiva y comunas cubiertas."
    },
    "Scraping AH": {
      modo: "proceso",
      fecha_dato: "Referencia 2022",
      fecha_etiqueta: "Fuente del proceso",
      detalle: "Es un procedimiento de extracción, no una capa lista para consumo comunal."
    }
  }
};
