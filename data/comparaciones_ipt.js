// Comparaciones documentales y cartográficas entre versiones de un mismo IPT.
// La clave se construye como: "registro_anterior__registro_nuevo".
// Este archivo queda separado de la sincronización oficial para conservar la
// revisión estratégica, las decisiones del equipo y la auditoría SIG.
window.COMPARACIONES_IPT = window.COMPARACIONES_IPT || {
  versiones: {},
  actos_por_comuna: {}
};

window.COMPARACIONES_IPT.versiones["282__322"] = {
  id: "coquimbo-prc-2019-2026",
  region: "Coquimbo",
  comuna: "Coquimbo",
  tipo_ipt: "PRC",
  estado_analisis: "en_revision",
  estado_sig: "pendiente_revision",
  nivel_evidencia: "parcial_oficial",
  instrumento_anterior: {
    registro: 282,
    fecha: "2019-07-10",
    nombre: "Plan Regulador Comunal de Coquimbo (incluye Tongoy y Guanaqueros)",
    acto: "Decreto N.º 1.287 de 2019",
    fuente: "https://www.bcn.cl/leychile/navegar?i=1133660"
  },
  instrumento_nuevo: {
    registro: 322,
    fecha: "2026-01-05",
    nombre: "Plan Regulador Comunal de Coquimbo, incluye localidades de Tongoy y Guanaqueros",
    acto: "Decreto Exento N.º 3.155 de 2025",
    fuente: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
  },
  resumen_estrategico: "Está confirmado el reemplazo del PRC vigente desde 2019 por una nueva actualización que entró en vigencia el 5 de enero de 2026. El punto crítico para el desarrollo urbano es determinar cómo cambian la zonificación, las intensidades de edificación, la vialidad, las áreas de riesgo y la protección patrimonial, y verificar si la Enmienda Ferronor de 2025 fue incorporada o reemplazada por la nueva versión.",
  materias_a_comparar: [
    "Límite urbano y extensión territorial",
    "Zonificación y usos de suelo",
    "Densidad, constructibilidad y ocupación de suelo",
    "Alturas, subdivisión predial y antejardines",
    "Vialidad estructurante y declaratorias de utilidad pública",
    "Áreas de riesgo, protección y espacios públicos",
    "Incorporación de la Enmienda Ferronor"
  ],
  cambios: [
    {
      materia: "Vigencia y reemplazo del marco comunal",
      antes: "PRC promulgado mediante Decreto N.º 1.287, publicado el 10 de julio de 2019.",
      despues: "Actualización promulgada mediante Decreto Exento N.º 3.155/2025, vigente desde el 5 de enero de 2026.",
      impacto: "Los permisos, evaluaciones de cabida y decisiones de inversión posteriores deben revisarse con la versión 2026. La transición no puede tratarse como una modificación menor: corresponde a un nuevo marco normativo comunal.",
      estado_documental: "validado",
      estado_sig: "pendiente_revision",
      fuente: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
    },
    {
      materia: "Enmienda Ferronor durante la transición",
      antes: "Las fajas ferroviarias desafectadas quedaron dentro del límite urbano sin normas urbanísticas específicas equivalentes a su entorno.",
      despues: "La Enmienda N.º 1 asignó normativa ZU3 a las fajas desafectadas para posibilitar el Plan Urbano Habitacional Ferronor, con más de 2.000 viviendas, equipamientos y áreas de parque.",
      impacto: "Constituye una habilitación de suelo urbano de alta relevancia habitacional y de regeneración urbana. Debe comprobarse si la zonificación y los parámetros de esta enmienda están recogidos en el PRC 2026 y en el SIG disponible.",
      estado_documental: "validado",
      estado_sig: "pendiente_revision",
      evidencia: "Diario Oficial CVE-2615636 y expediente EAE F28",
      fuente: "https://eae.mma.gob.cl/file/494"
    },
    {
      materia: "Base gráfica oficial de la versión 2026",
      antes: "El servicio SIG de GeoIDE contiene una interpretación de los planos oficiales del PRC, pero no informa de manera inequívoca que corresponda a la actualización vigente desde 2026.",
      despues: "El decreto de aprobación identifica como planos oficiales nueve láminas de Coquimbo, tres de Tongoy y una de Guanaqueros.",
      impacto: "La plataforma no debe declarar el shape como actualizado hasta comparar extensión, zonas y geometrías del servicio SIG con las trece láminas oficiales de la versión 2026.",
      estado_documental: "validado",
      estado_sig: "pendiente_revision",
      fuente: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer"
    },
    {
      materia: "Orientación estratégica del nuevo plan",
      antes: "El instrumento anterior debía responder a cambios territoriales, sociales, económicos y ambientales posteriores a su formulación.",
      despues: "La actualización busca un instrumento unitario para Coquimbo, Tongoy y Guanaqueros, orientado a crecimiento sustentable, conectividad, equipamientos, áreas verdes y localización segura del desarrollo urbano.",
      impacto: "La lectura inmobiliaria debe identificar dónde el nuevo plan aumenta capacidad de desarrollo, dónde la reduce y dónde introduce condiciones por riesgo, protección o vialidad. Esta conclusión requiere bajar la comparación a zonas y artículos específicos.",
      estado_documental: "orientacion_estrategica",
      estado_sig: "no_aplica",
      fuente: "https://planreguladorcomunalcoquimbo.cl/preguntas-frecuentes/"
    }
  ],
  evidencia_documental: [
    {
      tipo: "acto_vigencia_2019",
      nombre: "Decreto N.º 1.287 de 2019",
      url: "https://www.bcn.cl/leychile/navegar?i=1133660"
    },
    {
      tipo: "acto_vigencia_2026",
      nombre: "Decreto Exento N.º 3.155 de 2025",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
    },
    {
      tipo: "expediente_eae_actualizacion",
      nombre: "Expediente EAE PRC Coquimbo, código E90",
      url: "https://eae.mma.gob.cl/file/455"
    },
    {
      tipo: "expediente_eae_enmienda",
      nombre: "Expediente EAE Enmienda Ferronor, código F28",
      url: "https://eae.mma.gob.cl/file/494"
    }
  ],
  evidencia_sig: [
    {
      tipo: "servicio_geoide",
      nombre: "PRC Coquimbo FeatureServer",
      url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer",
      estado: "versión_no_acreditada"
    }
  ],
  pendientes: [
    "Comparar ordenanzas 2019 y 2026 artículo por artículo.",
    "Comparar tablas de normas urbanísticas por zona.",
    "Comparar las láminas de zonificación de Coquimbo, Tongoy y Guanaqueros.",
    "Verificar la incorporación de la Enmienda Ferronor.",
    "Identificar fecha y versión efectiva de las capas GeoIDE."
  ]
};

