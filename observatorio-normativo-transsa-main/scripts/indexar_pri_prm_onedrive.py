#!/usr/bin/env python3
"""Indexa carpetas PRI/PRM existentes bajo 00_IPT_Nacional.

Salida: data/inventario_pri_prm_onedrive.js

Reglas:
- Recorre IPT_<Region>/PRI, PRM, PRMS, PRMV, PRMC, PRMVAL, etc.
- No trata cada SHP temático como un instrumento independiente.
- Si una carpeta tiene un único dataset base, usa su nombre para identificarlo.
- Si contiene varias capas (ej. PRMS), registra un instrumento multicapa por carpeta.
- *_ACTUALIZADO.gpkg => estado_detectado = actualizado.
- *_Enviado.gpkg => estado_detectado = enviado.
- El inventario NO define responsable ni QA manual.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path

SALIDA_DEFECTO = Path("data/inventario_pri_prm_onedrive.js")
PREFIJO = "window.INVENTARIO_PRI_PRM_ONEDRIVE = "
EXT_GEOMETRIA = {".gpkg", ".shp"}


def normalizar(texto: str) -> str:
    valor = unicodedata.normalize("NFD", str(texto or ""))
    valor = "".join(c for c in valor if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", valor.lower()).strip("-")


def es_carpeta_intercomunal(nombre: str) -> bool:
    may = str(nombre or "").upper().strip()
    if may == "PRC" or may.startswith("PRDU"):
        return False
    return bool(re.fullmatch(r"PRI|PRM[A-Z0-9_-]*", may))


def buscar_raiz(explicita: str | None) -> Path:
    if explicita:
        raiz = Path(explicita).expanduser().resolve()
        if raiz.name != "00_IPT_Nacional":
            candidata = raiz / "00_IPT_Nacional"
            if candidata.exists():
                raiz = candidata
        if not raiz.exists():
            raise FileNotFoundError(f"No existe: {raiz}")
        return raiz

    home = Path.home()
    candidatos = []
    for base in [home / "OneDrive - Transsa", home / "OneDrive"]:
        if not base.exists():
            continue
        candidatos.extend(base.glob("**/00_IPT_Nacional"))

    candidatos = [p for p in candidatos if p.is_dir()]
    if not candidatos:
        raise FileNotFoundError(
            "No encontré 00_IPT_Nacional automáticamente. Usa --root con la ruta correspondiente."
        )
    candidatos.sort(key=lambda p: ("Cartografía Transsa" not in str(p), len(str(p))))
    return candidatos[0].resolve()


def datasets_base(carpeta: Path) -> list[Path]:
    archivos = [p for p in carpeta.rglob("*") if p.is_file() and p.suffix.lower() in EXT_GEOMETRIA]
    # Si existe GPKG del mismo stem, no duplicar su SHP equivalente.
    gpkg_stems = {p.stem.lower() for p in archivos if p.suffix.lower() == ".gpkg"}
    salida = [p for p in archivos if p.suffix.lower() == ".gpkg" or p.stem.lower() not in gpkg_stems]
    return sorted(salida, key=lambda p: str(p).lower())


def elegir_archivo(archivos: list[Path]) -> tuple[Path | None, str]:
    actualizados = [p for p in archivos if p.suffix.lower() == ".gpkg" and re.search(r"_ACTUALIZADO$", p.stem, re.I)]
    if actualizados:
        return max(actualizados, key=lambda p: p.stat().st_mtime), "actualizado"

    enviados = [p for p in archivos if p.suffix.lower() == ".gpkg" and re.search(r"_Enviado$", p.stem, re.I)]
    if enviados:
        return max(enviados, key=lambda p: p.stat().st_mtime), "enviado"

    gpkg = [p for p in archivos if p.suffix.lower() == ".gpkg"]
    if gpkg:
        return max(gpkg, key=lambda p: p.stat().st_mtime), "pendiente"

    shp = [p for p in archivos if p.suffix.lower() == ".shp"]
    if shp:
        return max(shp, key=lambda p: p.stat().st_mtime), "pendiente"
    return None, "pendiente"


def limpiar_nombre_dataset(stem: str, tipo: str) -> str:
    base = re.sub(r"_ACTUALIZADO$|_Enviado$", "", stem, flags=re.I)
    base = re.sub(rf"^IPT_\d+_{re.escape(tipo)}_", "", base, flags=re.I)
    return re.sub(r"[_-]+", " ", base).strip()


def fecha_archivo(path: Path | None) -> str | None:
    if not path:
        return None
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", help="Ruta a 00_IPT_Nacional o a su carpeta padre")
    parser.add_argument("--output", default=str(SALIDA_DEFECTO))
    args = parser.parse_args()

    raiz = buscar_raiz(args.root)
    salida_path = Path(args.output)
    fuentes: list[dict] = []
    instrumentos: list[dict] = []

    regiones = sorted(
        [p for p in raiz.iterdir() if p.is_dir() and p.name.upper().startswith("IPT_")],
        key=lambda p: p.name.lower(),
    )

    for region_dir in regiones:
        region = region_dir.name[4:].replace("_", " ")
        carpetas = [p for p in region_dir.iterdir() if p.is_dir() and es_carpeta_intercomunal(p.name)]

        for carpeta in sorted(carpetas, key=lambda p: p.name.lower()):
            tipo = carpeta.name.upper()
            archivos = datasets_base(carpeta)
            elegido, estado = elegir_archivo(archivos)

            fuentes.append({
                "id": f"{normalizar(region)}|{normalizar(tipo)}",
                "region": region,
                "tipo": tipo,
                "carpeta": str(carpeta.relative_to(raiz)).replace(os.sep, "/"),
                "cantidad_datasets": len(archivos),
                "evidencia": elegido.name if elegido else "Sin dataset vectorial detectado",
                "clasificacion": "instrumento_identificable" if len(archivos) == 1 else "instrumento_multicapa",
            })

            if len(archivos) == 1 and elegido:
                nombre_detectado = f"{tipo} {limpiar_nombre_dataset(elegido.stem, tipo)}".strip()
                id_nombre = limpiar_nombre_dataset(elegido.stem, tipo)
            else:
                nombre_detectado = f"{tipo} {region}".strip()
                id_nombre = region

            instrumentos.append({
                "id": f"{normalizar(region)}|{normalizar(tipo)}|{normalizar(id_nombre)}",
                "region": region,
                "tipo": tipo,
                "nombre_detectado": nombre_detectado,
                "archivo_seleccionado": elegido.name if elegido else "",
                "ruta_relativa": str((elegido or carpeta).relative_to(raiz)).replace(os.sep, "/"),
                "estado_detectado": estado,
                "fecha_archivo": fecha_archivo(elegido),
                "cantidad_datasets": len(archivos),
            })

    datos = {
        "schema_version": 2,
        "generado_en": datetime.now().isoformat(timespec="seconds"),
        "raiz": "00_IPT_Nacional",
        "raiz_local": str(raiz),
        "criterio": (
            "Inventario físico PRI/PRM. No define responsable ni QA. "
            "Un archivo *_ACTUALIZADO.gpkg activa Actualizado; un *_Enviado.gpkg activa Enviado."
        ),
        "resumen": {
            "regiones_revisadas": len(regiones),
            "carpetas_intercomunales": len(fuentes),
            "instrumentos_detectados": len(instrumentos),
            "actualizados": sum(i["estado_detectado"] == "actualizado" for i in instrumentos),
            "enviados": sum(i["estado_detectado"] == "enviado" for i in instrumentos),
        },
        "fuentes": fuentes,
        "instrumentos": instrumentos,
    }

    salida_path.parent.mkdir(parents=True, exist_ok=True)
    salida_path.write_text(PREFIJO + json.dumps(datos, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

    print(f"Raíz: {raiz}")
    print(f"Regiones revisadas: {len(regiones)}")
    print(f"Carpetas PRI/PRM detectadas: {len(fuentes)}")
    print(f"Salida: {salida_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
