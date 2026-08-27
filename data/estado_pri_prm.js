window.ESTADO_PRI_PRM = {
  schema_version: 3,
  actualizado_en: "2026-08-26",
  criterio: "Los PRI/PRM se mantienen como IPT independientes del PRC. Se procesan, consolidan y validan con el mismo estándar técnico general, pero no se intersectan ni reemplazan el PRC como producto base. La relación con PRC se registra por ámbito territorial y el cruce espacial se realiza solo para análisis específicos.",
  almacenamiento: {
    raiz: "00_IPT_Nacional",
    patron_region: "IPT_<Region>",
    carpetas_intercomunales_admitidas: ["PRI", "PRM", "PRMS", "PRMV", "PRMC", "PRMVAL"],
    regla_deteccion: "Dentro de cada carpeta regional IPT, TUI busca la carpeta intercomunal/metropolitana existente. No se crea una estructura paralela ni se mueven fuentes.",
    ejemplos_confirmados: [
      "00_IPT_Nacional/IPT_Antofagasta/PRI",
      "00_IPT_Nacional/IPT_Metropolitana/PRMS"
    ]
  },
  estados_permitidos: ["pendiente", "en_desarrollo", "actualizado", "enviado"],
  qa_permitido: ["pendiente", "observaciones", "aprobado"],
  producto: {
    geometria: "GeoPackage consolidado del PRI/PRM en EPSG:4326",
    tabla_normativa: "Tabla normativa propia del instrumento",
    relacion_prc: "Listado de comunas/PRC comprendidos en su ámbito; no genera una geometría PRC+PRI consolidada"
  },
  regla_integracion: {
    seccionales: "Reemplazan normativa PRC donde jurídicamente corresponde.",
    pri_prm: "Se mantienen independientes del PRC y conservan su propia geometría y normativa.",
    capas_tematicas_prc: "Riesgo, ZNE, edificación y otras coberturas pueden formar parte del overlay analítico del PRC, conservando siempre su origen.",
    cruce_pri_prc: "PRI/PRM + PRC se cruza solo para consultas o productos analíticos específicos."
  },
  nomenclatura_sugerida: {
    fuente: "IPT_<COD>_<TIPO>_<NOMBRE>",
    cierre: "IPT_<COD>_<TIPO>_<NOMBRE>_ACTUALIZADO.gpkg",
    nota: "Se conserva el tipo real del instrumento en el nombre: PRI, PRMS, PRMV u otra variante."
  },
  fuentes_detectadas: [
    {
      region: "Antofagasta",
      carpeta_tipo: "PRI",
      ruta: "00_IPT_Nacional/IPT_Antofagasta/PRI",
      evidencia: "IPT_02_PRI_CosteroAntofagasta.shp",
      clasificacion: "instrumento_identificable"
    },
    {
      region: "Metropolitana",
      carpeta_tipo: "PRMS",
      ruta: "00_IPT_Nacional/IPT_Metropolitana/PRMS",
      evidencia: "Carpeta PRMS con múltiples capas temáticas (por ejemplo LU y Resguardo)",
      clasificacion: "instrumento_multicapa"
    }
  ],
  instrumentos: [
    {
      id: "antofagasta|pri|costero-antofagasta",
      nombre: "PRI Costero Antofagasta",
      sigla: "PRI",
      tipo: "PRI",
      region: "Antofagasta",
      ambito: "Intercomunal",
      comunas: [],
      estado_produccion: "pendiente",
      responsable: "",
      archivo: "IPT_02_PRI_CosteroAntofagasta.shp",
      ruta_relativa: "00_IPT_Nacional/IPT_Antofagasta/PRI/IPT_02_PRI_CosteroAntofagasta.shp",
      qa: "pendiente",
      fuente_inventario: "SharePoint"
    },
    {
      id: "metropolitana|prms|santiago",
      nombre: "Plan Regulador Metropolitano de Santiago",
      sigla: "PRMS",
      tipo: "PRMS",
      region: "Metropolitana",
      ambito: "Metropolitano",
      comunas: [],
      estado_produccion: "pendiente",
      responsable: "",
      archivo: "Carpeta PRMS · múltiples capas fuente",
      ruta_relativa: "00_IPT_Nacional/IPT_Metropolitana/PRMS",
      qa: "pendiente",
      fuente_inventario: "SharePoint"
    }
  ]
};