window.COMPARACIONES_IPT.actos_por_comuna["coquimbo__coquimbo"] = [
  {
    id: "coquimbo-enmienda-ferronor-2025",
    tipo_acto: "Enmienda",
    titulo: "Enmienda N.º 1 PRC Coquimbo, terrenos ex Maestranza Ferronor",
    fecha: "2025-03-03",
    estado: "Vigente",
    clasificacion_portal: "Modificación",
    codigos_origen_afectados: [244],
    vinculacion_origen: "discrepancia_por_resolver",
    incorporacion_sig: "pendiente_revision",
    estado_revision: "Pendiente de verificar en PRC 2026 y SIG",
    fundamento_revision: "Asigna normativa ZU3 a las fajas ferroviarias desafectadas para habilitar el Plan Urbano Habitacional Ferronor. El código de origen informado por la exportación debe conciliarse con los registros comunales vigentes 282 y 322.",
    impacto_urbano: "Habilitación residencial y regeneración de un paño estratégico con más de 2.000 viviendas, equipamientos y áreas de parque.",
    fuente_oficial: "https://eae.mma.gob.cl/file/494",
    evidencia: "Diario Oficial CVE-2615636; Decreto Exento N.º 470 de 11 de febrero de 2025."
  },
  {
    id: "coquimbo-actualizacion-pri-elqui",
    tipo_acto: "Actualización en desarrollo",
    titulo: "Actualización PRI Elqui",
    fecha: "2023-09-12",
    estado: "En Desarrollo",
    clasificacion_portal: "Modificación",
    codigos_origen_afectados: [],
    vinculacion_origen: "pendiente",
    incorporacion_sig: "no_aplica",
    estado_revision: "Seguimiento de tramitación",
    fundamento_revision: "Proceso intercomunal aplicable a Coquimbo y otras comunas de la provincia de Elqui. No corresponde tratarlo como norma vigente mientras permanezca en desarrollo.",
    impacto_urbano: "Podría modificar el marco de extensión urbana, actividades productivas, riesgos y relación urbano-rural; su impacto definitivo depende de la aprobación del instrumento.",
    fuente_oficial: "https://portalipt.minvu.cl/instrumentos"
  }
];
