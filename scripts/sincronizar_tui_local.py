#!/usr/bin/env python3
"""Sincroniza OneDrive con los datos estáticos publicados por GitHub Pages."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def expandir(valor: str) -> Path:
    return Path(os.path.expandvars(valor)).expanduser()


def ejecutar(*argumentos: str) -> None:
    subprocess.run([sys.executable, *argumentos], cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Indexa PRC y cruza capas territoriales TUI.")
    parser.add_argument("--config", type=Path, default=ROOT / "_local" / "rutas_tui.json")
    parser.add_argument("--solo-preparar", action="store_true")
    parser.add_argument("--borradores", type=Path, help="CSV descargado desde el tablero del equipo.")
    args = parser.parse_args()
    if not args.config.exists():
        raise SystemExit(
            f"Falta {args.config}. Copie config/rutas_tui.example.json a _local/rutas_tui.json."
        )
    config = json.loads(args.config.read_text(encoding="utf-8"))
    prc_root = expandir(config["prc_root"])
    capas_root = expandir(config["capas_root"])
    limite = capas_root / "00_LIMITES Y ESCALAS" / "00_Comunas" / "Comunas_SII-Transsa.gpkg"

    if args.borradores:
        ejecutar("scripts/importar_borradores_seguimiento.py", str(args.borradores))
    ejecutar("scripts/preparar_fuentes_tui.py", "--root", str(capas_root))
    ejecutar("scripts/indexar_prc_onedrive.py", "--root", str(prc_root))
    if args.solo_preparar:
        return 0
    if not limite.exists():
        raise SystemExit(
            f"Falta el límite comunal para ejecutar cobertura: {limite}. "
            "La estructura e inventario PRC sí quedaron preparados."
        )
    ejecutar(
        "scripts/cruzar_capas_por_comuna.py",
        "--comunas", str(limite),
        "--fuentes-dir", str(capas_root),
    )
    print("Sincronización terminada. Revise git diff antes de publicar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
