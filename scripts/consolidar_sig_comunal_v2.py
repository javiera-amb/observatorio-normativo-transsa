from __future__ import annotations

"""
Carga robusta de actos IPT para el consolidado SIG comunal.

IMPORTANTE:
- NO usa los bloques GZIP/BASE64 del repositorio.
- Busca un CSV original descargado desde Portal IPT.
- Si no encuentra uno valido, abre un selector de archivo.
- Genera una copia JSON limpia en _local/sig_ipt y la reutiliza despues.
- NO vuelve a recorrer la cartografia SIG.
"""

import json
import shutil
import sys
from collections import Counter
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402
import sincronizar_portal_ipt as portal  # noqa: E402

CACHE_NAME = "actos_ipt_nacionales_limpio.json"
SOURCE_COPY_NAME = "portal_ipt_fuente.csv"
MIN_EXPECTED_ROWS = 1700

# Conteos del corte anual conocido (07-07-2026).
# Se usan como control informativo cuando el CSV tiene exactamente 1.784 actos.
KNOWN_TOTAL = 1784
KNOWN_STATES = {
    "Vigente": 955,
    "Derogado": 631,
    "En Desarrollo": 198,
}
KNOWN_TYPES = {
    "Enmienda": 158,
    "Rectificación": 38,
    "Modificación mediante seccional": 130,
}
KNOWN_LINKED = 275


def _cache_path(repo: Path) -> Path:
    return repo / "_local" / "sig_ipt" / CACHE_NAME


def _source_copy_path(repo: Path) -> Path:
    return repo / "_local" / "sig_ipt" / SOURCE_COPY_NAME


def _validate_rows(rows: Any, label: str) -> list[list[Any]]:
    if not isinstance(rows, list):
        raise RuntimeError(f"{label}: el contenido no es una lista.")
    if len(rows) < MIN_EXPECTED_ROWS:
        raise RuntimeError(
            f"{label}: solo contiene {len(rows):,} modificaciones; "
            f"se esperaban al menos {MIN_EXPECTED_ROWS:,}."
        )

    for position, row in enumerate(rows):
        if not isinstance(row, list) or len(row) < 17:
            raise RuntimeError(f"{label}: fila {position} incompleta.")

    return rows


def _print_controls(rows: list[list[Any]], source: str) -> None:
    states = Counter(str(row[6] or "") for row in rows)
    types = Counter(str(row[11] or "") for row in rows)
    linked = sum(bool(row[10]) for row in rows)

    print("Base normativa IPT:")
    print(f"- Fuente utilizada    : {source}")
    print(f"- Actos verificados   : {len(rows):,}")
    print(f"- Vigentes            : {states.get('Vigente', 0):,}")
    print(f"- Derogados           : {states.get('Derogado', 0):,}")
    print(f"- En desarrollo       : {states.get('En Desarrollo', 0):,}")
    print(f"- Enmiendas           : {types.get('Enmienda', 0):,}")
    print(f"- Rectificaciones     : {types.get('Rectificación', 0):,}")
    print(f"- Modif. seccionales  : {types.get('Modificación mediante seccional', 0):,}")
    print(f"- Vinculados origen   : {linked:,}")

    if len(rows) == KNOWN_TOTAL:
        mismatches: list[str] = []
        for key, expected in KNOWN_STATES.items():
            if states.get(key, 0) != expected:
                mismatches.append(f"{key}={states.get(key, 0)} (esperado {expected})")
        for key, expected in KNOWN_TYPES.items():
            if types.get(key, 0) != expected:
                mismatches.append(f"{key}={types.get(key, 0)} (esperado {expected})")
        if linked != KNOWN_LINKED:
            mismatches.append(f"vinculados={linked} (esperado {KNOWN_LINKED})")

        if mismatches:
            raise RuntimeError(
                "El CSV tiene 1.784 actos, pero no coincide con el corte anual conocido: "
                + "; ".join(mismatches)
            )
        print("- Control corte 07-07 : OK")
    else:
        print("- Control corte 07-07 : nuevo corte; se acepta por provenir del CSV fuente")
    print()


def _load_cache(repo: Path) -> list[list[Any]] | None:
    path = _cache_path(repo)
    if not path.exists():
        return None
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        rows = _validate_rows(rows, "copia JSON limpia")
    except Exception as error:
        print(f"AVISO. Se ignora la copia limpia existente: {error}")
        return None

    _print_controls(rows, "copia JSON limpia validada")
    return rows


