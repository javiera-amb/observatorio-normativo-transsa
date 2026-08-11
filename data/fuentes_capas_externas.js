window.FUENTES_CAPAS_EXTERNAS = {
  corte: "2026-08-11",
  criterio: "Una fuente localizada no equivale a una capa descargada, cruzada ni validada. Se priorizan servicios GIS y descargas oficiales; las fuentes abiertas no estatales se usan como complemento y nunca reemplazan cartografía normativa.",
  estados: {
    localizada: "Fuente localizada",
    localizada_observada: "Fuente localizada con observaciones",
    descentralizada: "Búsqueda descentralizada",
    interna: "Requiere fuente interna",
  },
  capas: {
    "Áreas Protegidas": {
      estado: "localizada", nivel: "oficial", organismo: "SBAP / MMA · SIMBIO", acceso: "Geoportal / servicios interoperables", automatizable: true,
      url: "https://simbio.mma.gob.cl/", fecha_fuente: "2026",
      nota: "Desde el 2 de febrero de 2026 el SBAP es responsable de los datos oficiales de biodiversidad. La capa debe descargarse desde su fuente vigente; el servicio SMA sirve como contraste, no como maestro."
    },
    "Base predios": {
      estado: "interna", nivel: "transsa", organismo: "Transsa / SII", acceso: "GeoPackage o Parquet interno", automatizable: true,
      nota: "No existe una descarga pública nacional equivalente a la base predial consolidada. Debe usarse el pipeline interno de predios, conservando fecha y origen por comuna."
    },
    "Sitios Prioritarios": {
      estado: "localizada", nivel: "oficial", organismo: "Ministerio del Medio Ambiente", acceso: "Shapefile descargable", automatizable: true,
      url: "https://geoportal.cl/geoportal/catalog/35909/Sitios%20prioritarios", fecha_fuente: "2021-03-11",
      nota: "La descarga oficial reemplaza el SHP aislado registrado en Notion, que no constituye un shapefile completo."
    },
    "Establecimientos Educacionales": {
      estado: "localizada", nivel: "oficial", organismo: "Centro de Estudios MINEDUC", acceso: "Directorio anual con coordenadas", automatizable: true,
      url: "https://centroestudios.mineduc.cl/datos-abiertos/", fecha_fuente: "2025",
      nota: "Usar el directorio oficial más reciente y convertir las coordenadas a una capa de puntos. El visor IDE 2021 queda solo como respaldo histórico."
    },
    "Caletas Pesqueras": {
      estado: "localizada", nivel: "oficial", organismo: "SUBPESCA", acceso: "Shapefile ArcGIS", automatizable: true,
      url: "https://geoportal.subpesca.cl/portal/home/item.html?id=f79a3c71062a49ffa346fca2d7b239f9", fecha_fuente: "2020-09-01",
      nota: "Cobertura nacional de puntos. Antes de publicar debe revisarse si existe una edición posterior en el Geoportal SUBPESCA."
    },
    "Censo 2024": {
      estado: "localizada", nivel: "oficial", organismo: "INE", acceso: "Geodatabase / Shapefile / visualizadores", automatizable: true,
      url: "https://www.ine.gob.cl/herramientas/portal-de-mapas/geodatos-abiertos", fecha_fuente: "2025-03-27",
      nota: "Usar cartografía oficial de manzanas y entidades del Censo 2024, no una copia sin trazabilidad."
    },
    "Inmuebles de Conservación Histórica": {
      estado: "descentralizada", nivel: "normativa", organismo: "Municipalidades / MINVU", acceso: "PRC, planos y ordenanzas por comuna", automatizable: false,
      url: "https://ide.minvu.cl/pages/descargas",
      nota: "No usar una capa nacional genérica como verdad normativa. Cada ICH debe vincularse al PRC vigente, sus modificaciones y la fuente municipal oficial."
    },
    "Zonas de Conservación Histórica": {
      estado: "descentralizada", nivel: "normativa", organismo: "Municipalidades / MINVU", acceso: "PRC, planos y ordenanzas por comuna", automatizable: false,
      url: "https://ide.minvu.cl/pages/descargas",
      nota: "El servicio SMA puede ayudar a detectar ZCH, pero su edición 2019 no acredita vigencia. La validación final se hace contra cada IPT vigente."
    },
    "Plan Regulador Metropolitano de Santiago": {
      estado: "localizada", nivel: "oficial_referencial", organismo: "MINVU", acceso: "ArcGIS FeatureServer", automatizable: true,
      url: "https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer", fecha_fuente: "2022-12-14",
      nota: "Servicio consultable y exportable con siete capas. MINVU lo declara referencial; debe compararse con actos y planos oficiales antes del QA normativo."
    },
    "Catastro Pre Censal 2024": {
      estado: "localizada_observada", nivel: "oficial", organismo: "INE", acceso: "Geodatos y cartografía Censo 2024", automatizable: true,
      url: "https://www.ine.gob.cl/herramientas/portal-de-mapas/geodatos-abiertos", fecha_fuente: "2024",
      nota: "Debe confirmarse qué producto interno se llamó 'Catastro Pre Censal' y si corresponde reemplazarlo por la cartografía definitiva del Censo 2024."
    },
    "Antenas de Servicios Ley de Torres": {
      estado: "localizada", nivel: "oficial", organismo: "SUBTEL", acceso: "Visor y exportación tabular con coordenadas", automatizable: true,
      url: "https://antenas.subtel.gob.cl/leydetorres/mapaAntenasEnServicio.html", fecha_fuente: "consulta vigente",
      nota: "La tabla oficial contiene latitud y longitud. Conviene capturar antenas en servicio y autorizadas como capas separadas."
    },
    "Infraestructura Deportiva": {
      estado: "localizada_observada", nivel: "oficial", organismo: "IND / IDE Chile", acceso: "Catálogo espacial y directorio IND", automatizable: false,
      url: "https://geoportal.cl/geoportal/catalog/35034/Infraestructura%20Deportiva", fecha_fuente: "2014-03-21",
      nota: "La capa espacial encontrada es antigua. Debe contrastarse con el directorio vigente del IND antes de usarla como cobertura actual."
    },
    "Red Vial": {
      estado: "localizada", nivel: "oficial", organismo: "Dirección de Vialidad MOP", acceso: "Descarga / servicios GeoMOP", automatizable: true,
      url: "https://geoportal.cl/geoportal/catalog/36785/Red%20Vial%20Nacional", fecha_fuente: "catálogo vigente",
      nota: "Fuente maestra para caminos MOP. OpenStreetMap puede complementar calles urbanas y conectividad, manteniendo ambas procedencias separadas."
    },
    "Áreas Pobladas": {
      estado: "localizada", nivel: "oficial", organismo: "INE", acceso: "Cartografía de ciudades, pueblos, aldeas y entidades", automatizable: true,
      url: "https://www.ine.gob.cl/herramientas/portal-de-mapas/geodatos-abiertos", fecha_fuente: "Censo 2024",
      nota: "Usar entidades y áreas pobladas de la cartografía censal vigente; la capa BCN sirve solo como respaldo histórico."
    },
    "Amenaza de Tsunami": {
      estado: "localizada", nivel: "oficial", organismo: "SENAPRED / SHOA", acceso: "Geoportal y planos de evacuación", automatizable: true,
      url: "https://geoportal.cl/geoportal/catalog/35413/Amenaza%20por%20Tsunami", fecha_fuente: "2024-05-01",
      nota: "Incluye áreas y límites de evacuación, vías, puntos de encuentro y cota 30 m. Las CITSU SHOA deben mantenerse como evidencia oficial complementaria."
    },
    "Amenaza de Volcanes": {
      estado: "localizada_observada", nivel: "oficial", organismo: "SERNAGEOMIN / SENAPRED", acceso: "Visores y mapas de peligro por volcán", automatizable: false,
      url: "https://www.sernageomin.cl/visores-mineros/", fecha_fuente: "consulta vigente",
      nota: "No se encontró una única capa nacional homogénea y actual. Deben inventariarse mapas por volcán, fecha y escala antes de consolidar."
    }
  },
  adicionales: [
    { nombre: "Establecimientos de salud", categoria: "Infraestructura", prioridad: "alta", nivel: "oficial", fuente: "MINSAL / DEIS", cobertura: "Nacional", actualizacion: "2026-06-12", automatizable: true, url: "https://www.minsal.cl/ide-minsal-geoportal-descarga-de-datos/", valor: "Equipamiento de salud vigente y abierto." },
    { nombre: "Humedales urbanos declarados", categoria: "Normativa ambiental", prioridad: "alta", nivel: "oficial", fuente: "MMA", cobertura: "Nacional", actualizacion: "2025-03-06", automatizable: true, url: "https://lineasdebasepublicas.mma.gob.cl/datos_abiertos/dataset/humedales-nacional", valor: "Restricciones y sensibilidad ambiental para evaluación territorial." },
    { nombre: "Monumentos nacionales y zonas típicas", categoria: "Patrimonio", prioridad: "alta", nivel: "oficial", fuente: "CMN / Servicio del Patrimonio", cobertura: "Nacional", actualizacion: "Mensual", automatizable: true, url: "https://ide.patrimoniocultural.gob.cl/", valor: "Polígonos oficiales de protección patrimonial." },
    { nombre: "Red ferroviaria", categoria: "Infraestructura", prioridad: "alta", nivel: "mixta", fuente: "EFE / BCN / OpenStreetMap", cobertura: "Nacional", actualizacion: "Según fuente", automatizable: true, url: "https://www.bcn.cl/siit/mapas_vectoriales/index_html", valor: "Trazados ferroviarios; separar red física de fajas normativas." },
    { nombre: "Fajas de afectación ferroviaria", categoria: "Normativa", prioridad: "alta", nivel: "normativa", fuente: "IPT / EFE / actos oficiales", cobertura: "Por territorio", actualizacion: "Según acto", automatizable: false, url: "https://ide.minvu.cl/pages/descargas", valor: "Afectación predial; no se puede inferir aplicando un buffer genérico a la vía." },
    { nombre: "Aeropuertos y aeródromos", categoria: "Infraestructura", prioridad: "media", nivel: "oficial", fuente: "DGAC / IDE Chile", cobertura: "Nacional", actualizacion: "Por verificar", automatizable: true, url: "https://www.bcn.cl/siit/mapas_vectoriales/index_html", valor: "Accesibilidad, actividad y restricciones aeroportuarias." },
    { nombre: "POI y equipamientos", categoria: "Actividad urbana", prioridad: "alta", nivel: "complementaria", fuente: "OpenStreetMap / Geofabrik", cobertura: "Nacional", actualizacion: "Diaria", automatizable: true, url: "https://download.geofabrik.de/south-america/chile.html", valor: "Comercio, servicios y equipamientos; requiere QA de completitud." },
    { nombre: "Edificaciones", categoria: "Morfología urbana", prioridad: "media", nivel: "complementaria", fuente: "Overture Maps", cobertura: "Nacional", actualizacion: "Por versión", automatizable: true, url: "https://docs.overturemaps.org/getting-data/", valor: "Huellas de edificios descargables por área de interés." },
    { nombre: "Cobertura de suelo", categoria: "Medio ambiente", prioridad: "media", nivel: "internacional", fuente: "ESA WorldCover", cobertura: "Nacional", actualizacion: "2021", automatizable: true, url: "https://esa-worldcover.org/en", valor: "Cobertura de suelo raster a 10 m; útil como contexto, no como norma." },
    { nombre: "Población en grilla", categoria: "Demografía", prioridad: "baja", nivel: "internacional", fuente: "WorldPop", cobertura: "Nacional", actualizacion: "Según producto", automatizable: true, url: "https://www.worldpop.org/", valor: "Estimación espacial complementaria al Censo; no reemplaza datos INE." }
  ]
};
