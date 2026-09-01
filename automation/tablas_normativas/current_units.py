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


def load_current_unit_catalogs(path: str | Path | None) -> dict[str, dict[str, Any]]:
    if not path:
        return {}
    directory = Path(path)
    if not directory.exists():
        return {}
    catalogs: dict[str, dict[str, Any]] = {}
    for file_path in sorted(directory.glob("*.json")):
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise RuntimeError(f"Catálogo de unidades vigente inválido: {file_path}")
        comuna = str(payload.get("comuna") or "").strip()
        if not comuna:
            raise RuntimeError(f"Catálogo de unidades sin comuna: {file_path}")
        key = _key(comuna)
        if key in catalogs:
            raise RuntimeError(f"Más de un catálogo de unidades para {comuna}")
        payload["_file"] = str(file_path).replace("\\", "/")
        catalogs[key] = payload
    return catalogs


def progress(catalog: dict[str, Any]) -> dict[str, Any]:
    units = list(catalog.get("unidades") or [])
    variants = [
        variant
        for unit in units
        for variant in (unit.get("variantes") or [])
    ]
    missing_codes = [
        str(unit.get("ZONA") or "")
        for unit in units
        if not str(unit.get("CODIGO_PRC") or "").strip()
    ]
    units_without_variants = [
        str(unit.get("ZONA") or "") for unit in units if not (unit.get("variantes") or [])
    ]
    return {
        "comuna": str(catalog.get("comuna") or ""),
        "catalog_file": str(catalog.get("_file") or ""),
        "units_prepared": len(units),
        "variants_prepared": len(variants),
        "units_missing_codigo_prc": missing_codes,
        "units_without_variants": units_without_variants,
        "codigo_prc_pending": bool(missing_codes),
        "ready_for_generation": bool(units) and not missing_codes and not units_without_variants,
        "publicable": False,
    }
