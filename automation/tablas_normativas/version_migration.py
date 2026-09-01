from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any


def _key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def load_migration_plans(path: str | Path | None) -> dict[str, dict[str, Any]]:
    """Carga planes de migración por comuna sin modificar datos productivos."""
    if not path:
        return {}
    directory = Path(path)
    if not directory.exists():
        return {}

    plans: dict[str, dict[str, Any]] = {}
    for file_path in sorted(directory.glob("*.json")):
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise RuntimeError(f"Plan de migración inválido: {file_path}")
        comuna = str(payload.get("comuna") or "").strip()
        if not comuna:
            raise RuntimeError(f"Plan de migración sin comuna: {file_path}")
        if str(payload.get("mode") or "").upper() != "VERSION_MIGRATION":
            raise RuntimeError(f"Modo de migración no soportado en {file_path}")
        key = _key(comuna)
        if key in plans:
            raise RuntimeError(f"Más de un plan de migración para {comuna}")
        payload["_file"] = str(file_path).replace("\\", "/")
        plans[key] = payload
    return plans


def plan_for(plans: dict[str, dict[str, Any]], comuna: str) -> dict[str, Any] | None:
    return plans.get(_key(comuna))


def analyze_zone_migration(
    plan: dict[str, Any],
    legacy_zones: list[str] | set[str] | tuple[str, ...],
) -> dict[str, Any]:
    """Compara la estructura antigua con la zonificación vigente documentada.

    Una equivalencia de nomenclatura sólo sirve para comprender continuidad jurídica;
    jamás cambia ZONA o CODIGO_PRC automáticamente. Los SPLIT/PARTIAL_SPLIT sí indican
    que la versión vigente puede requerir nuevas unidades normativas, pero publicar
    sigue exigiendo el vínculo espacial de CODIGO_PRC.
    """
    legacy_by_key = {_key(zone): str(zone) for zone in legacy_zones if str(zone or "").strip()}
    current_zones = [str(zone) for zone in (plan.get("zonas_vigentes_esperadas") or [])]
    current_by_key = {_key(zone): zone for zone in current_zones}

    covered_legacy: set[str] = set()
    covered_current: set[str] = set()
    nomenclature = []
    for legacy, current in (plan.get("equivalencias_nomenclatura") or {}).items():
        legacy_key = _key(legacy)
        current_key = _key(current)
        covered_legacy.add(legacy_key)
        covered_current.add(current_key)
        nomenclature.append({
            "legacy_zone": str(legacy),
            "current_zone": str(current),
            "legacy_present": legacy_key in legacy_by_key,
            "current_expected": current_key in current_by_key,
        })

    transformations = []
    for item in plan.get("transformaciones_zona", []) or []:
        legacy = [str(zone) for zone in item.get("legacy_zones", []) or []]
        current = [str(zone) for zone in item.get("current_zones", []) or []]
        legacy_keys = {_key(zone) for zone in legacy}
        current_keys = {_key(zone) for zone in current}
        covered_legacy.update(legacy_keys)
        covered_current.update(current_keys)
        transformations.append({
            "type": str(item.get("type") or "").upper(),
            "legacy_zones": legacy,
            "current_zones": current,
            "source_act": str(item.get("source_act") or ""),
            "requires_spatial_code_mapping": bool(item.get("requires_spatial_code_mapping", True)),
            "legacy_present": sorted(
                legacy_by_key[key] for key in legacy_keys if key in legacy_by_key
            ),
            "current_expected": sorted(
                current_by_key[key] for key in current_keys if key in current_by_key
            ),
        })

    direct_same = set(legacy_by_key) & set(current_by_key)
    unexplained_legacy = sorted(
        legacy_by_key[key]
        for key in (set(legacy_by_key) - direct_same - covered_legacy)
    )
    unexplained_current = sorted(
        current_by_key[key]
        for key in (set(current_by_key) - direct_same - covered_current)
    )

    spatial_pending = any(
        item["requires_spatial_code_mapping"] for item in transformations
    ) or bool((plan.get("reglas_publicacion") or {}).get("requiere_codigo_prc_espacial_demostrado", True))

    structural_change = bool(transformations) or set(legacy_by_key) != set(current_by_key)
    return {
        "mode": "VERSION_MIGRATION",
        "comuna": str(plan.get("comuna") or ""),
        "plan_file": str(plan.get("_file") or ""),
        "legacy_zone_count": len(legacy_by_key),
        "current_zone_count": len(current_by_key),
        "legacy_zones": sorted(legacy_by_key.values()),
        "current_zones": sorted(current_by_key.values()),
        "nomenclature_equivalences": nomenclature,
        "transformations": transformations,
        "unexplained_legacy_zones": unexplained_legacy,
        "unexplained_current_zones": unexplained_current,
        "spatial_code_mapping_pending": spatial_pending,
        "migration_required": structural_change,
        "structurally_explained": not unexplained_legacy and not unexplained_current,
        "publicable": False,
        "state": "MIGRACIÓN NORMATIVA REQUERIDA",
    }
