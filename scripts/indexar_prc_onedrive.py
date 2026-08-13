#!/usr/bin/env python3
"""Indexa PRC almacenados en OneDrive y publica solo rutas relativas.

El navegador no puede leer ``C:\\``. Este script se ejecuta localmente, valida
la estructura básica de cada archivo SIG y genera el inventario consumido por
GitHub Pages.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EXTENSIONES = {".gpkg", ".shp", ".geojson", ".json", ".kml", ".kmz", ".zip", ".parquet"}
ESTADOS = {
    "pendiente": "pendiente",
    "en desarrollo": "en_desarrollo",
    "en proceso": "en_desarrollo",
    "actualizado": "actualizado",
    "actualizada": "actualizado",
    "enviado": "enviado",
    "enviada": "enviado",
}


def normalizar(valor: str) -> str:
    salida = unicodedata.normalize("NFD", str(valor or ""))
    salida = "".join(c for c in salida if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", salida.lower()).strip()


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


def validar_gpkg(ruta: Path) -> dict[str, Any]:
    salida: dict[str, Any] = {"formato": "GeoPackage", "valido": False, "capas": []}
    try:
        conexion = sqlite3.connect(ruta.resolve().as_uri() + "?mode=ro", uri=True)
        try:
            integridad = conexion.execute("PRAGMA quick_check").fetchone()[0]
            tablas = conexion.execute(
                "SELECT table_name, data_type, identifier FROM gpkg_contents ORDER BY table_name"
            ).fetchall()
            capas = []
            for tabla, tipo, identificador in tablas:
                tabla_sql = tabla.replace('"', '""')
                columnas = [fila[1] for fila in conexion.execute(f'PRAGMA table_info("{tabla_sql}")')]
                cantidad = conexion.execute(f'SELECT COUNT(*) FROM "{tabla_sql}"').fetchone()[0]
                campos_uso = [campo for campo in columnas if any(token in normalizar(campo) for token in ("uso", "zona", "destino"))]
                capas.append({
                    "tabla": tabla,
                    "tipo": tipo,
                    "identificador": identificador,
                    "registros": cantidad,
                    "columnas": columnas,
                    "campos_uso_candidatos": campos_uso,
                })
            salida.update({
                "valido": integridad == "ok" and bool(capas),
                "integridad": integridad,
                "capas": capas,
                "requiere_homologacion_usos": not any(capa["campos_uso_candidatos"] for capa in capas),
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


def validar(ruta: Path) -> dict[str, Any]:
    if ruta.suffix.lower() == ".gpkg":
        return validar_gpkg(ruta)
    if ruta.suffix.lower() == ".shp":
        return validar_shp(ruta)
    return {"formato": ruta.suffix.lower().lstrip(".").upper(), "valido": True, "control": "existencia"}


def contexto(ruta: Path, raiz: Path) -> dict[str, str | None]:
    partes = list(ruta.relative_to(raiz).parts)
    indice_prc = next((i for i, parte in enumerate(partes[:-1]) if normalizar(parte) == "prc"), None)
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
    args = parser.parse_args()
    raiz = args.root.expanduser().resolve()
    if not raiz.is_dir():
        raise SystemExit(f"No existe la carpeta PRC: {raiz}")

    archivos = []
    estados: Counter[str] = Counter()
    for ruta in sorted(archivo for archivo in raiz.rglob("*") if archivo.is_file() and archivo.suffix.lower() in EXTENSIONES):
        datos_contexto = contexto(ruta, raiz)
        estado = detectar_estado(ruta.name)
        if estado:
            estados[estado] += 1
        stat = ruta.stat()
        archivos.append({
            **datos_contexto,
            "archivo": ruta.name,
            "ruta_relativa": ruta.relative_to(raiz).as_posix(),
            "estado_detectado": estado,
            "modificado_en": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(timespec="seconds"),
            "tamano_bytes": stat.st_size,
            "sha256": sha256(ruta),
            "qa_archivo": validar(ruta),
        })

    por_comuna: dict[str, list[dict[str, Any]]] = {}
    for archivo in archivos:
        clave = f"{archivo.get('region') or ''}|{archivo.get('comuna') or ''}"
        por_comuna.setdefault(clave, []).append(archivo)
    comunas = {}
    for clave, candidatos in por_comuna.items():
        seleccion = max(candidatos, key=lambda item: (item["modificado_en"], item["archivo"]))
        comunas[clave] = {
            "archivo_seleccionado": seleccion["archivo"],
            "ruta_relativa": seleccion["ruta_relativa"],
            "estado_detectado": seleccion["estado_detectado"],
            "qa_archivo": seleccion["qa_archivo"],
            "versiones_encontradas": len(candidatos),
        }

    salida = {
        "schema_version": 1,
        "generado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "almacenamiento": "OneDrive Transsa; se publican rutas relativas, nunca la ruta C: del usuario.",
        "resumen": {"archivos": len(archivos), "comunas": len(comunas), "estados_detectados": dict(estados)},
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
