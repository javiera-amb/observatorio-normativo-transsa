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
    estado_analisis: "auditoria_sig_avanzada",
    estado_sig: "validacion_avanzada_con_brechas",
    nivel_evidencia: "vector_directo_con_control_documental_y_topologico",
    fecha_revision: "2026-08-11",
    naturaleza_transicion: "reemplazo_integral_confirmado",
    etiqueta_transicion: "Nuevo PRC base · reemplazo integral",
    paquete_refundido: {
      estado: "confirmado_documentalmente",
      base_anterior: "PRC Coquimbo 2019",
      base_vigente: "PRC Coquimbo 2026",
      consolida: [
        "Un único instrumento base vigente para Coquimbo, Tongoy y Guanaqueros."
      ],
      incorpora: [
        "La Enmienda N.º 1 Ferronor fue localizada espacialmente y aparece absorbida principalmente por ZU3-A."
      ],
      incorpora_estado: "ferronor_verificado_espacialmente",
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
        "Determinar el alcance exacto del Decreto Exento N.º 031 que aclara y rectifica el Decreto N.º 3.155.",
        "Resolver por qué ZU15-A figura en las láminas oficiales y no aparece en las cuatro capas vectoriales descargadas.",
        "Corregir o justificar geometrías vacías, inválidas y duplicadas detectadas en el servicio vectorial.",
        "Acreditar la continuidad de los ICH que conservan fecha 2019 dentro de la capa publicada en 2025.",
        "Comparar y controlar espacialmente las trece láminas 2026."
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
      planos_2026: "publicados · comparación parcial con servicio vectorial",
      comparacion_sig: "auditoría avanzada del FeatureServer",
      alcance: "Control documental, descarga vectorial directa, contraste de códigos, revisión topológica y superposición de Ferronor"
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
        tipo_cambio: "enmienda_incorporada_y_reconvertida",
        materia: "Enmienda Ferronor incorporada y recodificada en el PRC 2026",
        zonas: ["ZU3", "ZU3-A", "Ex Maestranza Ferronor"],
        antes: "Las fajas ferroviarias desafectadas quedaron dentro del límite urbano sin normas urbanísticas específicas equivalentes a su entorno.",
        despues: "La Enmienda N.º 1 asignó ZU3. En el servicio vectorial asociado al PRC 2026, sus tres polígonos aparecen principalmente como ZU3-A.",
        impacto: "La enmienda no aparece omitida: fue absorbida por el PRC refundido y recodificada. La plataforma debe conservar la trazabilidad ZU3 → ZU3-A.",
        estado_documental: "validado_acto_y_plano",
        estado_sig: "incorporado",
        evidencia: "Polígonos reconstruidos desde la tabla UTM oficial: P1 100% ZU3-A; P2 99,1% ZU3-A; P3 98,1% ZU3-A. Las diferencias menores se concentran en bordes ZU4 y deben controlarse por los tramos curvos del plano.",
        fuente: "https://eae.mma.gob.cl/storage/documents/04_Anteproyecto_Enmienda_PRC_Coquimbo_Maestranza_Planos.pdf.pdf"
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
        nombre: "Ordenanza Local PRC Coquimbo 2026",
        url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/03_Ordenanza_Local.pdf"
      },
      {
        tipo: "plano_oficial_2026",
        nombre: "Lámina oficial PRC Coquimbo 2026 · Coquimbo 1",
        url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/planos-zonificacion-firmados/01_PRC_Coquimbo_Coquimbo_lam1_vf.pdf"
      },
      {
        tipo: "rectificacion_2026",
        nombre: "Decreto Exento N.º 031 · aclara y rectifica Decreto N.º 3.155",
        url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/07_decreto-ex_031_09.01.2025_rectifica-decreto-3155.pdf"
      },
      {
        tipo: "enmienda_ferronor",
        nombre: "Decreto N.º 470 · promulga Enmienda N.º 1 Ferronor",
        url: "https://www.municoquimbo.cl/images/estructura/2025/Octubre/pr2019/3-enmienda-n1-plan-regulador-comunal-terrenos-ex-maestranza-ferronor/01-Decreto-470-110225-Promulga-Enmienda-N1-PRC-Terrenos-Ex-Maestranza-Ferronor.pdf"
      },
      {
        tipo: "plano_enmienda_ferronor",
        nombre: "Plano Ferronor con tabla de vértices UTM",
        url: "https://eae.mma.gob.cl/storage/documents/04_Anteproyecto_Enmienda_PRC_Coquimbo_Maestranza_Planos.pdf.pdf"
      }
    ],
    evidencia_sig: [
      {
        tipo: "servicio_geoide",
        nombre: "PRC Coquimbo FeatureServer",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer",
        estado: "fuente_vectorial_preferida"
      },
      {
        tipo: "capa_vectorial",
        nombre: "Zonificación base · capa 3 · 1.183 entidades",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/3",
        estado: "descarga_directa_geojson"
      },
      {
        tipo: "capa_vectorial",
        nombre: "Áreas de riesgo · capa 30 · 354 entidades",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/30",
        estado: "descarga_directa_geojson"
      },
      {
        tipo: "capa_vectorial",
        nombre: "Inmuebles de conservación histórica · capa 31 · 158 entidades",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/31",
        estado: "descarga_directa_geojson"
      },
      {
        tipo: "capa_vectorial",
        nombre: "Subzonas · capa 32 · 503 entidades",
        url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/32",
        estado: "descarga_directa_geojson"
      }
    ],
    diagnostico_sig: {
      objetivo: "Acreditar que el servicio vectorial representa íntegramente el PRC Coquimbo 2026 y documentar cualquier diferencia antes de liberarlo como SIG validado.",
      capa_actual: "PRC_Coquimbo / GeoIDE MINVU / correspondencia 2026 altamente probable",
      instrumento_objetivo: "PRC Coquimbo 2026",
      fecha_instrumento_objetivo: "2026-01-05",
      aptitud_actual_visor: "NO",
      motivo: "El FeatureServer coincide ampliamente con el Decreto N.º 3.155 y contiene geometría 2026 utilizable, pero aún existen brechas documentales, de catálogo y topología que deben resolverse.",
      criterio_publicacion: "La capa podrá pasar a SIG 2026 validado cuando se resuelva la rectificación N.º 031, la ausencia vectorial de ZU15-A, los defectos geométricos y la continuidad de la capa ICH."
    },
    auditoria_operativa: {
      titulo: "Por qué aún no dice SIG 2026 validado",
      resumen: "La fuente vectorial es directa y su correspondencia con el PRC 2026 es alta, pero todavía no supera todos los controles documentales, de catálogo y topología.",
      estados: [
        { nombre: "Vigencia legal", valor: "Confirmada", estado: "completo" },
        { nombre: "Fuente vectorial", valor: "Directa", estado: "completo" },
        { nombre: "Correspondencia 2026", valor: "Alta", estado: "en_progreso" },
        { nombre: "QA geométrica", valor: "Con observaciones", estado: "bloqueado" }
      ],
      metodo: [
        "Se identificó el servicio REST que alimenta el visor y se descargaron directamente sus cuatro capas principales en GeoJSON; no se hizo scrapeo de pantalla.",
        "Se revisaron conteos, campos, fechas y decretos de cada entidad y se contrastaron los códigos de zona con la ordenanza y las láminas municipales firmadas.",
        "Se ejecutaron controles de geometrías vacías, validez topológica, duplicados, superposiciones y consistencia de atributos.",
        "La Enmienda Ferronor se reconstruyó desde su tabla oficial de coordenadas UTM y se superpuso con la zonificación 2026."
      ],
      controles: [
        {
          id: "COQ-VAL-01",
          prioridad: "crítica",
          estado: "pendiente",
          titulo: "Revisar el alcance de la rectificación N.º 031",
          hallazgo: "Existe un decreto posterior que aclara y rectifica el Decreto N.º 3.155. Mientras no se determine qué texto, plano o referencia corrige, no corresponde cerrar la validación.",
          como_se_detecto: "Se contrastó la publicación del Decreto N.º 3.155 con el expediente municipal vigente, que incluye expresamente el Decreto Exento N.º 031.",
          tarea: "Leer el decreto completo, registrar cada rectificación y comprobar si altera atributos, códigos, láminas o solamente antecedentes formales.",
          evidencias: [
            { nombre: "Decreto N.º 3.155 en BCN", url: "https://www.bcn.cl/leychile/navegar?idNorma=1219776" },
            { nombre: "Decreto Exento N.º 031", url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/07_decreto-ex_031_09.01.2025_rectifica-decreto-3155.pdf" }
          ]
        },
        {
          id: "COQ-VAL-02",
          prioridad: "crítica",
          estado: "pendiente",
          titulo: "Resolver la ausencia de ZU15-A en el servicio vectorial",
          hallazgo: "ZU15-A figura en las láminas oficiales y en la ordenanza 2026, pero no aparece como código en las cuatro capas GeoJSON descargadas.",
          como_se_detecto: "Se extrajo el catálogo de códigos distintos del FeatureServer y se comparó con los códigos publicados en la ordenanza y en las láminas firmadas.",
          tarea: "Localizar los polígonos ZU15-A en las láminas, verificar si fueron recodificados o están omitidos y documentar la corrección necesaria.",
          evidencias: [
            { nombre: "Lámina oficial Coquimbo 1", url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/planos-zonificacion-firmados/01_PRC_Coquimbo_Coquimbo_lam1_vf.pdf" },
            { nombre: "FeatureServer · zonificación", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/3" },
            { nombre: "Ordenanza Local 2026", url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/03_Ordenanza_Local.pdf" }
          ]
        },
        {
          id: "COQ-VAL-03",
          prioridad: "alta",
          estado: "pendiente",
          titulo: "Corregir o justificar geometrías vacías, inválidas y duplicadas",
          hallazgo: "La zonificación contiene dos geometrías vacías —OBJECTID 656 ZU5 y 892 ZU9-A—. Riesgos contiene cuatro polígonos inválidos —117, 218, 327 y 352— y una geometría duplicada —38 y 72—.",
          como_se_detecto: "Se ejecutó un control topológico sobre los GeoJSON descargados: geometría vacía, is_valid, duplicados exactos y superposición.",
          tarea: "Revisar cada OBJECTID contra el plano oficial; corregir la geometría o registrar por qué debe excluirse. Repetir el QA hasta obtener cero errores bloqueantes.",
          evidencias: [
            { nombre: "FeatureServer · zonificación", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/3" },
            { nombre: "FeatureServer · áreas de riesgo", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/30" }
          ]
        },
        {
          id: "COQ-VAL-04",
          prioridad: "alta",
          estado: "pendiente",
          titulo: "Acreditar la continuidad de los ICH 2019–2026",
          hallazgo: "La capa ICH mezcla 57 registros con fecha 10/07/2019 y 101 con fecha 24/12/2025 sin un campo que explique si fueron mantenidos, modificados o incorporados.",
          como_se_detecto: "Se agruparon los 158 registros de la capa ICH por fecha y decreto y se revisó la ausencia de campos de linaje o vigencia.",
          tarea: "Comparar la lista ICH de 2019 con la nómina y planos 2026, clasificando cada registro como mantenido, modificado, eliminado o nuevo.",
          evidencias: [
            { nombre: "FeatureServer · ICH", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/31" },
            { nombre: "Ordenanza Local 2026", url: "https://www.municoquimbo.cl/images/estructura/2026/plan-regulador-24122025/03_Ordenanza_Local.pdf" }
          ]
        },
        {
          id: "COQ-VAL-05",
          prioridad: "media",
          estado: "pendiente",
          titulo: "Normalizar atributos y nombres de localidad",
          hallazgo: "La zonificación usa “Guanaquero”, mientras riesgos y subzonas usan “Guanaqueros”; además existen valores nulos en campos normativos.",
          como_se_detecto: "Se compararon dominios de atributos, valores nulos y nombres de localidad entre las cuatro capas.",
          tarea: "Definir dominios normalizados, corregir inconsistencias y conservar el valor original en un campo de trazabilidad.",
          evidencias: [
            { nombre: "FeatureServer PRC Coquimbo", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer" }
          ]
        },
        {
          id: "COQ-VAL-06",
          prioridad: "informativa",
          estado: "verificado",
          titulo: "Ferronor está incorporado y recodificado",
          hallazgo: "Los tres polígonos de la Enmienda N.º 1, originalmente ZU3, caen casi íntegramente en ZU3-A del PRC 2026.",
          como_se_detecto: "Se reconstruyeron los polígonos desde la tabla UTM oficial y se superpusieron con la capa de zonificación: P1 100%; P2 99,1%; P3 98,1% en ZU3-A.",
          tarea: "Conservar la trazabilidad ZU3 → ZU3-A y revisar únicamente los bordes curvos que intersectan ZU4.",
          evidencias: [
            { nombre: "Plano Ferronor con vértices UTM", url: "https://eae.mma.gob.cl/storage/documents/04_Anteproyecto_Enmienda_PRC_Coquimbo_Maestranza_Planos.pdf.pdf" },
            { nombre: "Decreto N.º 470 Ferronor", url: "https://www.municoquimbo.cl/images/estructura/2025/Octubre/pr2019/3-enmienda-n1-plan-regulador-comunal-terrenos-ex-maestranza-ferronor/01-Decreto-470-110225-Promulga-Enmienda-N1-PRC-Terrenos-Ex-Maestranza-Ferronor.pdf" },
            { nombre: "FeatureServer · zonificación", url: "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer/3" }
          ]
        }
      ]
    },
    acciones_sig: [
      {
        id: "COQ-SIG-01",
        prioridad: "crítica",
        accion: "VALIDAR_FUENTE_VECTORIAL",
        objeto: "Fuente vectorial base del PRC 2026",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Coquimbo, Tongoy y Guanaqueros",
        instruccion: "Usar el FeatureServer GeoIDE como fuente operativa preferida, congelar una copia fechada y validarla contra los planos, la ordenanza y la rectificación N.º 031. Mantener el PRC 2019 solo como histórico.",
        cambios_normativos: ["coq-vigencia-2026"],
        estado: "en_revision",
        dependencia: "Resolver diferencias de catálogo, rectificación y QA geométrica.",
        resultado_esperado: "Copia vectorial 2026 acreditada, versionada y reproducible, con enlace a su fuente y fecha de descarga."
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
        prioridad: "crítica",
        accion: "CONTROLAR_CODIGO_FALTANTE",
        objeto: "Zona ZU15-A ausente en el vector",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Polígonos identificados como ZU15-A en las láminas oficiales",
        instruccion: "Localizar ZU15-A en las láminas, comprobar si fue omitida o recodificada en el servicio y corregir la capa o documentar la equivalencia.",
        cambios_normativos: ["coq-incentivos"],
        estado: "bloqueada_por_diferencia",
        dependencia: "Comparación dirigida entre láminas firmadas, ordenanza y FeatureServer.",
        resultado_esperado: "Todos los polígonos ZU15-A representados y vinculados con su norma e incentivo urbanístico."
      },
      {
        id: "COQ-SIG-04",
        prioridad: "alta",
        accion: "CORREGIR_QA_GEOMETRICA",
        objeto: "Geometrías vacías, inválidas y duplicadas",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO / RIESGOS_PRC_COQUIMBO",
        ambito: "OBJECTID 656, 892; riesgos 117, 218, 327, 352, 38 y 72",
        instruccion: "Controlar cada entidad contra el plano, reparar las geometrías justificadas y eliminar duplicados solo cuando se confirme que representan el mismo objeto normativo.",
        cambios_normativos: ["coq-vigencia-2026"],
        estado: "definida",
        dependencia: "Control visual y topológico sobre la copia descargada.",
        resultado_esperado: "Cero geometrías vacías, inválidas o duplicadas sin justificación documentada."
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
        prioridad: "alta",
        accion: "DOCUMENTAR_ENMIENDA_INCORPORADA",
        objeto: "Ex Maestranza Ferronor",
        capa_objetivo: "ZONIFICACION_PRC_COQUIMBO",
        ambito: "Fajas ferroviarias desafectadas y área del Plan Urbano Habitacional Ferronor",
        instruccion: "Registrar que la Enmienda N.º 1 ZU3 fue absorbida principalmente como ZU3-A por el PRC 2026 y conservar la relación entre el acto anterior y la solución normativa final.",
        cambios_normativos: ["coq-ferronor"],
        estado: "verificada",
        dependencia: "Control final de bordes curvos que intersectan ZU4.",
        resultado_esperado: "Ferronor representado una sola vez como normativa vigente, con trazabilidad ZU3 → ZU3-A."
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
      { id: "fuente", nombre: "Fuente vectorial identificada", estado: "completo" },
      { id: "comparacion", nombre: "Correspondencia cartográfica", estado: "en_progreso" },
      { id: "accion", nombre: "Controles y acciones definidos", estado: "completo" },
      { id: "ejecucion", nombre: "Cambio aplicado", estado: "pendiente" },
      { id: "geometria", nombre: "QA geométrica", estado: "en_progreso" },
      { id: "atributos", nombre: "Atributos validados", estado: "pendiente" },
      { id: "visor", nombre: "Listo para visor", estado: "pendiente" }
    ],
    pendientes: [
      "Resolver el alcance del Decreto Exento N.º 031.",
      "Resolver la ausencia de ZU15-A en el servicio vectorial.",
      "Corregir o justificar geometrías vacías, inválidas y duplicadas.",
      "Acreditar la continuidad de los ICH 2019–2026.",
      "Normalizar nombres de localidad y campos con valores nulos.",
      "Comparar de forma dirigida las trece láminas oficiales con las capas descargadas.",
      "Construir correspondencia poligonal entre códigos de zona 2019 y 2026.",
      "Completar comparación de parámetros para todas las zonas equivalentes.",
      "Comparar límite urbano, vialidad y capas temáticas restantes."
    ]
  };
})();
