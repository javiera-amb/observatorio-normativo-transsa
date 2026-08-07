(() => {
  "use strict";

  window.COMPARACIONES_IPT = window.COMPARACIONES_IPT || { versiones: {}, actos_por_comuna: {} };
  const key = "282__322";
  const current = window.COMPARACIONES_IPT.versiones[key] || {};

  window.COMPARACIONES_IPT.versiones[key] = {
    ...current,
    id: "coquimbo-prc-2019-2026",
    region: "Coquimbo",
    comuna: "Coquimbo",
    tipo_ipt: "PRC",
    estado_analisis: "en_revision_avanzada",
    estado_sig: "pendiente_revision",
    nivel_evidencia: "comparacion_ordenanzas_parcial",
    fecha_revision: "2026-08-06",
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
    resumen_estrategico: "La actualización 2026 reemplaza el PRC vigente desde 2019 e introduce cambios normativos concretos: reduce la intensidad de la zona ZU3 base, crea subzonas de mayor densidad y regulación barrial, incorpora incentivos urbanísticos, amplía la protección patrimonial y de parques, agrega una nueva zona productiva ZP3 y reorganiza las zonas de infraestructura. La correspondencia espacial exacta debe verificarse con las trece láminas oficiales y el SIG.",
    avance_revision: {
      ordenanza_2019: "revisada",
      ordenanza_2026: "revisión parcial avanzada",
      planos_2019: "pendiente vectorización",
      planos_2026: "pendiente vectorización",
      comparacion_sig: "pendiente",
      alcance: "Primera pasada documental de catálogo de zonas y parámetros seleccionados"
    },
    materias_a_comparar: [
      "Límite urbano y extensión territorial",
      "Zonificación y usos de suelo",
      "Densidad, constructibilidad y ocupación de suelo",
      "Alturas, subdivisión predial y antejardines",
      "Incentivos urbanísticos",
      "Vialidad estructurante y declaratorias de utilidad pública",
      "Áreas de riesgo, protección y espacios públicos",
      "Incorporación de la Enmienda Ferronor"
    ],
    cambios: [
      {
        id: "coq-vigencia-2026",
        tipo_cambio: "reemplazo_integral",
        materia: "Reemplazo del marco normativo comunal",
        zonas: ["Coquimbo", "Tongoy", "Guanaqueros"],
        antes: "PRC promulgado por Decreto N.º 1.287 y publicado el 10 de julio de 2019.",
        despues: "Actualización promulgada por Decreto Exento N.º 3.155/2025 y vigente desde el 5 de enero de 2026.",
        impacto: "Los permisos, cabidas y evaluaciones de inversión posteriores deben utilizar el PRC 2026. No corresponde tratarlo como una modificación menor, sino como el nuevo instrumento base comunal.",
        estado_documental: "validado_acto_oficial",
        estado_sig: "pendiente_revision",
        fuente: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
      },
      {
        id: "coq-zu3-intensidad",
        tipo_cambio: "reduccion_intensidad",
        materia: "Zona ZU3: disminuye la intensidad de la norma base",
        zonas: ["ZU3"],
        antes: "PRC 2019: subdivisión predial mínima 160 m²; altura máxima 35 m; densidad bruta máxima 900 hab/ha; coeficiente de ocupación 0,7; constructibilidad 4; antejardín 3 m.",
        despues: "PRC 2026: subdivisión predial mínima 200 m²; altura máxima 30 m; densidad bruta máxima 600 hab/ha; coeficiente de ocupación 0,7; constructibilidad 4; sin antejardín obligatorio en la zona base.",
        impacto: "En los polígonos que continúen como ZU3 base se reduce el potencial residencial por altura y densidad, aumenta el tamaño predial mínimo y cambia la relación de la edificación con la calle. La magnitud territorial depende de comparar los planos 2019 y 2026.",
        estado_documental: "validado_ordenanzas",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2019, artículo 7, ZU3; Ordenanza 2026, artículo 12, ZU3.",
        fuente: "https://www.bcn.cl/leychile/navegar?i=1133660"
      },
      {
        id: "coq-zu3a-densidad",
        tipo_cambio: "subzona_nueva",
        materia: "Nueva subzona ZU3-A de mayor densidad",
        zonas: ["ZU3-A"],
        antes: "El catálogo 2019 consideraba ZU3, ZU3-1 y ZU3-2, sin una subzona ZU3-A.",
        despues: "El PRC 2026 incorpora ZU3-A, que aplica la norma ZU3 pero eleva la densidad bruta máxima desde 600 a 900 hab/ha.",
        impacto: "La reducción general de intensidad de ZU3 no es uniforme: el nuevo plan conserva una capacidad residencial alta en polígonos específicos mediante ZU3-A. Es prioritario identificar esos polígonos en SIG.",
        estado_documental: "validado_ordenanzas",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2026, artículo 12, ZU3-A.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-zu5-subzonas",
        tipo_cambio: "subdivision_regulatoria",
        materia: "La familia ZU5 se territorializa por poblaciones",
        zonas: ["ZU5-A", "ZU5-B", "ZU5-C", "ZU5-D"],
        antes: "El PRC 2019 utilizaba ZU5, ZU5-1, ZU5-2, ZU5a y ZU5a-2, sin distinguir normativamente varias poblaciones mediante códigos propios.",
        despues: "El PRC 2026 incorpora ZU5-A para Martín Badía, Gustavo Galleguillos, Larrondo, Matte, Guacolda y Pedro Aguirre Cerda; ZU5-B para Romeral y Buen Pastor; ZU5-C para Wenceslao Vargas; y ZU5-D para Ossandón.",
        impacto: "Se reemplaza una lectura más genérica por normas barriales diferenciadas. Por ejemplo, ZU5-A fija lote mínimo de 300 m², altura de 6 m, densidad de 300 hab/ha y constructibilidad 1,6; ZU5-B fija 300 m², altura de 3 m, densidad de 300 hab/ha y constructibilidad 1,6.",
        estado_documental: "validado_ordenanza_2026",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2026, artículo 12, subzonas ZU5-A a ZU5-D.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-incentivos",
        tipo_cambio: "incentivo_urbanistico",
        materia: "Se incorpora un sistema explícito de incentivos urbanísticos",
        zonas: ["ZU8", "ZU15-A", "ZE4"],
        antes: "La ordenanza 2019 no contenía un artículo general de incentivos urbanísticos equivalente.",
        despues: "El artículo 11 del PRC 2026 permite: en ZU8, aumentar altura a 27 m y densidad a 600 hab/ha por comercio en primer piso; en ZU15-A, aumentar altura a 24 m y densidad a 800 hab/ha; y en ZE4, aumentar densidad a 400 hab/ha cuando el proyecto entrega superficies adicionales para espacio público, áreas verdes o equipamiento.",
        impacto: "El potencial de desarrollo ya no depende solo de la norma base: ciertos proyectos pueden acceder a mayor intensidad a cambio de usos activos o aportes urbanos. Esto debe incorporarse en las evaluaciones de cabida.",
        estado_documental: "validado_ordenanza_2026",
        estado_sig: "no_aplica",
        evidencia: "Ordenanza 2026, artículo 11.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-zp3-productiva",
        tipo_cambio: "zona_nueva",
        materia: "Nueva zona productiva ZP3",
        zonas: ["ZP3"],
        antes: "El catálogo 2019 contemplaba ZP1 y ZP2, sin una zona ZP3.",
        despues: "El PRC 2026 incorpora ZP3 para actividades productivas inofensivas y molestas, con lote mínimo de 1.000 m², altura máxima de 15 m, ocupación de suelo 0,8, constructibilidad 6,0 y antejardín de 10 m; prohíbe vivienda y la mayoría de los equipamientos y servicios.",
        impacto: "Se crea una regulación productiva más especializada y restrictiva respecto de usos residenciales y comerciales. Su localización puede alterar la factibilidad industrial y la compatibilidad de proyectos en los polígonos involucrados.",
        estado_documental: "validado_ordenanza_2026",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2026, artículo 14, ZP3.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-patrimonio",
        tipo_cambio: "ampliacion_proteccion",
        materia: "Se amplía el catálogo de protección patrimonial",
        zonas: ["AVP2-A", "ZCH3", "ZCH4", "ZCH5", "ZCH5-A"],
        antes: "El PRC 2019 reconocía AVP1, AVP2, AVP3, ZCH1, ZCH1a y ZCH2, además de monumentos e inmuebles de conservación histórica.",
        despues: "El PRC 2026 agrega AVP2-A; ZCH3 para los zig-zags Garriga, Borgoño, Bilbao, Lastra, Las Heras, Benavente, Freire, Buenaventura Argandoña y González; ZCH4 para Población Matta; ZCH5 para Población Plaza Cohete; y ZCH5-A para Wenceslao Vargas y Av. Presidente Arturo Alessandri.",
        impacto: "Aumentan los sectores con regulación patrimonial específica, lo que puede condicionar demolición, alteración, volumetría, usos y diseño de intervenciones. La incidencia predial requiere cruzar los polígonos y el inventario de ICH.",
        estado_documental: "validado_ordenanza_2026",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2026, artículos 19 a 24.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-parques",
        tipo_cambio: "zona_nueva",
        materia: "Nuevas zonas de Parque Comunal",
        zonas: ["ZAVPC", "ZAVPC-A"],
        antes: "El catálogo 2019 consideraba ZAV y ZPI como zonas de áreas verdes.",
        despues: "El PRC 2026 incorpora ZAVPC Zona de Área Verde Parque Comunal y ZAVPC-A Subzona de Área Verde Parque Comunal A, manteniendo además ZAV y ZPI.",
        impacto: "Se diferencia una red de parques comunales respecto de las áreas verdes generales. Puede reforzar protección, continuidad espacial y destino público de terrenos específicos.",
        estado_documental: "validado_catalogo",
        estado_sig: "pendiente_revision",
        evidencia: "Ordenanza 2026, artículo 13.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-infraestructura",
        tipo_cambio: "recodificacion",
        materia: "Reorganización de las zonas de infraestructura portuaria y pesquera",
        zonas: ["ZI1", "ZI4", "ZI5"],
        antes: "El PRC 2019 separaba ZI1 Transporte Marítimo, ZI4 Infraestructura Portuaria y ZI5 Caletas Pesqueras.",
        despues: "El PRC 2026 define ZI1 como Infraestructura de Transporte Marítimo y Portuario y utiliza ZI4 para Caletas Pesqueras; ZI5 deja de figurar en el catálogo.",
        impacto: "El nuevo plan consolida funciones portuarias y recodifica las caletas. Antes de homologar shapes debe construirse una tabla de correspondencia entre códigos 2019 y 2026 para evitar asignar normas incorrectas.",
        estado_documental: "validado_catalogo",
        estado_sig: "pendiente_revision",
        evidencia: "Catálogos de zonificación de las ordenanzas 2019 y 2026.",
        fuente: "https://www.bcn.cl/leychile/navegar?i=1133660"
      },
      {
        id: "coq-zu18-zu19",
        tipo_cambio: "zona_no_reproducida",
        materia: "ZU18 y ZU19 no aparecen en el catálogo 2026",
        zonas: ["ZU18", "ZU19", "ZU19-1", "ZU19-2"],
        antes: "El PRC 2019 incluía ZU18, ZU19, ZU19-1 y ZU19-2.",
        despues: "Estas denominaciones no aparecen en el catálogo de zonas urbanas residenciales de la ordenanza 2026.",
        impacto: "No debe declararse aún que fueron simplemente eliminadas: sus polígonos pueden haber sido absorbidos o reemplazados por otros códigos. La verificación exige superponer las láminas de ambos planes.",
        estado_documental: "validado_catalogo",
        estado_sig: "pendiente_revision",
        evidencia: "Comparación de catálogos de zonificación 2019 y 2026.",
        fuente: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
      },
      {
        id: "coq-ferronor",
        tipo_cambio: "enmienda_transitoria",
        materia: "Enmienda Ferronor durante la transición",
        zonas: ["ZU3", "Ex Maestranza Ferronor"],
        antes: "Las fajas ferroviarias desafectadas quedaron dentro del límite urbano sin normas urbanísticas específicas equivalentes a su entorno.",
        despues: "La Enmienda N.º 1 asignó normativa ZU3 a las fajas desafectadas para posibilitar el Plan Urbano Habitacional Ferronor, con más de 2.000 viviendas, equipamientos y áreas de parque.",
        impacto: "Debe verificarse si el PRC 2026 incorporó, reemplazó o redistribuyó esta zonificación y si el SIG disponible refleja la solución final.",
        estado_documental: "validado_acto",
        estado_sig: "pendiente_revision",
        evidencia: "Diario Oficial CVE-2615636 y expediente EAE F28.",
        fuente: "https://eae.mma.gob.cl/file/494"
      }
    ],
    evidencia_documental: [
      {
        tipo: "acto_vigencia_2019",
        nombre: "Decreto N.º 1.287 de 2019 y Ordenanza PRC 2019",
        url: "https://www.bcn.cl/leychile/navegar?i=1133660"
      },
      {
        tipo: "acto_vigencia_2026",
        nombre: "Decreto Exento N.º 3.155 de 2025",
        url: "https://www.bcn.cl/leychile/navegar?idNorma=1219776"
      },
      {
        tipo: "expediente_actualizacion",
        nombre: "Sitio del proceso de actualización PRC Coquimbo",
        url: "https://planreguladorcomunalcoquimbo.cl/prc-coquimbo/"
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
        estado: "version_no_acreditada"
      }
    ],
    pendientes: [
      "Vectorizar y comparar las trece láminas oficiales del PRC 2026.",
      "Construir correspondencia poligonal entre códigos de zona 2019 y 2026.",
      "Completar comparación de parámetros para todas las zonas equivalentes.",
      "Comparar límite urbano, vialidad, riesgos e inmuebles de conservación histórica.",
      "Verificar la incorporación de la Enmienda Ferronor.",
      "Identificar fecha y versión efectiva de las capas GeoIDE."
    ]
  };
})();