// Limpieza de textos heredados de la metodología antigua.
// Este archivo se carga al iniciar Seguimiento IPT, por lo que sirve como
// compatibilidad sin tener que duplicar la lógica del tablero PRC.
(() => {
  const setText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  };

  setText(
    ".seguimiento-interpretation .ready p",
    "Actualizado se activa automáticamente cuando TUI detecta el archivo final *_ACTUALIZADO.gpkg. El QA técnico se informa por separado."
  );

  setText(
    ".seguimiento-workflow-panel > div p",
    "Cuando aparece el archivo final *_ACTUALIZADO.gpkg en la carpeta comunal, TUI cambia automáticamente el estado a Actualizado. El QA geométrico y normativo sigue siendo un control independiente."
  );

  const pasos = document.querySelectorAll(".seguimiento-workflow li");
  if (pasos[0]) {
    pasos[0].querySelector("strong")?.replaceChildren("Cierre del PRC");
    pasos[0].querySelector("small")?.replaceChildren("Se genera NOMBREIPT_ACTUALIZADO.gpkg en EPSG:4326 dentro de la carpeta comunal.");
  }
  if (pasos[1]) {
    pasos[1].querySelector("strong")?.replaceChildren("QA geométrico");
    pasos[1].querySelector("small")?.replaceChildren("Se controlan CRS, geometrías nulas, vacías e inválidas. El QA no bloquea el cambio automático de estado.");
  }
  if (pasos[2]) {
    pasos[2].querySelector("strong")?.replaceChildren("Consolidación normativa");
    pasos[2].querySelector("small")?.replaceChildren("Los seccionales reemplazan el PRC donde corresponde; riesgo, ZNE, edificación y otras normativas se integran como overlay conservando su origen.");
  }
  if (pasos[3]) {
    pasos[3].querySelector("strong")?.replaceChildren("Revisión y trazabilidad");
    pasos[3].querySelector("small")?.replaceChildren("Se revisan fuentes, modificaciones, atributos y observaciones que requieren criterio del equipo.");
  }
  if (pasos[4]) {
    pasos[4].querySelector("strong")?.replaceChildren("Envío");
    pasos[4].querySelector("small")?.replaceChildren("Cuando el producto está aprobado, se marca Enviado y el siguiente paso queda a cargo de Propiteq.");
  }

  setText(".seguimiento-v2-alert h3", "Regla vigente para reconstruir y consolidar PRC");
  setText(
    ".seguimiento-v2-alert p",
    "La metodología vigente conserva las fuentes originales y genera un PRC consolidado trazable. Los seccionales sustituyen normativa cuando corresponde y las demás coberturas normativas se integran analíticamente sin perder su procedencia."
  );
  const reglas = document.querySelectorAll(".seguimiento-v2-alert li");
  if (reglas[0]) {
    reglas[0].querySelector("strong")?.replaceChildren("Fuentes trazables");
    reglas[0].querySelector("span")?.replaceChildren("Nunca se pierde la capa fuente que dio origen al resultado consolidado.");
  }
  if (reglas[1]) {
    reglas[1].querySelector("strong")?.replaceChildren("Seccionales con precedencia");
    reglas[1].querySelector("span")?.replaceChildren("El seccional reemplaza la normativa PRC anterior dentro de su cobertura cuando corresponde jurídicamente.");
  }
  if (reglas[2]) {
    reglas[2].querySelector("strong")?.replaceChildren("Overlay normativo");
    reglas[2].querySelector("span")?.replaceChildren("Riesgo, ZNE, edificación y otras capas pueden coexistir en la capa analítica final manteniendo campos de origen separados.");
  }

  setText(
    ".seguimiento-legacy-panel > div:first-child p",
    "El inventario conserva los envíos históricos como antecedente, pero el estado operativo actual se determina por los archivos y avances vigentes del equipo."
  );

  setText(
    ".seguimiento-direct-panel .seguimiento-filter-heading p:not(.eyebrow)",
    "Estos casos pueden evitar una comparación extensa de actos posteriores, pero igualmente deben pasar por el pipeline vigente, el cierre *_ACTUALIZADO.gpkg y su QA correspondiente."
  );
  setText(
    ".seguimiento-direct-note",
    "Sin cambios posteriores no significa QA aprobado: todavía exige geometría válida, normativa trazable y cierre final en EPSG:4326."
  );

  const leyendas = document.querySelectorAll(".seguimiento-internal-legend > div");
  if (leyendas[0]) {
    leyendas[0].querySelector("strong")?.replaceChildren("Estado de producción PRC");
    leyendas[0].querySelector("p")?.replaceChildren("Pendiente, En desarrollo, Actualizado o Enviado. La presencia de *_ACTUALIZADO.gpkg activa automáticamente Actualizado.");
  }
})();

