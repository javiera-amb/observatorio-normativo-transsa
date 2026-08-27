#!/usr/bin/env node
/**
 * Registra en TUI un PRI/PRM versionado llegado desde SharePoint.
 *
 * Convención:
 *   *_ACTUALIZADO.gpkg    => V1 lógica
 *   *_ACTUALIZADO_v2.gpkg => V2
 *   *_ACTUALIZADO_v3.gpkg => V3
 *
 * La versión numérica mayor queda como archivo vigente. Eventos atrasados de
 * versiones menores se conservan en historial pero nunca hacen retroceder TUI.
 */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const ARCHIVO_DATOS = "data/estado_pri_prm.js";
const MARCADOR = "// Limpieza de textos heredados";
const PATRON = /_ACTUALIZADO(?:_v(\d+))?\.gpkg$/i;

const args = Object.fromEntries(
  process.argv.slice(2).map((value, index, all) => {
    if (!value.startsWith("--")) return null;
    const key = value.slice(2);
    return [key, all[index + 1] && !all[index + 1].startsWith("--") ? all[index + 1] : ""];
  }).filter(Boolean)
);

const archivo = args.archivo || "";
const ruta = (args.ruta || "").replaceAll("\\", "/");
const url = args.url || "";
const modificadoEn = args["modificado-en"] || new Date().toISOString();
const matchVersion = archivo.match(PATRON);
if (!matchVersion) {
  throw new Error(`Archivo ignorado: ${archivo}. Se espera *_ACTUALIZADO.gpkg o *_ACTUALIZADO_vN.gpkg`);
}
const versionNueva = matchVersion[1] ? Number(matchVersion[1]) : 1;

const normalizar = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const extraerVersion = nombre => {
  const m = String(nombre || "").match(PATRON);
  return m ? (m[1] ? Number(m[1]) : 1) : 0;
};

const segmentos = ruta.split("/").filter(Boolean);
const indiceRegion = segmentos.findIndex(item => /^IPT_/i.test(item));
const regionCarpeta = indiceRegion >= 0 ? segmentos[indiceRegion] : "";
const region = (args.region || regionCarpeta.replace(/^IPT_/i, "")).replaceAll("_", " ");

const tipoCarpeta = args.tipo || segmentos.slice(Math.max(0, indiceRegion + 1))
  .find(item => /^(PRI|PRM)/i.test(item)) || "PRI/PRM";
const tipo = String(tipoCarpeta).toUpperCase();

const stem = path.basename(archivo, path.extname(archivo))
  .replace(/_ACTUALIZADO(?:_v\d+)?$/i, "");
const tipoEscapado = tipo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patronPrefijo = new RegExp(`^IPT_\\d+_${tipoEscapado}_`, "i");
const nombreDesdeArchivo = stem.replace(patronPrefijo, "").replaceAll("_", " ").trim();
const nombre = args.nombre || (nombreDesdeArchivo ? `${tipo} ${nombreDesdeArchivo}` : `${tipo} ${region}`);

const contenido = fs.readFileSync(ARCHIVO_DATOS, "utf8");
const posMarcador = contenido.indexOf(MARCADOR);
if (posMarcador < 0) throw new Error(`No se encontró el marcador de compatibilidad en ${ARCHIVO_DATOS}`);

const bloqueDatos = contenido.slice(0, posMarcador).trim();
const sufijo = contenido.slice(posMarcador);
const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(bloqueDatos, contexto);
const datos = contexto.window.ESTADO_PRI_PRM;
if (!datos || !Array.isArray(datos.instrumentos)) throw new Error("Formato ESTADO_PRI_PRM inválido");

const regionNorm = normalizar(region);
const tipoNorm = normalizar(tipo);
const nombreNorm = normalizar(nombreDesdeArchivo || nombre);

let candidatos = datos.instrumentos.filter(item =>
  normalizar(item.region) === regionNorm && normalizar(item.tipo || item.sigla) === tipoNorm
);

let instrumento = candidatos.find(item => {
  const actual = normalizar(item.nombre);
  return nombreNorm && (actual.includes(nombreNorm) || nombreNorm.includes(actual));
});
if (!instrumento && candidatos.length === 1) instrumento = candidatos[0];

if (!instrumento) {
  instrumento = {
    id: `${normalizar(region).replaceAll(" ", "-")}|${tipo.toLowerCase()}|${normalizar(nombre).replaceAll(" ", "-")}`,
    nombre,
    sigla: tipo,
    tipo,
    region,
    ambito: tipo === "PRI" ? "Intercomunal" : "Metropolitano",
    comunas: [],
    responsable: "",
    qa: "pendiente"
  };
  datos.instrumentos.push(instrumento);
}

const versionAnterior = Number(instrumento.version_vigente || extraerVersion(instrumento.archivo));
const historial = Array.isArray(instrumento.versiones) ? [...instrumento.versiones] : [];
const evento = {
  version: versionNueva,
  archivo,
  ruta_relativa: ruta,
  modificado_en: modificadoEn,
  ...(url ? { url_sharepoint: url } : {})
};
const idx = historial.findIndex(item =>
  Number(item?.version) === versionNueva && String(item?.archivo || "").toLowerCase() === archivo.toLowerCase()
);
if (idx >= 0) historial[idx] = { ...historial[idx], ...evento };
else historial.push(evento);
historial.sort((a, b) => Number(a?.version || 0) - Number(b?.version || 0) || String(a?.modificado_en || "").localeCompare(String(b?.modificado_en || "")));

if (!versionAnterior || versionNueva >= versionAnterior) {
  instrumento.archivo = archivo;
  instrumento.ruta_relativa = ruta;
  instrumento.version_vigente = versionNueva;
  instrumento.actualizado_en = modificadoEn;
  instrumento.fecha_estado = String(modificadoEn).slice(0, 10);
  if (url) instrumento.url_sharepoint = url;
}

instrumento.estado_produccion = "actualizado";
instrumento.fuente_estado = "archivo_actualizado_versionado";
instrumento.fuente_inventario = "SharePoint";
instrumento.versiones = historial;
instrumento.versiones_encontradas = new Set(historial.map(item => Number(item?.version || 0)).filter(Boolean)).size;

datos.actualizado_en = String(modificadoEn).slice(0, 10);
datos.ultima_actualizacion_automatica = {
  instrumento_id: instrumento.id,
  archivo_recibido: archivo,
  version_recibida: versionNueva,
  archivo_vigente: instrumento.archivo,
  version_vigente: instrumento.version_vigente,
  ruta,
  fecha: modificadoEn
};

const nuevo = `window.ESTADO_PRI_PRM = ${JSON.stringify(datos, null, 2)};\n\n${sufijo}`;
fs.writeFileSync(ARCHIVO_DATOS, nuevo, "utf8");
console.log(`TUI PRI/PRM: ${instrumento.nombre} -> Actualizado | recibido V${versionNueva} | vigente ${instrumento.archivo}`);
