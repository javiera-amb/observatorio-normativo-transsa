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


def resolver_limite_comunal(capas_root: Path, configurado: str = "") -> Path:
    carpeta = capas_root / "00_LIMITES Y ESCALAS" / "00_Comunas"
    if configurado:
        candidato = expandir(configurado)
        if candidato.exists():
            return candidato

    preferido = carpeta / "Comunas_SII-Transsa.gpkg"
    if preferido.exists():
        return preferido

    candidatos = sorted(carpeta.glob("*.gpkg"))
    if len(candidatos) == 1:
        return candidatos[0]

    candidatos_comunales = [
        archivo for archivo in candidatos
        if "comun" in archivo.stem.casefold()
    ]
    if len(candidatos_comunales) == 1:
        return candidatos_comunales[0]

    if not candidatos:
        raise SystemExit(
            f"Falta un GeoPackage comunal dentro de {carpeta}. "
            "No es necesario usar un nombre específico."
        )
    nombres = ", ".join(archivo.name for archivo in candidatos)
    raise SystemExit(
        f"Hay más de un GeoPackage posible en {carpeta}: {nombres}. "
        "Defina 'limite_comunal' en _local/rutas_tui.json."
    )


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

    if args.borradores:
        ejecutar("scripts/importar_borradores_seguimiento.py", str(args.borradores))
    ejecutar("scripts/preparar_fuentes_tui.py", "--root", str(capas_root))
    ejecutar("scripts/indexar_prc_onedrive.py", "--root", str(prc_root))
    if args.solo_preparar:
        return 0
    limite = resolver_limite_comunal(capas_root, config.get("limite_comunal", ""))
    print(f"Límite comunal detectado: {limite}")
    ejecutar(
        "scripts/cruzar_capas_por_comuna.py",
        "--comunas", str(limite),
        "--fuentes-dir", str(capas_root),
    )
    print("Sincronización terminada. Revise git diff antes de publicar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
