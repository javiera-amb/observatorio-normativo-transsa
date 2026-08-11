window.COBERTURA_CAPAS_COMUNAL = {
  corte: "2026-08-11",
  criterio: "Cobertura documental declarada en Notion. No reemplaza el cruce espacial de los archivos.",
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
