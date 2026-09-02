(() => {
  "use strict";

  window.FUENTES_MULTIFUENTE_IPT = window.FUENTES_MULTIFUENTE_IPT || {
    version: "1.2",
    fecha_actualizacion: "2026-09-02",
    criterio: {},
    por_comuna: {}
  };
  window.FUENTES_MULTIFUENTE_IPT.por_comuna = window.FUENTES_MULTIFUENTE_IPT.por_comuna || {};

  window.FUENTES_MULTIFUENTE_IPT.por_comuna.biobio__chiguayante = {
    fecha_revision: "2026-09-02",
    estado_busqueda: "fuentes_oficiales_identificadas_auditoria_en_curso",
    fuentes_normativas: [
      {
        id: "chiguayante-prc-base-bcn",
        institucion: "Biblioteca del Congreso Nacional",
        nombre: "Plan Regulador Comunal de Chiguayante · Decreto Alcaldicio N.º 637 de 2003",
        tipo: "PRC base / texto legal",
        formato: "LeyChile",
        version_instrumento: "PRC base con modificaciones posteriores",
        estado: "oficial_vigente_con_modificaciones",
        uso: "Fuente legal base para reconstruir la normativa vigente y su historial de modificaciones.",
        url: "https://www.bcn.cl/leychile/navegar?i=212051"
      },
      {
        id: "chiguayante-enmienda-898-2024",
        institucion: "Municipalidad de Chiguayante / BCN",
        nombre: "Decreto Alcaldicio N.º 898 · Enmienda al PRC",
        tipo: "Enmienda PRC",
        formato: "LeyChile",
        version_instrumento: "Publicado 09-05-2024",
        estado: "oficial_vigente_en_ambito",
        uso: "Modifica parámetros de la zona ZR1 y otras disposiciones del PRC. Debe contrastarse con la tabla normativa por zona y uso.",
        url: "https://www.bcn.cl/leychile/navegar?idNorma=1203429"
      },
      {
        id: "chiguayante-decreto-1033-2024",
        institucion: "Municipalidad de Chiguayante / BCN",
        nombre: "Decreto Alcaldicio N.º 1033 · complemento de la Enmienda 2024",
        tipo: "Complemento de Enmienda",
        formato: "LeyChile",
        version_instrumento: "Promulgado 20-05-2024 · publicado 29-05-2024",
        estado: "oficial_vigente_en_ambito",
        uso: "Complementa el Decreto N.º 898. Su contenido debe incluirse en la auditoría vigente de Chiguayante y en la trazabilidad de la tabla.",
        url: "https://www.bcn.cl/leychile/navegar?idNorma=1203864"
      },
      {
        id: "chiguayante-ordenanza-refundida-2024",
        institucion: "Municipalidad de Chiguayante",
        nombre: "Ordenanza Local · texto refundido 2024",
        tipo: "Ordenanza refundida",
        formato: "PDF",
        version_instrumento: "Refundido 2024",
        estado: "fuente_documental_prioritaria",
        uso: "Fuente consolidada para contrastar usos, subzonas y parámetros normativos vigentes por zona.",
        url: "https://www.chiguayante.cl/attachments/article/69/ordenanza_refundido2024.pdf"
      }
    ],
    fuentes_cartograficas: [
      {
        id: "chiguayante-minvu-geoide-prc",
        institucion: "MINVU GeoIDE",
        nombre: "PRC Biobío · Chiguayante",
        tipo: "Cartografía oficial de referencia",
        formato: "ArcGIS FeatureServer",
        version_instrumento: "PRC Chiguayante · capa oficial disponible",
        estado: "geometria_normativa_oficial_a_contrastar",
        uso: "Contraste espacial de zonas, subzonas y ámbitos creados o modificados por actos posteriores.",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Biobio/FeatureServer/9"
      }
    ]
  };
})();
