#!/usr/bin/env python3
"""Crea en OneDrive la estructura trazable para capas territoriales."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path


def slug(valor: str) -> str:
    texto = unicodedata.normalize("NFD", valor)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_")


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepara las carpetas de FUENTES_TUI.")
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--manifest", type=Path, default=Path("config/capas_territoriales_fuentes.json"))
    args = parser.parse_args()
    raiz = args.root.expanduser().resolve()
    raiz.mkdir(parents=True, exist_ok=True)
    estructura_tui = (
        "00_LIMITES Y ESCALAS/00_Comunas",
        "00_LIMITES Y ESCALAS/01_Manzanas",
        "00_LIMITES Y ESCALAS/02_Predios",
        "01_IPT",
        "02_CAPAS_TERRITORIALES/01_NORMATIVA_RESTRICCIONES",
        "02_CAPAS_TERRITORIALES/02_MOVILIDAD_TRANSPORTE",
        "02_CAPAS_TERRITORIALES/03_EQUIPAMIENTO_SERVICIOS",
        "02_CAPAS_TERRITORIALES/04_INFRAESTRUCTURA",
        "02_CAPAS_TERRITORIALES/05_DEMOGRAFIA_TEJIDO_URBANO",
        "02_CAPAS_TERRITORIALES/06_MEDIO_AMBIENTE_RIESGOS",
        "02_CAPAS_TERRITORIALES/07_PROPIEDAD_BASE_TERRITORIAL",
        "02_CAPAS_TERRITORIALES/08_COMPLEMENTARIAS_NO_NORMATIVAS",
        "90_RESULTADOS/01_catalogo",
        "90_RESULTADOS/02_cruces",
    )
    for relativa in estructura_tui:
        (raiz / relativa).mkdir(parents=True, exist_ok=True)
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    categorias = manifest.get("categorias", {})
    por_capa = {
        capa: categoria
        for categoria, capas in categorias.items()
        for capa in capas
    }
    for nombre, configuracion in manifest["capas"].items():
        categoria = por_capa.get(nombre, "99_Por_Clasificar")
        if nombre == "División Político Comunal":
            # La capa maestra queda directamente en la ruta definida por el
            # equipo; no se crea una estructura paralela para este archivo.
            carpeta = raiz / "00_LIMITES Y ESCALAS" / "00_Comunas"
            etapas = ()
        else:
            carpeta = raiz / categoria / slug(nombre)
            etapas = ("00_fuente_original", "01_trabajo_transsa", "02_qa", "03_para_cruce")
        for etapa in etapas:
            (carpeta / etapa).mkdir(parents=True, exist_ok=True)
        metadata = carpeta / "metadata.json"
        if not metadata.exists():
            metadata.write_text(json.dumps({
                "nombre": nombre,
                "categoria": categoria,
                "tipo_origen": "por_definir",
                "fuente_original": "",
                "url_fuente": "",
                "licencia": "por_verificar",
                "fecha_dato": "",
                "transformacion_transsa": "",
                "responsable": "",
                "estado_equipo": "pendiente",
                "qa": "pendiente",
                "archivos_esperados": configuracion.get("archivos", []),
                "nota": "Ejemplo tipo_origen: oficial_publica, scraping_publico, interna_transsa o mixta. Documentar aquí las correcciones Transsa.",
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Estructura FUENTES_TUI preparada en {raiz} · capas={len(manifest['capas'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
