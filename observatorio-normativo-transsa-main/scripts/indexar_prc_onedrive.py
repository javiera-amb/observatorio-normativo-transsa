#!/usr/bin/env python3
"""Indexa PRC almacenados en OneDrive y publica solo rutas relativas.

El navegador no puede leer ``C:\\``. Este script se ejecuta localmente, valida
la estructura básica de cada archivo SIG y genera el inventario consumido por
GitHub Pages.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EXTENSIONES_ESPACIALES = {".gpkg", ".shp", ".geojson", ".json", ".kml", ".kmz", ".zip"}
EXTENSIONES_NORMATIVAS = {".csv", ".xlsx", ".parquet"}
ESTADOS = {
    "pendiente": "pendiente",
    "en desarrollo": "en_desarrollo",
    "en proceso": "en_desarrollo",
    "actualizado": "actualizado",
    "actualizada": "actualizado",
    "enviado": "enviado",
    "enviada": "enviado",
}
ESTANDAR_DEFAULT = Path("config/estandar_prc_tui_v2.json")


def normalizar(valor: str) -> str:
    salida = unicodedata.normalize("NFD", str(valor or ""))
    salida = "".join(c for c in salida if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", salida.lower()).strip()


def es_segmento_prc(valor: str) -> bool:
    """Reconoce PRC aunque la carpeta use prefijos como ``01_PRC``."""
    return "prc" in normalizar(valor).split()


def seleccionar_archivos_prc(archivos: list[Path], raiz: Path) -> tuple[list[Path], int]:
    """Evita mezclar PRI, PRM u otros IPT cuando la raíz es nacional.

    La compatibilidad se conserva para estructuras antiguas dedicadas
    exclusivamente a PRC que no incluían un segmento llamado ``PRC``.
    """
    bajo_prc = [
        archivo for archivo in archivos
        if any(es_segmento_prc(parte) for parte in archivo.relative_to(raiz).parts[:-1])
    ]
    if not bajo_prc:
        return archivos, 0
    return bajo_prc, len(archivos) - len(bajo_prc)


def sha256(ruta: Path) -> str:
    digest = hashlib.sha256()
    with ruta.open("rb") as archivo:
        for bloque in iter(lambda: archivo.read(1024 * 1024), b""):
            digest.update(bloque)
    return digest.hexdigest()


def detectar_estado(nombre: str) -> str | None:
    limpio = normalizar(Path(nombre).stem)
    for etiqueta, codigo in ESTADOS.items():
        if limpio == etiqueta or limpio.endswith(" " + etiqueta):
            return codigo
    return None


def detectar_modelo(nombre: str) -> str:
    limpio = normalizar(Path(nombre).stem)
    if re.search(r"(?:^| )(?:tui )?v(?:ersion )? ?2(?: |$)", limpio):
        return "tui_v2"
    return "sin_clasificar"


def contiene_token(campo: str, tokens: list[str]) -> bool:
    limpio = normalizar(campo)
    return any(normalizar(token) in limpio for token in tokens)


def leer_tabla_normativa(ruta: Path, estandar: dict[str, Any]) -> dict[str, Any]:
    """Controla el archivo tabular que se cargará como tabla normativa SQL."""
    salida: dict[str, Any] = {
        "archivo": ruta.name,
        "formato": ruta.suffix.lower().lstrip(".").upper(),
        "valido": False,
        "columnas": [],
        "registros": None,
    }
    try:
        if ruta.suffix.lower() == ".csv":
            with ruta.open("r", encoding="utf-8-sig", newline="") as archivo:
                muestra = archivo.read(8192)
                archivo.seek(0)
                dialecto = csv.Sniffer().sniff(muestra, delimiters=",;\t|") if muestra else csv.excel
                lector = csv.reader(archivo, dialecto)
                columnas = next(lector, [])
                registros = sum(1 for _ in lector)
        else:
            import pandas as pd

            if ruta.suffix.lower() == ".xlsx":
                tabla = pd.read_excel(ruta)
            else:
                tabla = pd.read_parquet(ruta)
            columnas = [str(columna) for columna in tabla.columns]
            registros = int(len(tabla))
        claves = [
            campo for campo in columnas
            if contiene_token(campo, estandar.get("campos_union_candidatos", ["unidad_normativa_id"]))
        ]
        minimo = int(estandar.get("minimo_campos_tabla_normativa", 2))
        bloqueos = []
        if len(columnas) < minimo:
            bloqueos.append(f"La tabla normativa debe contener al menos {minimo} campos.")
        if not claves:
            bloqueos.append("La tabla normativa no contiene una clave de unión reconocible, idealmente unidad_normativa_id.")
        if registros == 0:
            bloqueos.append("La tabla normativa no contiene registros.")
        salida.update({
            "valido": not bloqueos,
            "columnas": columnas,
            "registros": registros,
            "campos_union_detectados": claves,
            "bloqueos": bloqueos,
        })
    except ImportError:
        salida["error"] = "Falta pandas/openpyxl/pyarrow para leer la tabla normativa."
    except Exception as exc:
        salida["error"] = f"{type(exc).__name__}: {exc}"
    return salida


def seleccionar_tabla_normativa(ruta_espacial: Path, candidatas: list[Path]) -> Path | None:
    """Selecciona el respaldo tabular más reciente dentro de la carpeta comunal."""
    if not candidatas:
        return None
    tokens_espacial = set(normalizar(ruta_espacial.stem).split()) - {
        "gpkg", "shape", "geometria", "geometrias", "actualizado", "enviado", "pendiente", "desarrollo"
    }

    def puntaje(ruta: Path) -> tuple[int, int, float, str]:
        limpio = normalizar(ruta.stem)
        tokens = set(limpio.split())
        return (
            int("normativa" in tokens or "atributos" in tokens),
            len(tokens_espacial & tokens),
            ruta.stat().st_mtime,
            ruta.name,
        )

    return max(candidatas, key=puntaje)


def validar_geometrias(ruta: Path, tablas: list[str]) -> dict[str, Any]:
    try:
        import geopandas as gpd
    except ImportError:
        return {
            "estado": "no_ejecutado",
            "valido": None,
            "detalle": "Geopandas no está instalado; ejecute INSTALAR_SINCRONIZACION_TUI.bat.",
            "capas": [],
        }
    capas = []
    for tabla in tablas:
        try:
            gdf = gpd.read_file(ruta, layer=tabla)
            geometria = gdf.geometry
            nulas = int(geometria.isna().sum())
            vacias = int(geometria.is_empty.sum())
            invalidas = int((~geometria.is_valid & geometria.notna() & ~geometria.is_empty).sum())
            capas.append({
                "tabla": tabla,
                "crs": str(gdf.crs) if gdf.crs else None,
                "registros": int(len(gdf)),
                "geometrias_nulas": nulas,
                "geometrias_vacias": vacias,
                "geometrias_invalidas": invalidas,
                "tipos_geometria": sorted(str(valor) for valor in geometria.geom_type.dropna().unique()),
                "valido": bool(gdf.crs) and nulas == 0 and vacias == 0 and invalidas == 0,
            })
        except Exception as exc:
            capas.append({"tabla": tabla, "valido": False, "error": f"{type(exc).__name__}: {exc}"})
    return {
        "estado": "ejecutado",
        "valido": bool(capas) and all(capa.get("valido") for capa in capas),
        "capas": capas,
    }


def validar_gpkg(
    ruta: Path,
    estandar: dict[str, Any],
    modelo: str,
    tabla_normativa: Path | None = None,
) -> dict[str, Any]:
    salida: dict[str, Any] = {"formato": "GeoPackage", "valido": False, "capas": []}
    try:
        conexion = sqlite3.connect(ruta.resolve().as_uri() + "?mode=ro", uri=True)
        try:
            integridad = conexion.execute("PRAGMA quick_check").fetchone()[0]
            tablas = conexion.execute(
                "SELECT table_name, data_type, identifier FROM gpkg_contents ORDER BY table_name"
            ).fetchall()
            columnas_geometria = {
                tabla: columna for tabla, columna in conexion.execute(
                    "SELECT table_name, column_name FROM gpkg_geometry_columns"
                ).fetchall()
            }
            capas = []
            for tabla, tipo, identificador in tablas:
                tabla_sql = tabla.replace('"', '""')
                columnas = [fila[1] for fila in conexion.execute(f'PRAGMA table_info("{tabla_sql}")')]
                cantidad = conexion.execute(f'SELECT COUNT(*) FROM "{tabla_sql}"').fetchone()[0]
                geometria = columnas_geometria.get(tabla)
                atributos = [campo for campo in columnas if campo not in {geometria, "fid", "ogc_fid"}]
                campos_zona = [campo for campo in atributos if contiene_token(campo, estandar["campos_zona_candidatos"])]
                campos_uso = [campo for campo in atributos if contiene_token(campo, estandar["campos_uso_candidatos"])]
                campos_union = [
                    campo for campo in atributos
                    if contiene_token(campo, estandar.get("campos_union_candidatos", ["unidad_normativa_id"]))
                ]
                campos_riesgo = [campo for campo in atributos if contiene_token(campo, estandar["tokens_riesgo"])]
                capas.append({
                    "tabla": tabla,
                    "tipo": tipo,
                    "identificador": identificador,
                    "registros": cantidad,
                    "columnas": columnas,
                    "columna_geometria": geometria,
                    "campos_atributo": atributos,
                    "campos_zona_candidatos": campos_zona,
                    "campos_uso_candidatos": campos_uso,
                    "campos_union_candidatos": campos_union,
                    "campos_riesgo_detectados": campos_riesgo,
                })
            espaciales = [capa for capa in capas if capa["tipo"] == "features"]
            principal = max(
                espaciales,
                key=lambda capa: (
                    bool(capa["campos_zona_candidatos"]),
                    bool(capa["campos_union_candidatos"]),
                    capa["registros"],
                ),
                default=None,
            )
            geometria_identificada = bool(
                principal
                and len(principal["campos_atributo"]) >= estandar["minimo_atributos_no_geometricos"]
                and principal["campos_zona_candidatos"]
                and principal["campos_union_candidatos"]
            )
            qa_tabla_normativa = leer_tabla_normativa(tabla_normativa, estandar) if tabla_normativa else {
                "archivo": None,
                "valido": False,
                "columnas": [],
                "registros": None,
                "bloqueos": ["No se encontró la tabla normativa separada."],
            }
            qa_geometria = validar_geometrias(ruta, [capa["tabla"] for capa in espaciales])
            bloqueos = []
            if modelo != "tui_v2":
                bloqueos.append("El nombre no declara el estándar TUI_V2.")
            if not geometria_identificada:
                bloqueos.append("La capa principal no contiene identificación de zona y una clave de unión normativa.")
            if not qa_tabla_normativa.get("valido"):
                bloqueos.extend(qa_tabla_normativa.get("bloqueos") or [
                    "Falta una tabla normativa separada válida y vinculable por unidad_normativa_id."
                ])
            if qa_geometria["valido"] is False:
                bloqueos.append("Existen geometrías nulas, vacías, inválidas o sin CRS.")
            elif qa_geometria["valido"] is not True:
                bloqueos.append("El control geométrico no se ejecutó; faltan dependencias geoespaciales.")
            if not espaciales:
                bloqueos.append("El GeoPackage no contiene una capa espacial.")
            salida.update({
                "valido": integridad == "ok" and bool(espaciales),
                "integridad": integridad,
                "capas": capas,
                "capa_principal_detectada": principal["tabla"] if principal else None,
                "geometria_identificada": geometria_identificada,
                "tabla_normativa_separada": qa_tabla_normativa,
                "requiere_homologacion_usos": not bool(
                    qa_tabla_normativa.get("columnas")
                    and any(contiene_token(campo, estandar["campos_uso_candidatos"]) for campo in qa_tabla_normativa["columnas"])
                ),
                "qa_geometria": qa_geometria,
                "estandar_tui_v2": {
                    "modelo_detectado": modelo,
                    "cumple_estructura": not bloqueos,
                    "bloqueos": bloqueos,
                    "control_interseccion_riesgos": "observado_v1" if modelo != "tui_v2" else "pendiente_comparacion_con_fuente_normativa",
                    "regla": estandar["reglas"]["geometria_zonificacion"],
                },
            })
        finally:
            conexion.close()
    except Exception as exc:
        salida["error"] = f"{type(exc).__name__}: {exc}"
    return salida


def validar_shp(ruta: Path) -> dict[str, Any]:
    componentes = {extension: ruta.with_suffix(extension).exists() for extension in (".shp", ".shx", ".dbf", ".prj")}
    return {
        "formato": "Shapefile",
        "valido": all(componentes.values()),
        "componentes": componentes,
        "error": None if all(componentes.values()) else "Faltan componentes obligatorios del shapefile.",
    }


def validar(
    ruta: Path,
    estandar: dict[str, Any],
    modelo: str,
    tabla_normativa: Path | None = None,
) -> dict[str, Any]:
    if ruta.suffix.lower() == ".gpkg":
        return validar_gpkg(ruta, estandar, modelo, tabla_normativa)
    if ruta.suffix.lower() == ".shp":
        return validar_shp(ruta)
    return {"formato": ruta.suffix.lower().lstrip(".").upper(), "valido": True, "control": "existencia"}


def contexto(ruta: Path, raiz: Path) -> dict[str, str | None]:
    partes = list(ruta.relative_to(raiz).parts)
    indice_prc = next((i for i, parte in enumerate(partes[:-1]) if es_segmento_prc(parte)), None)
    if indice_prc is None:
        return {"region": partes[0] if partes else None, "tipo_ipt": None, "comuna": ruta.parent.name}
    return {
        "region": partes[indice_prc - 1] if indice_prc > 0 else None,
        "tipo_ipt": partes[indice_prc],
        "comuna": partes[indice_prc + 1] if len(partes) > indice_prc + 2 else ruta.parent.name,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Indexa los PRC locales de OneDrive.")
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--salida", type=Path, default=Path("data/inventario_prc_onedrive.js"))
    parser.add_argument("--estandar", type=Path, default=ESTANDAR_DEFAULT)
    args = parser.parse_args()
    raiz = args.root.expanduser().resolve()
    if not raiz.is_dir():
        raise SystemExit(f"No existe la carpeta PRC: {raiz}")
    estandar = json.loads(args.estandar.read_text(encoding="utf-8"))

    archivos = []
    estados: Counter[str] = Counter()
    tablas_normativas = sorted(
        archivo for archivo in raiz.rglob("*")
        if archivo.is_file() and archivo.suffix.lower() in EXTENSIONES_NORMATIVAS
    )
    archivos_espaciales = sorted(
        archivo for archivo in raiz.rglob("*")
        if archivo.is_file() and archivo.suffix.lower() in EXTENSIONES_ESPACIALES
    )
    archivos_espaciales, archivos_no_prc_ignorados = seleccionar_archivos_prc(
        archivos_espaciales,
        raiz,
    )
    tablas_por_carpeta: dict[Path, list[Path]] = {}
    for tabla in tablas_normativas:
        tablas_por_carpeta.setdefault(tabla.parent, []).append(tabla)
    for ruta in archivos_espaciales:
        datos_contexto = contexto(ruta, raiz)
        estado = detectar_estado(ruta.name)
        modelo = detectar_modelo(ruta.name)
        tabla_normativa = seleccionar_tabla_normativa(ruta, tablas_por_carpeta.get(ruta.parent, []))
        if estado:
            estados[estado] += 1
        stat = ruta.stat()
        archivos.append({
            **datos_contexto,
            "archivo": ruta.name,
            "ruta_relativa": ruta.relative_to(raiz).as_posix(),
            "estado_detectado": estado,
            "modelo_detectado": modelo,
            "modificado_en": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(timespec="seconds"),
            "tamano_bytes": stat.st_size,
            "sha256": sha256(ruta),
            "tabla_normativa": tabla_normativa.relative_to(raiz).as_posix() if tabla_normativa else None,
            "qa_archivo": validar(ruta, estandar, modelo, tabla_normativa),
        })

    por_comuna: dict[str, list[dict[str, Any]]] = {}
    for archivo in archivos:
        clave = f"{archivo.get('region') or ''}|{archivo.get('comuna') or ''}"
        por_comuna.setdefault(clave, []).append(archivo)
    comunas = {}
    for clave, candidatos in por_comuna.items():
        seleccion = max(candidatos, key=lambda item: (
            item["modelo_detectado"] == "tui_v2",
            item["modificado_en"],
            item["archivo"],
        ))
        comunas[clave] = {
            "archivo_seleccionado": seleccion["archivo"],
            "ruta_relativa": seleccion["ruta_relativa"],
            "estado_detectado": seleccion["estado_detectado"],
            "modelo_detectado": seleccion["modelo_detectado"],
            "tabla_normativa": seleccion.get("tabla_normativa"),
            "qa_archivo": seleccion["qa_archivo"],
            "versiones_encontradas": len(candidatos),
        }

    salida = {
        "schema_version": 3,
        "generado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "almacenamiento": "OneDrive Transsa; se publican rutas relativas, nunca la ruta C: del usuario.",
        "estandar_prc": estandar,
        "resumen": {
            "archivos": len(archivos),
            "tablas_normativas": len(tablas_normativas),
            "comunas": len(comunas),
            "estados_detectados": dict(estados),
            "archivos_tui_v2": sum(archivo["modelo_detectado"] == "tui_v2" for archivo in archivos),
            "archivos_sin_clasificar": sum(archivo["modelo_detectado"] != "tui_v2" for archivo in archivos),
            "archivos_no_prc_ignorados": archivos_no_prc_ignorados,
            "archivos_tui_v2_estructura_ok": sum(
                archivo["modelo_detectado"] == "tui_v2"
                and archivo["qa_archivo"].get("estandar_tui_v2", {}).get("cumple_estructura")
                for archivo in archivos
            ),
        },
        "comunas": comunas,
        "archivos": archivos,
    }
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(
        "window.INVENTARIO_PRC_ONEDRIVE = " + json.dumps(salida, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Inventario generado: {args.salida} · archivos={len(archivos)} · comunas={len(comunas)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
