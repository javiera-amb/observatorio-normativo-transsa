from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from . import pairing
from . import version_migration


def read_prc_zone_code_pairs(
    prc_path: str | Path,
    preferred_layer: str | None = None,
) -> tuple[int, str, list[dict[str, str]]]:
    """Lee ZONA y CODIGO_PRC del GPKG sin interpretar ni modificar códigos."""
    path = Path(prc_path)
    if not path.exists():
        raise FileNotFoundError(path)
    if path.suffix.lower() != ".gpkg":
        raise ValueError("El PRC productivo debe ser GeoPackage (.gpkg).")

    connection = sqlite3.connect(path)
    try:
        layer = pairing._choose_feature_table(connection, preferred_layer)
        code_column = pairing._column_name(connection, layer, "CODIGO_PRC")
        zone_column = pairing._column_name(connection, layer, "ZONA")
        if not code_column:
            raise ValueError("La capa PRC no contiene CODIGO_PRC inequívoco.")
        if not zone_column:
            raise ValueError("La capa PRC no contiene ZONA inequívoca; no se puede resolver migración espacial automáticamente.")

        quoted_layer = layer.replace('"', '""')
        quoted_code = code_column.replace('"', '""')
        quoted_zone = zone_column.replace('"', '""')
        rows = connection.execute(
            f'SELECT "{quoted_code}", "{quoted_zone}" FROM "{quoted_layer}" ORDER BY rowid'
        ).fetchall()
        pairs = [
            {
                "CODIGO_PRC": str(row[0] or "").strip(),
                "ZONA": str(row[1] or "").strip(),
            }
            for row in rows
        ]
        return len(rows), layer, pairs
    finally:
        connection.close()


def analyze_spatial_zone_mapping(
    plan: dict[str, Any],
    pairs: list[dict[str, str]],
) -> dict[str, Any]:
    """Contrasta las zonas del GPKG con las unidades vigentes del plan de migración.

    Sólo acepta dos formas de resolución automática:
    1) la ZONA del GPKG coincide directamente con una unidad vigente;
    2) existe una equivalencia de nomenclatura 1:1 declarada en el plan.

    Un SPLIT/PARTIAL_SPLIT nunca se resuelve por similitud de nombre. Para esas unidades
    el GPKG debe contener explícitamente la zona vigente y un CODIGO_PRC no vacío.
    """
    current = [str(zone) for zone in (plan.get("zonas_vigentes_esperadas") or [])]
    current_by_key = {version_migration._key(zone): zone for zone in current}
    simple_aliases = {
        version_migration._key(legacy): current_zone
        for legacy, current_zone in (plan.get("equivalencias_nomenclatura") or {}).items()
        if version_migration._key(current_zone) in current_by_key
    }

    codes_by_current: dict[str, set[str]] = {zone: set() for zone in current}
    raw_zones: dict[str, set[str]] = {}
    blank_codes = 0
    blank_zones = 0
    unresolved_pairs: list[dict[str, str]] = []

    for pair in pairs:
        code = str(pair.get("CODIGO_PRC") or "").strip()
        zone = str(pair.get("ZONA") or "").strip()
        if not code:
            blank_codes += 1
        if not zone:
            blank_zones += 1
            unresolved_pairs.append({"CODIGO_PRC": code, "ZONA": zone})
            continue

        zone_key = version_migration._key(zone)
        raw_zones.setdefault(zone_key, set()).add(zone)
        canonical = current_by_key.get(zone_key)
        if canonical is None:
            alias_target = simple_aliases.get(zone_key)
            if alias_target:
                canonical = current_by_key.get(version_migration._key(alias_target), alias_target)

        if canonical is None:
            unresolved_pairs.append({"CODIGO_PRC": code, "ZONA": zone})
            continue
        if code:
            codes_by_current.setdefault(canonical, set()).add(code)

    resolved = {
        zone: sorted(codes)
        for zone, codes in codes_by_current.items()
        if codes
    }
    missing = sorted(zone for zone in current if not codes_by_current.get(zone))
    unexpected_zones = sorted({
        raw
        for pair in unresolved_pairs
        for raw in [str(pair.get("ZONA") or "").strip()]
        if raw
    })

    transformation_targets = {
        str(zone)
        for item in (plan.get("transformaciones_zona") or [])
        if bool(item.get("requires_spatial_code_mapping", True))
        for zone in (item.get("current_zones") or [])
    }
    missing_transformation_targets = sorted(
        zone for zone in transformation_targets if zone in missing
    )

    mapping_complete = (
        not missing
        and blank_codes == 0
        and blank_zones == 0
        and not unexpected_zones
    )
    return {
        "polygon_count": len(pairs),
        "current_zone_count": len(current),
        "resolved_zone_count": len(resolved),
        "codes_by_current_zone": resolved,
        "current_zones_missing_in_prc": missing,
        "transformation_zones_missing_in_prc": missing_transformation_targets,
        "unexpected_prc_zones": unexpected_zones,
        "blank_codigo_prc": blank_codes,
        "blank_zona": blank_zones,
        "mapping_complete": mapping_complete,
        "state": "MAPEO ESPACIAL COMPLETO" if mapping_complete else "MAPEO ESPACIAL PENDIENTE",
    }
