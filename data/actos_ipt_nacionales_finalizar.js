(() => {
  "use strict";

  const PORTAL = "https://portalipt.minvu.cl/instrumentos";
  const STANDARD_PART_LENGTH = 10179;
  const FINAL_PART_LENGTH = 10173;
  const REPAIR_FILES = [
    "data/actos_ipt_nacional_09a.js",
    "data/actos_ipt_nacional_09b.js",
    "data/actos_ipt_nacional_09c.js",
    "data/actos_ipt_nacional_09d.js",
    "data/actos_ipt_nacional_09e.js"
  ];

  function decodeBase64(value) {
    const binary = atob(value || "");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function extractFragment(text, source) {
    const matches = [...String(text || "").matchAll(
      /window\.ACTOS_IPT_GZ=\(window\.ACTOS_IPT_GZ\|\|""\)\+("(?:[^"\\]|\\.)*");/g
    )];
    if (!matches.length) {
      throw new Error(`Formato inválido en ${source}`);
    }
    return matches.map(match => JSON.parse(match[1])).join("");
  }

  async function repairNinthPart(payload) {
    const fragments = await Promise.all(
      REPAIR_FILES.map(async source => {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) throw new Error(`No se pudo cargar ${source}: HTTP ${response.status}`);
        return extractFragment(await response.text(), source);
      })
    );

    const correctNinthPart = fragments.join("");
    if (correctNinthPart.length !== STANDARD_PART_LENGTH) {
      throw new Error(`El bloque 9 reconstruido tiene ${correctNinthPart.length} caracteres; se esperaban ${STANDARD_PART_LENGTH}.`);
    }

    const prefix = payload.slice(0, STANDARD_PART_LENGTH * 8);
    const suffix = payload.slice(-FINAL_PART_LENGTH);
    const repaired = `${prefix}${correctNinthPart}${suffix}`;
    if (repaired.length !== STANDARD_PART_LENGTH * 9 + FINAL_PART_LENGTH) {
      throw new Error("La base nacional reconstruida tiene un largo inesperado.");
    }
    return repaired;
  }

  async function decompressRows() {
    if (!window.ACTOS_IPT_GZ) return [];
    if (typeof DecompressionStream === "undefined") {
      throw new Error("El navegador no permite descomprimir la base nacional de actos IPT.");
    }

    const repairedPayload = await repairNinthPart(window.ACTOS_IPT_GZ);
    const bytes = decodeBase64(repairedPayload);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    const rows = JSON.parse(text);
    if (!Array.isArray(rows) || rows.length !== 1784) {
      throw new Error(`La base nacional contiene ${Array.isArray(rows) ? rows.length : 0} actos; se esperaban 1.784.`);
    }
    return rows;
  }

  function buildAct(row) {
    const codes = Array.isArray(row[10]) ? row[10] : [];
    return {
      id: row[0],
      region: row[1] || "",
      comunas: Array.isArray(row[2]) ? row[2] : [],
      nivel_planificacion: row[3] || "",
      tipo_ipt: row[4] || "",
      titulo: row[5] || "Acto sin denominación",
      estado: row[6] || "",
      fecha: row[7] || "",
      fecha_derogacion: row[8] || "",
      fecha_ultimo_hito: row[9] || "",
      codigos_origen_afectados: codes,
      tipo_acto: row[11] || "Modificación",
      modificacion_limite_urbano: row[12] || "",
      eae: row[13] || "",
      fecha_inicio_eae: row[14] || "",
      fecha_termino_eae: row[15] || "",
      consulta_indigena: row[16] || "",
      clasificacion_portal: "Modificación",
      vinculacion_origen: codes.length ? "codigo_origen" : "comuna_region",
      incorporacion_sig: "pendiente_revision",
      estado_revision: "Pendiente de revisión documental y SIG",
      fundamento_revision: "Registro histórico del Portal IPT. Debe verificarse su relación exacta con el instrumento base y su incorporación en la cartografía vigente.",
      fuente_oficial: PORTAL,
      sistema_origen: "Portal IPT",
      cobertura_nacional: true
    };
  }

  window.ACTOS_IPT_NACIONALES_READY = decompressRows()
    .then(rows => {
      const acts = rows.map(buildAct);
      const states = {};
      const types = {};
      acts.forEach(act => {
        states[act.estado || "Sin estado"] = (states[act.estado || "Sin estado"] || 0) + 1;
        types[act.tipo_acto || "Modificación"] = (types[act.tipo_acto || "Modificación"] || 0) + 1;
      });

      window.ACTOS_IPT_NACIONALES = {
        fecha_carga: new Date().toISOString(),
        fuente: "Reporte anual Portal IPT",
        corte_fuente: "2026-07-07",
        resumen: {
          total: acts.length,
          por_estado: states,
          por_tipo: types,
          vinculados_por_codigo: acts.filter(act => act.codigos_origen_afectados.length).length,
          vinculacion_por_comuna_region: acts.filter(act => !act.codigos_origen_afectados.length).length
        },
        actos: acts
      };

      delete window.ACTOS_IPT_GZ;
      return window.ACTOS_IPT_NACIONALES;
    })
    .catch(error => {
      console.error("No se pudo cargar la base nacional de actos IPT:", error);
      window.ACTOS_IPT_NACIONALES = { resumen: { total: 0 }, actos: [], error: error.message };
      return window.ACTOS_IPT_NACIONALES;
    });
})();