// Inventario físico separado del estado operativo. El inventario puede
// regenerarse desde OneDrive/SharePoint sin pisar responsable ni QA manual.
(() => {
  const mergeInventory = () => {
    const inventario = window.INVENTARIO_PRI_PRM_ONEDRIVE;
    const estado = window.ESTADO_PRI_PRM;
    if (!inventario || !estado || !Array.isArray(inventario.instrumentos)) return;

    estado.fuentes_detectadas = Array.isArray(inventario.fuentes)
      ? inventario.fuentes.map(item => ({
          region: item.region,
          carpeta_tipo: item.tipo,
          ruta: item.carpeta,
          evidencia: item.evidencia,
          clasificacion: item.clasificacion
        }))
      : estado.fuentes_detectadas;

    inventario.instrumentos.forEach(auto => {
      let item = estado.instrumentos.find(actual => actual.id === auto.id);
      if (!item) {
        item = {
          id: auto.id,
          nombre: auto.nombre_detectado || `${auto.tipo} ${auto.region}`,
          sigla: auto.tipo,
          tipo: auto.tipo,
          region: auto.region,
          ambito: auto.tipo === "PRI" ? "Intercomunal" : "Metropolitano",
          comunas: [],
          estado_produccion: "pendiente",
          responsable: "",
          qa: "pendiente"
        };
        estado.instrumentos.push(item);
      }

      item.archivo = auto.archivo_seleccionado || item.archivo;
      item.ruta_relativa = auto.ruta_relativa || item.ruta_relativa;
      item.fecha_archivo = auto.fecha_archivo || item.fecha_archivo;
      item.fuente_inventario = "SharePoint / OneDrive";

      if (auto.estado_detectado === "actualizado" && item.estado_produccion !== "enviado") {
        item.estado_produccion = "actualizado";
        item.fuente_estado = "archivo_actualizado_automatico";
      }
      if (auto.estado_detectado === "enviado") {
        item.estado_produccion = "enviado";
        item.fuente_estado = "archivo_enviado_detectado";
      }
    });

    const buscador = document.getElementById("priSearch");
    if (buscador) buscador.dispatchEvent(new Event("input"));
  };

  if (window.INVENTARIO_PRI_PRM_ONEDRIVE) {
    mergeInventory();
    return;
  }

  const script = document.createElement("script");
  script.src = `data/inventario_pri_prm_onedrive.js?v=${Date.now()}`;
  script.onload = mergeInventory;
  document.head.appendChild(script);
})();
