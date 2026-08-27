// Registro de fuentes externas al inventario del Portal IPT.
// La ausencia de una fuente en este archivo significa "búsqueda pendiente",
// nunca que la fuente o el documento no exista.
window.FUENTES_MULTIFUENTE_IPT = window.FUENTES_MULTIFUENTE_IPT || {
  version: "1.0",
  fecha_actualizacion: "2026-08-11",
  criterio: {
    prioridad: [
      "Acto y planos oficiales publicados por la municipalidad o el organismo competente",
      "Archivo o servicio SIG municipal asociado inequívocamente al acto vigente",
      "Servicio oficial MINVU, GeoIDE, SEREMI o Gobierno Regional",
      "Otras fuentes oficiales utilizadas como antecedente y sujetas a validación"
    ],
    regla_version: "La fecha de actualización de un archivo o mapa web no acredita por sí sola su vigencia. Debe coincidir el acto, la versión del instrumento, el ámbito, los códigos y la geometría.",
    regla_publicacion: "Una geometría solo se declara vigente cuando fue contrastada con el acto y los planos oficiales aplicables."
  },
  por_comuna: {
    "coquimbo__coquimbo": {
      fecha_revision: "2026-08-11",
      estado_busqueda: "revision_multifuente_iniciada",
      fuentes_normativas: [
        {
          id: "coq-muni-expediente-2026",
          institucion: "Municipalidad de Coquimbo",
          nombre: "Expediente oficial del PRC vigente",
          tipo: "Expediente municipal",
          formato: "HTML y documentos descargables",
          version_instrumento: "PRC vigente desde 2026-01-05",
          estado: "oficial_vigente",
          uso: "Fuente normativa principal y acceso a ordenanza, memoria y planos firmados.",
          url: "https://www.municoquimbo.cl/index.php/plano-regulador-2019"
        },
        {
          id: "coq-muni-ordenanza-2026",
          institucion: "Municipalidad de Coquimbo",
          nombre: "Ordenanza Local PRC Coquimbo 2026",
          tipo: "Ordenanza local",
          formato: "PDF",
          version_instrumento: "Decreto Exento N.º 3.155/2025",
          estado: "oficial_vigente",
          uso: "Validación de códigos, usos y parámetros normativos.",
          url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/03_Ordenanza_Local.pdf"
        },
        {
          id: "coq-bcn-vigencia-2026",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Acto de aprobación del PRC Coquimbo",
          tipo: "Acto normativo",
          formato: "HTML",
          version_instrumento: "Vigente desde 2026-01-05",
          estado: "oficial_vigente",
          uso: "Acreditación de vigencia y reemplazo del instrumento anterior.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
        },
        {
          id: "coq-muni-limite-urbano-2026",
          institucion: "Municipalidad de Coquimbo",
          nombre: "Ord. N.º 122: información del PRC al SII",
          tipo: "Pronunciamiento municipal",
          formato: "PDF",
          version_instrumento: "2026",
          estado: "oficial_vigente",
          uso: "Acredita que la actualización no modifica el límite urbano vigente.",
          url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/oa/08-ORD-N122-07.01.2026-Informa-PRC-al-SII.pdf"
        }
      ],
      fuentes_cartograficas: [
        {
          id: "coq-muni-planos-firmados-2026",
          institucion: "Municipalidad de Coquimbo",
          nombre: "Planos oficiales firmados de zonificación",
          tipo: "Planos normativos",
          formato: "PDF · 13 láminas",
          version_instrumento: "PRC 2026: 9 Coquimbo, 3 Tongoy y 1 Guanaqueros",
          estado: "geometria_normativa_oficial",
          uso: "Patrón oficial para validar, georreferenciar o vectorizar la zonificación.",
          url: "https://www.municoquimbo.cl/index.php/plano-regulador-2019"
        },
        {
          id: "coq-muni-riesgos-2026",
          institucion: "Municipalidad de Coquimbo",
          nombre: "Planos oficiales de riesgo",
          tipo: "Planos temáticos",
          formato: "PDF",
          version_instrumento: "PRC 2026",
          estado: "geometria_normativa_oficial",
          uso: "Validación de áreas de riesgo como capa suplementaria, sin reemplazar automáticamente la zona base.",
          url: "https://www.municoquimbo.cl/index.php/plano-regulador-2019"
        },
        {
          id: "coq-geoide-featureserver",
          institucion: "MINVU · GeoIDE",
          nombre: "PRC Coquimbo FeatureServer",
          tipo: "Servicio vectorial oficial",
          formato: "ArcGIS REST · GeoJSON",
          version_instrumento: "Versión no acreditada",
          estado: "candidata_validacion",
          uso: "Geometría candidata para zonificación, riesgos, ICH y subzonas; debe compararse con las láminas municipales 2026.",
          url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer"
        },
        {
          id: "coq-arcgis-amenaza-2016",
          institucion: "ArcGIS Online · servicio visor IPT amenaza",
          nombre: "PRC Coquimbo 2016",
          tipo: "Servicio vectorial",
          formato: "ArcGIS REST",
          version_instrumento: "2016",
          estado: "descartada_desactualizada",
          uso: "No utilizar como representación del PRC 2026; se conserva para trazabilidad de la auditoría.",
          url: "https://services2.arcgis.com/cRH3tEMPESJz6DMX/arcgis/rest/services/visor_IPT_amenaza/FeatureServer/7"
        }
      ]
    }
  }
};
