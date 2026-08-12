#!/usr/bin/env python3
"""Construye la matriz real capa × comuna a partir de archivos espaciales.

El resultado no infiere cobertura desde Notion. Una comuna queda como
``con_cobertura`` o ``sin_elementos`` solo después de leer geometrías y ejecutar
la intersección. Las capas sin archivo quedan como ``bloqueada``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

EXTENSIONES = {".gpkg", ".shp", ".geojson", ".json", ".kml", ".kmz", ".zip", ".parquet"}

# Nombres usados por el consolidado web. La geometría conserva el nombre de
# origen en el archivo, pero la clave de salida debe coincidir con la matriz de
# las 346 comunas.
NOMBRES_CANONICOS = {
    "paiguano": "Paihuano",
    "tiltil": "Til Til",
    "alto biobio": "Alto Bio Bio",
    "cholchol": "Chol Chol",
    "coihaique": "Coyhaique",
}

COMUNAS_SIN_GEOMETRIA = [
    {
        "region": "Magallanes y de la Antártica Chilena",
        "comuna": "Antártica",
        "codigo_comuna": "12202",
    }
]


def normalizar(valor: str) -> str:
    texto = unicodedata.normalize("NFD", str(valor or ""))
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", texto.lower()).strip()


def sha256(ruta: Path) -> str:
    digest = hashlib.sha256()
    with ruta.open("rb") as archivo:
        for bloque in iter(lambda: archivo.read(1024 * 1024), b""):
            digest.update(bloque)
    return digest.hexdigest()


def cargar_geopandas():
    try:
        import geopandas as gpd
        import pandas as pd
    except ImportError as exc:
        raise SystemExit(
            "Faltan dependencias geoespaciales. Instale: "
            "pip install -r scripts/requirements_geoespacial.txt"
        ) from exc
    return gpd, pd


def indice_archivos(carpeta: Path) -> list[Path]:
    """Indexa sólo archivos listos para cruce cuando existe la estructura TUI.

    Las carpetas ``00_fuente_original`` y ``01_trabajo_transsa`` se conservan
    para trazabilidad, pero no deben entrar por accidente al cruce nacional.
    Si aún no existe ninguna carpeta ``03_para_cruce`` se mantiene el
    comportamiento anterior y se indexa la carpeta completa, lo que permite
    ejecutar el script con una carpeta plana durante la migración.
    """
    preparadas = [ruta for ruta in carpeta.rglob("03_para_cruce") if ruta.is_dir()]
    raices = preparadas or [carpeta]
    return sorted(
        archivo
        for directorio in raices
        for archivo in directorio.rglob("*")
        if archivo.is_file() and archivo.suffix.lower() in EXTENSIONES
    )


def buscar_archivos(config: dict[str, Any], disponibles: Iterable[Path]) -> list[Path]:
    disponibles = list(disponibles)
    por_nombre = {normalizar(ruta.name): ruta for ruta in disponibles}
    encontrados: list[Path] = []
    for nombre in config.get("archivos", []):
        coincidencia = por_nombre.get(normalizar(nombre))
        if coincidencia and coincidencia not in encontrados:
            encontrados.append(coincidencia)
    if encontrados:
        return encontrados
    for patron in config.get("patrones", []):
        clave = normalizar(patron)
        if not clave:
            continue
        for ruta in disponibles:
            if clave in normalizar(ruta.stem) and ruta not in encontrados:
                encontrados.append(ruta)
    return encontrados


def leer_capas(ruta: Path, gpd) -> list[tuple[str, Any]]:
    if ruta.suffix.lower() == ".parquet":
        return [(ruta.stem, gpd.read_parquet(ruta))]
    try:
        capas = gpd.list_layers(ruta)
        nombres = capas["name"].tolist() if len(capas) else []
    except Exception:
        nombres = []
    if not nombres:
        return [(ruta.stem, gpd.read_file(ruta))]
    salida = []
    for nombre in nombres:
        salida.append((str(nombre), gpd.read_file(ruta, layer=nombre)))
    return salida


def preparar_geometrias(gdf, crs_metrico: str):
    if gdf.crs is None:
        raise ValueError("El archivo no declara sistema de referencia (CRS).")
    limpio = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty].copy()
    if hasattr(limpio.geometry, "make_valid"):
        limpio.geometry = limpio.geometry.make_valid()
    limpio = limpio[limpio.geometry.notna() & ~limpio.geometry.is_empty]
    return limpio.to_crs(crs_metrico)


def preparar_comunas(comunas, campo_codigo: str, campo_comuna: str, campo_region: str, crs_metrico: str):
    comunas = comunas.copy()
    comunas[campo_comuna] = comunas[campo_comuna].map(
        lambda nombre: NOMBRES_CANONICOS.get(normalizar(nombre), nombre)
    )
    comunas = comunas[comunas.geometry.notna() & ~comunas.geometry.is_empty]
    if hasattr(comunas.geometry, "make_valid"):
        comunas.geometry = comunas.geometry.make_valid()
    # El GeoPackage Transsa contiene Santiago, Santiago Sur y Santiago Oeste.
    # Para el monitoreo comunal se disuelven como una sola comuna de Santiago.
    comunas = comunas.dissolve(
        by=[campo_region, campo_comuna],
        as_index=False,
        aggfunc={campo_codigo: "min"},
    )
    return comunas.to_crs(crs_metrico)


def interseccion_significativa(geometria, comuna, tolerancia: float) -> tuple[bool, float, float]:
    inter = geometria.intersection(comuna)
    if inter.is_empty:
        return False, 0.0, 0.0
    tipo = inter.geom_type.lower()
    area = float(inter.area) if "polygon" in tipo else 0.0
    longitud = float(inter.length) if "line" in tipo else 0.0
    if "polygon" in tipo:
        return area > tolerancia, area, 0.0
    if "line" in tipo:
        return longitud > tolerancia, 0.0, longitud
    if "point" in tipo:
        return True, 0.0, 0.0
    return not inter.is_empty, area, longitud


def cruzar_fuentes(
    fuentes: list[Path], comunas_metricas, campo_codigo: str, campo_comuna: str,
    campo_region: str, crs_metrico: str, tolerancia: float, comunas_sin_geometria,
    gpd, pd
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    fragmentos = []
    evidencia = []
    for ruta in fuentes:
        capas_leidas = leer_capas(ruta, gpd)
        evidencia.append({
            "archivo": ruta.name,
            "tamano_bytes": ruta.stat().st_size,
            "sha256": sha256(ruta),
            "subcapas": [nombre for nombre, _ in capas_leidas],
        })
        for nombre_capa, gdf in capas_leidas:
            preparado = preparar_geometrias(gdf, crs_metrico)
            preparado = preparado[[preparado.geometry.name]].copy()
            preparado["_fuente"] = ruta.name
            preparado["_subcapa"] = nombre_capa
            preparado["_fid_origen"] = preparado.index.astype(str)
            fragmentos.append(preparado)

    if not fragmentos:
        raise ValueError("No se encontraron geometrías consumibles.")
    datos = gpd.GeoDataFrame(pd.concat(fragmentos, ignore_index=True), crs=crs_metrico)
    sindex = datos.sindex
    resultados: dict[str, Any] = {}
    for _, fila in comunas_metricas.iterrows():
        geom_comuna = fila.geometry
        candidatos = list(sindex.query(geom_comuna, predicate="intersects"))
        ids = set()
        area_total = 0.0
        longitud_total = 0.0
        for pos in candidatos:
            dato = datos.iloc[int(pos)]
            valido, area, longitud = interseccion_significativa(dato.geometry, geom_comuna, tolerancia)
            if not valido:
                continue
            ids.add((dato["_fuente"], dato["_subcapa"], dato["_fid_origen"]))
            area_total += area
            longitud_total += longitud
        codigo = str(fila[campo_codigo])
        clave = f"{fila[campo_region]}|{fila[campo_comuna]}"
        cantidad = len(ids)
        resultados[clave] = {
            "codigo_comuna": codigo,
            "estado": "con_cobertura" if cantidad else "sin_elementos",
            "elementos": cantidad,
            "area_interseccion_m2": round(area_total, 2),
            "longitud_interseccion_m": round(longitud_total, 2),
        }
    for faltante in comunas_sin_geometria:
        clave = f"{faltante['region']}|{faltante['comuna']}"
        resultados[clave] = {
            "codigo_comuna": faltante["codigo_comuna"],
            "estado": "sin_limite_comunal",
            "elementos": None,
            "area_interseccion_m2": None,
            "longitud_interseccion_m": None,
        }
    return resultados, evidencia


def main() -> int:
    parser = argparse.ArgumentParser(description="Cruza todas las capas territoriales con las comunas de Chile.")
    parser.add_argument("--comunas", required=True, type=Path, help="GeoPackage/SHP/GeoJSON con límites comunales.")
    parser.add_argument("--fuentes-dir", required=True, type=Path, help="Carpeta con los archivos espaciales vigentes.")
    parser.add_argument("--manifest", type=Path, default=Path("config/capas_territoriales_fuentes.json"))
    parser.add_argument("--salida", type=Path, default=Path("data/cobertura_capas_resultados.js"))
    parser.add_argument("--campo-codigo", default="rialcomsii")
    parser.add_argument("--campo-comuna", default="COMUNA")
    parser.add_argument("--campo-region", default="REGION")
    parser.add_argument("--crs-metrico", default="EPSG:6933", help="CRS para eliminar contactos de borde y calcular métricas.")
    parser.add_argument("--tolerancia", type=float, default=1.0, help="Área m² o longitud m mínima para considerar cruce.")
    parser.add_argument("--permitir-conteo-distinto", action="store_true", help="Permite límites con un número distinto de 346 comunas.")
    args = parser.parse_args()

    gpd, pd = cargar_geopandas()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    comunas = gpd.read_file(args.comunas)
    requeridos = [args.campo_codigo, args.campo_comuna, args.campo_region]
    faltantes = [campo for campo in requeridos if campo not in comunas.columns]
    if faltantes:
        raise SystemExit(f"Faltan campos en el límite comunal: {', '.join(faltantes)}")
    comunas_metricas = preparar_comunas(
        comunas, args.campo_codigo, args.campo_comuna, args.campo_region, args.crs_metrico
    )
    total_objetivo = len(comunas_metricas) + len(COMUNAS_SIN_GEOMETRIA)
    if total_objetivo != 346 and not args.permitir_conteo_distinto:
        raise SystemExit(
            f"Se esperaban 346 comunas objetivo y se obtuvieron {total_objetivo} "
            f"({len(comunas_metricas)} con geometría y {len(COMUNAS_SIN_GEOMETRIA)} sin geometría)."
        )
    disponibles = indice_archivos(args.fuentes_dir)
    generado = datetime.now(timezone.utc).isoformat(timespec="seconds")
    salida: dict[str, Any] = {
        "schema_version": 1,
        "generado_en": generado,
        "metodo": "Intersección geométrica capa × comuna; tolerancia de contactos de borde.",
        "limite_comunal": {
            "archivo": args.comunas.name,
            "sha256": sha256(args.comunas),
            "registros_origen": len(comunas),
            "geometrias_comunales": len(comunas_metricas),
            "comunas_objetivo": total_objetivo,
            "comunas_sin_geometria": COMUNAS_SIN_GEOMETRIA,
            "crs_origen": str(comunas.crs),
            "crs_metrico": args.crs_metrico,
        },
        "capas": {},
    }

    for nombre, config in manifest["capas"].items():
        if config.get("estado_fuente") == "no_es_capa":
            salida["capas"][nombre] = {"estado": "no_es_capa", "comunas": {}}
            continue
        fuentes = buscar_archivos(config, disponibles)
        if not fuentes:
            salida["capas"][nombre] = {
                "estado": "bloqueada",
                "motivo": "archivo_no_materializado",
                "archivos_esperados": config.get("archivos", []),
                "comunas": {},
            }
            continue
        try:
            resultados, evidencia = cruzar_fuentes(
                fuentes, comunas_metricas, args.campo_codigo, args.campo_comuna,
                args.campo_region, args.crs_metrico, args.tolerancia,
                COMUNAS_SIN_GEOMETRIA, gpd, pd
            )
            salida["capas"][nombre] = {
                "estado": "procesada",
                "fuentes": evidencia,
                "resumen": {
                    "comunas_con_cobertura": sum(1 for v in resultados.values() if v["estado"] == "con_cobertura"),
                    "comunas_sin_elementos": sum(1 for v in resultados.values() if v["estado"] == "sin_elementos"),
                    "comunas_sin_limite": sum(1 for v in resultados.values() if v["estado"] == "sin_limite_comunal"),
                },
                "comunas": resultados,
            }
        except Exception as exc:  # se conserva el error exacto para QA operativo
            salida["capas"][nombre] = {
                "estado": "error",
                "motivo": f"{type(exc).__name__}: {exc}",
                "archivos": [ruta.name for ruta in fuentes],
                "comunas": {},
            }

    args.salida.parent.mkdir(parents=True, exist_ok=True)
    contenido = "window.COBERTURA_CAPAS_RESULTADOS = " + json.dumps(salida, ensure_ascii=False, indent=2) + ";\n"
    args.salida.write_text(contenido, encoding="utf-8")
    procesadas = sum(1 for capa in salida["capas"].values() if capa["estado"] == "procesada")
    bloqueadas = sum(1 for capa in salida["capas"].values() if capa["estado"] == "bloqueada")
    errores = sum(1 for capa in salida["capas"].values() if capa["estado"] == "error")
    print(f"Matriz generada: {args.salida} · procesadas={procesadas} · bloqueadas={bloqueadas} · errores={errores}")
    return 0 if errores == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
