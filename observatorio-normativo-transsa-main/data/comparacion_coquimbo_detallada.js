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
    naturaleza_transicion: "reemplazo_integral_confirmado",
    etiqueta_transicion: "Nuevo PRC base · reemplazo integral",
    paquete_refundido: {
      estado: "confirmado_documentalmente",
      base_anterior: "PRC Coquimbo 2019",
      base_vigente: "PRC Coquimbo 2026",
      consolida: [
        "Un único instrumento base vigente para Coquimbo, Tongoy y Guanaqueros."
      ],
      incorpora: [],
      incorpora_estado: "pendiente_validar_actos_anteriores",
      cambia: [
        "Intensidad y parámetros de ZU3.",
        "Nuevas subzonas ZU3-A y ZU5-A a ZU5-D.",
        "Incentivos urbanísticos en ZU8, ZU15-A y ZE4.",
        "Nueva zona productiva ZP3.",
        "Protección patrimonial, parques e infraestructura."
      ],
      reemplaza: [
        "El PRC 2019 queda como versión histórica.",
        "Los códigos ZI1, ZI4 y ZI5 requieren correspondencia 2019–2026.",
        "ZU18 y la familia ZU19 requieren identificar su zona sucesora."
      ],
      sin_cambio: [
        "Límite urbano: la Municipalidad informó que la actualización no lo modifica."
      ],
      pendientes: [
        "Determinar qué actos y enmiendas anteriores quedaron efectivamente incorporados.",
        "Resolver la incorporación o reemplazo de la Enmienda Ferronor.",
        "Comparar y controlar espacialmente las trece láminas 2026.",
        "Acreditar la versión efectiva de cada servicio vectorial utilizado."
      ]
    },
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
    diagnostico_sig: {
      objetivo: "Actualizar el SIG comunal para que represente el PRC Coquimbo 2026 como base vigente y conserve el PRC 2019 únicamente como antecedente histórico.",
      capa_actual: "PRC_Coquimbo / versión GeoIDE no acreditada",
      instrumento_objetivo: "PRC Coquimbo 2026",
      fecha_instrumento_objetivo: "2026-01-05",
      aptitud_actual_visor: "NO",
      motivo: "La versión cartográfica disponible no está acreditada como equivalente a las trece láminas oficiales del PRC 2026.",
      criterio_publicacion: "La capa solo podrá pasar a lista para visor cuando la geometría, los códigos de zona y los parámetros normativos hayan sido validados contra las láminas y la ordenanza 2026."
    },
    acciones_sig: [
      {
        id: "COQ-SIG-01",
        prioridad: "crítica",
        accion: "REEMPLAZAR_GEOMETRIA",
        objeto: "Zonificación base del PRC",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Coquimbo, Tongoy y Guanaqueros",
        instruccion: "Sustituir la zonificación 2019 por los polígonos oficiales del PRC 2026. Mantener la versión 2019 en la capa histórica y no mezclar ambas vigencias.",
        cambios_normativos: ["coq-vigencia-2026"],
        estado: "bloqueada_por_planos",
        dependencia: "Vectorizar y controlar las trece láminas oficiales 2026.",
        resultado_esperado: "Una única zonificación base vigente con fecha normativa 2026-01-05."
      },
      {
        id: "COQ-SIG-02",
        prioridad: "crítica",
        accion: "CREAR_CORRESPONDENCIA",
        objeto: "Homologación de zonas 2019–2026",
        capa_objetivo: "TABLA_EQUIVALENCIA_ZONAS",
        ambito: "Todos los códigos de zona del PRC",
        instruccion: "Construir una tabla que clasifique cada zona 2019 como equivalente, reemplazada, subdividida, absorbida o eliminada respecto del PRC 2026.",
        cambios_normativos: ["coq-zu3-intensidad", "coq-zu5-subzonas", "coq-infraestructura", "coq-zu18-zu19"],
        estado: "definida",
        dependencia: "Comparación espacial de planos 2019 y 2026.",
        resultado_esperado: "Trazabilidad completa entre códigos antiguos y vigentes, sin homologaciones automáticas incorrectas."
      },
      {
        id: "COQ-SIG-03",
        prioridad: "alta",
        accion: "AGREGAR_Y_RECODIFICAR_POLIGONOS",
        objeto: "Nuevas subzonas residenciales",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Polígonos ZU3-A y ZU5-A a ZU5-D",
        instruccion: "Digitalizar las nuevas subzonas y asignar sus códigos y parámetros 2026. No aplicar los parámetros de ZU3 o ZU5 base a estos polígonos.",
        cambios_normativos: ["coq-zu3a-densidad", "coq-zu5-subzonas"],
        estado: "bloqueada_por_planos",
        dependencia: "Delimitación oficial en láminas 2026.",
        resultado_esperado: "Subzonas residenciales individualizadas con normativa propia."
      },
      {
        id: "COQ-SIG-04",
        prioridad: "alta",
        accion: "AGREGAR_POLIGONOS",
        objeto: "Zonas nuevas productivas, patrimoniales y de parques",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "ZP3, AVP2-A, ZCH3, ZCH4, ZCH5, ZCH5-A, ZAVPC y ZAVPC-A",
        instruccion: "Incorporar los polígonos nuevos y vincularlos con sus artículos y parámetros. Las protecciones patrimoniales que operen por superposición deben conservarse también en una capa temática.",
        cambios_normativos: ["coq-zp3-productiva", "coq-patrimonio", "coq-parques"],
        estado: "bloqueada_por_planos",
        dependencia: "Delimitación oficial y definición del modelo de superposición patrimonial.",
        resultado_esperado: "Nuevas zonas visibles y consultables sin perder su condición temática."
      },
      {
        id: "COQ-SIG-05",
        prioridad: "alta",
        accion: "ACTUALIZAR_ATRIBUTOS",
        objeto: "Recodificación de infraestructura",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "ZI1, ZI4 y antigua ZI5",
        instruccion: "Actualizar la tabla de atributos conforme al catálogo 2026: ZI1 integra transporte marítimo y portuario; ZI4 identifica caletas pesqueras; no conservar ZI5 como código vigente sin resolver su correspondencia territorial.",
        cambios_normativos: ["coq-infraestructura"],
        estado: "definida",
        dependencia: "Tabla de equivalencia y revisión de polígonos.",
        resultado_esperado: "Códigos de infraestructura coherentes con la ordenanza 2026."
      },
      {
        id: "COQ-SIG-06",
        prioridad: "alta",
        accion: "RESOLVER_ZONAS_NO_REPRODUCIDAS",
        objeto: "ZU18 y familia ZU19",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Polígonos 2019 ZU18, ZU19, ZU19-1 y ZU19-2",
        instruccion: "No eliminar estos polígonos por nombre. Superponer ambas versiones y determinar qué códigos 2026 absorben o reemplazan cada sector.",
        cambios_normativos: ["coq-zu18-zu19"],
        estado: "bloqueada_por_planos",
        dependencia: "Superposición espacial 2019–2026.",
        resultado_esperado: "Todos los polígonos antiguos con destino normativo 2026 documentado."
      },
      {
        id: "COQ-SIG-07",
        prioridad: "crítica",
        accion: "VERIFICAR_E_INTEGRAR_ENMIENDA",
        objeto: "Ex Maestranza Ferronor",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Fajas ferroviarias desafectadas y área del Plan Urbano Habitacional Ferronor",
        instruccion: "Comparar la Enmienda N.º 1 con el PRC 2026 y determinar si ZU3 fue incorporada, modificada o reemplazada. Aplicar solo la solución normativa final vigente.",
        cambios_normativos: ["coq-ferronor"],
        estado: "pendiente_revision",
        dependencia: "Polígono oficial de la enmienda y lámina 2026 correspondiente.",
        resultado_esperado: "Ferronor representado una sola vez con su normativa vigente final."
      },
      {
        id: "COQ-SIG-08",
        prioridad: "media",
        accion: "AGREGAR_CAPAS_SUPLEMENTARIAS",
        objeto: "Incentivos, riesgos, vialidad y protección",
        capa_objetivo: "CAPAS_TEMATICAS_PRC_COQUIMBO",
        ambito: "Ámbito urbano comunal",
        instruccion: "Modelar como capas o atributos suplementarios los incentivos urbanísticos, riesgos, vialidad estructurante, utilidad pública y protección. No reemplazar la zona base cuando la norma opera por superposición.",
        cambios_normativos: ["coq-incentivos", "coq-patrimonio"],
        estado: "definida_parcial",
        dependencia: "Completar revisión de artículos y planos temáticos.",
        resultado_esperado: "El visor informa la zona base y todas las condiciones superpuestas aplicables."
      }
    ],
    flujo_validacion: [
      { id: "normativa", nombre: "Normativa identificada", estado: "completo" },
      { id: "comparacion", nombre: "Cambio normativo validado", estado: "en_progreso" },
      { id: "accion", nombre: "Acción SIG definida", estado: "en_progreso" },
      { id: "ejecucion", nombre: "Cambio aplicado", estado: "pendiente" },
      { id: "geometria", nombre: "Geometría validada", estado: "pendiente" },
      { id: "atributos", nombre: "Atributos validados", estado: "pendiente" },
      { id: "visor", nombre: "Listo para visor", estado: "pendiente" }
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
