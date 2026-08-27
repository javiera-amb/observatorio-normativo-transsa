// Registro de fuentes externas al inventario del Portal IPT.
// La ausencia de una fuente en este archivo significa "búsqueda pendiente",
// nunca que la fuente o el documento no exista.
window.FUENTES_MULTIFUENTE_IPT = window.FUENTES_MULTIFUENTE_IPT || {
  version: "1.1",
  fecha_actualizacion: "2026-08-27",
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
    },
    "metropolitana__penalolen": {
      fecha_revision: "2026-08-27",
      estado_busqueda: "fuentes_principales_identificadas_catalogo_en_construccion",
      fuentes_normativas: [
        {
          id: "pen-muni-prc-vigente",
          institucion: "Municipalidad de Peñalolén",
          nombre: "Plan Regulador Comunal vigente",
          tipo: "Expediente municipal",
          formato: "HTML y documentos descargables",
          version_instrumento: "PRC vigente iniciado por DS 55/1989 y modificaciones",
          estado: "oficial_vigente",
          uso: "Acceso municipal al plano actualizado, ordenanza, memoria, modificaciones y detalle de zonificación.",
          url: "https://www.penalolen.cl/prc/"
        },
        {
          id: "pen-bcn-ds55-consolidado",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "DS N° 55 MINVU - PRC Peñalolén consolidado",
          tipo: "Acto normativo consolidado",
          formato: "HTML",
          version_instrumento: "PRC base 1989 con notas de modificaciones posteriores",
          estado: "oficial_vigente_con_modificaciones",
          uso: "Fuente principal para establecer instrumento base, vigencia e historial normativo.",
          url: "https://www.bcn.cl/leychile/navegar?i=144349"
        },
        {
          id: "pen-bcn-res77-1992",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Resolución N° 77 - modificación PRC Peñalolén",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 1992-02-11",
          estado: "incorporada_al_prc_vigente",
          uso: "Modifica parámetros de R1, R2, EQ, SM1 y Z1 y aspectos viales.",
          url: "https://www.bcn.cl/leychile/navegar?i=96190&f=1992-02-11"
        },
        {
          id: "pen-bcn-cousino-2002",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 2100/1250 - Parque Cousiño Macul",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2002-04-18",
          estado: "incorporada_al_prc_vigente",
          uso: "Usos, edificación, vialidad, densidades y zonas Z-E y ZHM del sector.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=196949"
        },
        {
          id: "pen-bcn-ds129-2004",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "DS N° 129 MINVU",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2004-11-03",
          estado: "incorporada_al_prc_vigente",
          uso: "En polígono Tobalaba / El Valle sustituye la normativa Zona AR por Zona R-2.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=232103"
        },
        {
          id: "pen-bcn-antupiren-2005",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 2100/1689 - Antupirén Alto",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2005-05-31",
          estado: "incorporada_al_prc_vigente",
          uso: "Modificación y ampliación de límite urbano, usos, edificación, vialidad y densidades.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=238368"
        },
        {
          id: "pen-bcn-parque-2005",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 2100/5247 - Parque Comunal",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2005-11-26",
          estado: "incorporada_al_prc_vigente",
          uso: "Incorpora Zona PE y su normativa en el sector José Arrieta / Sánchez Fontecilla.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=244334"
        },
        {
          id: "pen-bcn-perdices-2007",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 2800/3041 - Av. Las Perdices",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2007-06-01",
          estado: "incorporada_al_prc_vigente",
          uso: "Modifica condiciones y usos de suelo del sector Av. Las Perdices (Antupirén - Los Presidentes).",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=261377"
        },
        {
          id: "pen-bcn-penalolen-nuevo-2017",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 1200/3504 - Peñalolén Nuevo",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2017-08-25",
          estado: "vigente_en_ambito",
          uso: "Incorpora áreas PRMS al área urbana comunal y reemplaza nomenclatura por R4, R11, EQ-2, EQ-3, EQ-4 y EQ-5 dentro de los polígonos de la modificación.",
          url: "https://www.bcn.cl/leychile/navegar?i=1106909"
        },
        {
          id: "pen-bcn-3867-2018",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 1200/3867 - deja sin efecto Decreto 1200/3326",
          tipo: "Acto de vigencia",
          formato: "HTML",
          version_instrumento: "Publicada 2018-08-28",
          estado: "oficial_vigente",
          uso: "Evita aplicar como vigente la modificación de 2016 en los cinco sectores originales.",
          url: "https://www.bcn.cl/leychile/navegar?i=1122371"
        },
        {
          id: "pen-bcn-4405-2018",
          institucion: "Biblioteca del Congreso Nacional",
          nombre: "Decreto 1200/4405 - modificación parcial cuatro sectores",
          tipo: "Modificación PRC",
          formato: "HTML",
          version_instrumento: "Publicada 2018-09-28",
          estado: "vigente_en_ambito",
          uso: "Reconoce sólo Las Perdices, Oriental, Cancha Tres y El Sauzal; excluye Antupirén. Introduce R2 actualizada, EQ-1 y R10 según sector.",
          url: "https://www.bcn.cl/leychile/navegar?idNorma=1123459"
        },
        {
          id: "pen-bcn-prms",
          institucion: "Biblioteca del Congreso Nacional / GORE RM",
          nombre: "PRMS - Resolución N° 20",
          tipo: "Instrumento intercomunal",
          formato: "HTML",
          version_instrumento: "PRMS vigente con modificaciones",
          estado: "oficial_vigente",
          uso: "Fuente para categorías y parámetros metropolitanos aplicables/supletorios, incluyendo arts. 5.2.2, 5.2.3.3, 5.2.4.1 y 8.2.1.4.",
          url: "https://www.bcn.cl/leychile/navegar?i=1011608"
        }
      ],
      fuentes_cartograficas: [
        {
          id: "pen-muni-prc-planos",
          institucion: "Municipalidad de Peñalolén",
          nombre: "Plano actualizado y detalle de zonificación PRC vigente",
          tipo: "Planos normativos / geoportal",
          formato: "Documentos y visor municipal",
          version_instrumento: "PRC vigente",
          estado: "geometria_normativa_oficial_a_contrastar",
          uso: "Determinar ámbito espacial de las modificaciones y resolver equivalencias que no pueden aplicarse globalmente.",
          url: "https://www.penalolen.cl/prc/en-que-consiste-la-actualizacion-al-prc/"
        }
      ]
    }
  }
};