def _candidate_csvs(repo: Path) -> list[Path]:
    home = Path.home()
    candidates: list[Path] = []

    explicit = [
        repo / "instrumentos.csv",
        repo / "instrumentos(1).csv",
        repo / "data" / "instrumentos.csv",
        repo / "data" / "instrumentos(1).csv",
        repo / "_local" / "sig_ipt" / SOURCE_COPY_NAME,
        repo / "_local" / "sig_ipt" / "instrumentos.csv",
        repo / "_local" / "sig_ipt" / "instrumentos(1).csv",
    ]
    candidates.extend(explicit)

    search_dirs = [
        home / "Downloads",
        home / "Descargas",
        home / "Desktop",
        home / "Escritorio",
        home / "Documents",
        home / "Documentos",
        home / "OneDrive - Transsa" / "Documentos",
    ]

    for folder in search_dirs:
        if not folder.exists():
            continue
        try:
            found = sorted(
                folder.glob("instrumentos*.csv"),
                key=lambda path: path.stat().st_mtime,
                reverse=True,
            )
            candidates.extend(found)
        except OSError:
            continue

    unique: list[Path] = []
    seen: set[str] = set()
    for path in candidates:
        try:
            key = str(path.resolve()).lower()
        except OSError:
            key = str(path).lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(path)
    return unique


def _rows_from_csv(path: Path) -> list[list[Any]]:
    records = portal.read_csv(path)
    rows = portal.build_rows(records)
    return _validate_rows(rows, f"CSV {path.name}")


def _find_valid_csv(repo: Path) -> tuple[Path, list[list[Any]]] | None:
    for path in _candidate_csvs(repo):
        if not path.exists() or not path.is_file():
            continue
        try:
            rows = _rows_from_csv(path)
        except Exception:
            continue
        return path, rows
    return None


def _ask_for_csv() -> Path | None:
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected = filedialog.askopenfilename(
            title="Selecciona el CSV descargado desde Portal IPT",
            filetypes=[("Archivos CSV", "*.csv"), ("Todos los archivos", "*.*")],
        )
        root.destroy()
        return Path(selected) if selected else None
    except Exception as error:
        print(f"AVISO. No se pudo abrir selector de archivo: {error}")
        return None


def _save_clean_copy(repo: Path, source: Path, rows: list[list[Any]]) -> None:
    output_dir = repo / "_local" / "sig_ipt"
    output_dir.mkdir(parents=True, exist_ok=True)

    cache = _cache_path(repo)
    cache.write_text(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    source_copy = _source_copy_path(repo)
    try:
        if source.resolve() != source_copy.resolve():
            shutil.copy2(source, source_copy)
    except OSError:
        pass


def _load_rows_from_source(repo: Path) -> list[list[Any]]:
    cached = _load_cache(repo)
    if cached is not None:
        return cached

    found = _find_valid_csv(repo)
    if found is None:
        print("No encontre automaticamente un CSV valido del Portal IPT.")
        print("Se abrira una ventana para seleccionarlo.")
        print()
        selected = _ask_for_csv()
        if selected is None:
            raise RuntimeError(
                "No se selecciono un CSV del Portal IPT. "
                "Descarga el listado desde Portal IPT y vuelve a ejecutar este archivo."
            )
        try:
            rows = _rows_from_csv(selected)
        except Exception as error:
            raise RuntimeError(
                f"El archivo seleccionado no corresponde a un CSV valido del Portal IPT: {error}"
            ) from error
        source = selected
    else:
        source, rows = found

    _print_controls(rows, str(source))
    _save_clean_copy(repo, source, rows)
    print(f"- Copia limpia        : _local\\sig_ipt\\{CACHE_NAME}")
    print(f"- CSV fuente guardado : _local\\sig_ipt\\{SOURCE_COPY_NAME}")
    print()
    return rows


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    rows = _load_rows_from_source(repo)

    acts: list[dict[str, Any]] = []
    for row in rows:
        acts.append({
            "id": row[0],
            "region": row[1] or "",
            "comunas": row[2] if isinstance(row[2], list) else [],
            "nivel": row[3] or "",
            "tipo_ipt": row[4] or "",
            "titulo": row[5] or "",
            "estado": row[6] or "",
            "fecha": row[7] or "",
            "fecha_derogacion": row[8] or "",
            "codigos_origen": row[10] if isinstance(row[10], list) else [],
            "tipo_acto": row[11] or "Modificación",
        })

    return acts


base.load_national_acts = load_national_acts


if __name__ == "__main__":
    raise SystemExit(base.main())
