#!/usr/bin/env python3
"""Incorpora a Git los estados exportados desde el tablero del equipo."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


ESTADOS = {"pendiente", "en_desarrollo", "actualizado", "enviado"}
RESPONSABLES = {"Cristóbal", "Annabel", "Fernanda", "Javiera"}
PREFIJO = "window.ESTADO_EQUIPO_VERSIONADO = "


def leer_estado(ruta: Path) -> dict:
    if not ruta.exists():
        return {"schema_version": 1, "actualizado_en": None, "comunas": {}, "historial": []}
    texto = ruta.read_text(encoding="utf-8-sig").strip()
    if not texto.startswith(PREFIJO) or not texto.endswith(";"):
        raise SystemExit(f"Formato no reconocido: {ruta}")
    return json.loads(texto[len(PREFIJO):-1])


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa borradores_seguimiento_prc.csv.")
    parser.add_argument("csv", type=Path)
    parser.add_argument("--salida", type=Path, default=Path("data/estado_equipo_versionado.js"))
    args = parser.parse_args()
    estado = leer_estado(args.salida)
    ahora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    importados = 0
    with args.csv.open("r", encoding="utf-8-sig", newline="") as archivo:
        lector = csv.DictReader(archivo, delimiter=";")
        requeridos = {"region", "comuna", "responsable", "estado_produccion", "fecha_estado"}
        faltantes = requeridos - set(lector.fieldnames or [])
        if faltantes:
            raise SystemExit(f"Faltan columnas: {', '.join(sorted(faltantes))}")
        for fila in lector:
            region = (fila.get("region") or "").strip()
            comuna = (fila.get("comuna") or "").strip()
            responsable = (fila.get("responsable") or "").strip()
            produccion = (fila.get("estado_produccion") or "").strip()
            fecha = (fila.get("fecha_estado") or "").strip()
            if not region or not comuna:
                continue
            if produccion not in ESTADOS:
                raise SystemExit(f"Estado inválido para {comuna}: {produccion!r}")
            if responsable and responsable not in RESPONSABLES:
                raise SystemExit(f"Responsable inválido para {comuna}: {responsable!r}")
            clave = f"{region}|{comuna}"
            registro = {
                "estado_produccion": produccion,
                "fecha_estado": fecha or ahora[:10],
                **({"responsable": responsable} if responsable else {}),
            }
            estado["comunas"][clave] = registro
            estado["historial"].append({"clave": clave, **registro, "importado_en": ahora})
            importados += 1
    estado["actualizado_en"] = ahora
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.write_text(PREFIJO + json.dumps(estado, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Estados incorporados: {importados} · salida={args.salida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
