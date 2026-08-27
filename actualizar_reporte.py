#!/usr/bin/env python3
"""
Agrega un reporte al portal y, opcionalmente, lo publica en Cloudflare Pages.

Uso:
  python actualizar_reporte.py nuevo_reporte.json
  python actualizar_reporte.py nuevo_reporte.json --publicar

El JSON debe incluir:
fecha, titulo, estado, escala, categoria, region, comuna, organismo,
tipo_norma, numero, resumen, implicancia, impactados
"""

from __future__ import annotations
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "reportes.js"

REQUIRED = [
    "fecha", "titulo", "estado", "escala", "categoria", "region", "comuna",
    "organismo", "tipo_norma", "numero", "resumen", "implicancia", "impactados"
]

def load_reports() -> list[dict]:
    raw = DATA_FILE.read_text(encoding="utf-8").strip()
    prefix = "window.REPORTES = "
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError("El archivo data/reportes.js no tiene el formato esperado.")
    return json.loads(raw[len(prefix):-1])

def save_reports(items: list[dict]) -> None:
    items.sort(key=lambda item: item["fecha"], reverse=True)
    DATA_FILE.write_text(
        "window.REPORTES = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8"
    )

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("reporte_json", type=Path)
    parser.add_argument("--publicar", action="store_true")
    parser.add_argument("--proyecto", default="observatorio-normativo")
    args = parser.parse_args()

    try:
        nuevo = json.loads(args.reporte_json.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Error leyendo el JSON: {exc}", file=sys.stderr)
        return 1

    missing = [key for key in REQUIRED if key not in nuevo]
    if missing:
        print("Faltan campos obligatorios: " + ", ".join(missing), file=sys.stderr)
        return 1

    reports = load_reports()
    duplicate = any(
        r.get("fecha") == nuevo.get("fecha")
        and r.get("titulo", "").strip().lower() == nuevo.get("titulo", "").strip().lower()
        for r in reports
    )
    if duplicate:
        print("Ese reporte ya existe. No se agregó un duplicado.")
        return 0

    nuevo.setdefault("destacado", False)
    reports.append(nuevo)
    save_reports(reports)
    print(f"Reporte agregado: {nuevo['fecha']} - {nuevo['titulo']}")

    if args.publicar:
        command = [
            "npx", "wrangler", "pages", "deploy", str(ROOT),
            "--project-name", args.proyecto
        ]
        print("Publicando en Cloudflare Pages...")
        try:
            subprocess.run(command, check=True, cwd=ROOT)
        except FileNotFoundError:
            print("No se encontró npx. Instala Node.js y vuelve a intentar.", file=sys.stderr)
            return 2
        except subprocess.CalledProcessError as exc:
            print(f"La publicación falló: {exc}", file=sys.stderr)
            return exc.returncode or 3

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
