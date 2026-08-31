from __future__ import annotations

import re
import sqlite3
import unicodedata
from pathlib import Path
from typing import Any

from . import engine as base


def _key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def _feature_tables(connection: sqlite3.Connection) -> list[str]:
    try:
        rows = connection.execute(
            "SELECT table_name FROM gpkg_contents WHERE data_type='features' ORDER BY table_name"
        ).fetchall()
    except sqlite3.DatabaseError as exc:
        raise ValueError("El archivo no es un GeoPackage válido o no contiene gpkg_contents.") from exc
    return [str(row[0]) for row in rows]


def _choose_feature_table(connection: sqlite3.Connection, preferred_layer: str | None = None) -> str:
    tables = _feature_tables(connection)
    if not tables:
        raise ValueError("El PRC no contiene ninguna capa vectorial de tipo features.")
    if preferred_layer:
        matches = [name for name in tables if _key(name) == _key(preferred_layer)]
        if len(matches) == 1:
            return matches[0]
        raise ValueError(f"No se encontró la capa PRC indicada: {preferred_layer}.")
    if len(tables) == 1:
        return tables[0]
    preferred = [
        name for name in tables
        if any(token in _key(name) for token in ("ZONIFIC", "PRC", "ZONA", "NORMAT"))
    ]
    if len(preferred) == 1:
        return preferred[0]
    raise ValueError(
        "El GeoPackage contiene varias capas de polígonos y no se puede determinar el PRC de forma inequívoca."
    )


def count_prc_features(prc_path: str | Path, preferred_layer: str | None = None) -> tuple[int, str]:
    path = Path(prc_path)
    if not path.exists():
        raise FileNotFoundError(path)
    if path.suffix.lower() != ".gpkg":
        raise ValueError("El PRC productivo debe entregarse como GeoPackage (.gpkg).")
    connection = sqlite3.connect(path)
    try:
        layer = _choose_feature_table(connection, preferred_layer)
        quoted = layer.replace('"', '""')
        count = int(connection.execute(f'SELECT COUNT(*) FROM "{quoted}"').fetchone()[0])
        return count, layer
    finally:
        connection.close()


def validate_prc_table_pair(
    prc_path: str | Path,
    table_path: str | Path,
    *,
    expected_comuna: str | None = None,
    preferred_layer: str | None = None,
) -> dict[str, Any]:
    """Valida el contrato productivo: PRC + tabla, una fila por polígono.

    No modifica archivos. Cualquier diferencia estructural bloquea la producción.
    """
    prc_path = Path(prc_path)
    table_path = Path(table_path)
    errors: list[str] = []

    if not prc_path.exists():
        errors.append("Falta el archivo PRC.")
    if not table_path.exists():
        errors.append("Falta la tabla normativa asociada.")
    if errors:
        return {
            "valid": False,
            "state": "ERROR_ESTRUCTURAL",
            "errors": errors,
            "prc_path": str(prc_path),
            "table_path": str(table_path),
        }

    try:
        polygon_count, layer = count_prc_features(prc_path, preferred_layer)
    except (ValueError, FileNotFoundError) as exc:
        errors.append(str(exc))
        polygon_count, layer = None, None

    try:
        headers, rows = base.read_table(table_path)
    except Exception as exc:  # lectura inválida: debe bloquear, no adivinar
        errors.append(f"No se pudo leer la tabla normativa: {exc}")
        headers, rows = [], []

    row_count = len(rows)
    communes = sorted({str(row.get("COMUNA", "")).strip() for row in rows if str(row.get("COMUNA", "")).strip()})
    commune = communes[0] if len(communes) == 1 else ""

    if row_count == 0:
        errors.append("La tabla normativa no contiene filas productivas.")
    if len(communes) > 1:
        errors.append("La tabla contiene más de una comuna y no puede ligarse a un único PRC.")
    if expected_comuna and commune and _key(expected_comuna) != _key(commune):
        errors.append(f"La tabla corresponde a {commune}, no a {expected_comuna}.")
    if polygon_count is not None and polygon_count != row_count:
        errors.append(
            f"Relación 1:1 inválida: el PRC tiene {polygon_count} polígonos y la tabla {row_count} filas."
        )

    missing_fields = [field for field in base.FIELDS if field not in headers]
    if missing_fields:
        errors.append("Faltan campos productivos obligatorios: " + ", ".join(missing_fields))

    return {
        "valid": not errors,
        "state": "LISTO_AUDITAR" if not errors else "ERROR_ESTRUCTURAL",
        "errors": errors,
        "comuna": commune or expected_comuna or "",
        "prc_path": str(prc_path),
        "table_path": str(table_path),
        "prc_layer": layer,
        "polygon_count": polygon_count,
        "row_count": row_count,
        "productive_fields": len(base.FIELDS),
        "missing_fields": missing_fields,
        "contract": "1 polígono PRC = 1 fila tabla; orden y cantidad se preservan",
    }
