from __future__ import annotations

import copy
import json
import re
import unicodedata
from pathlib import Path
from typing import Any


def _key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def _load_directory(path: str | Path | None, label: str) -> dict[str, dict[str, Any]]:
    if not path:
        return {}
    directory = Path(path)
    if not directory.exists():
        return {}
    catalogs: dict[str, dict[str, Any]] = {}
    for file_path in sorted(directory.glob("*.json")):
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise RuntimeError(f"{label} inválido: {file_path}")
        comuna = str(payload.get("comuna") or "").strip()
        if not comuna:
            raise RuntimeError(f"{label} sin comuna: {file_path}")
        key = _key(comuna)
        if key in catalogs:
            raise RuntimeError(f"Más de un {label.lower()} para {comuna}")
        payload["_file"] = str(file_path).replace("\\", "/")
        catalogs[key] = payload
    return catalogs


def load_current_unit_catalogs(path: str | Path | None) -> dict[str, dict[str, Any]]:
    return _load_directory(path, "Catálogo de unidades vigentes")


def load_code_generation_policies(path: str | Path | None) -> dict[str, dict[str, Any]]:
    policies = _load_directory(path, "Política de generación CODIGO_PRC")
    for policy in policies.values():
        if bool(policy.get("global", False)):
            raise RuntimeError("Las políticas de generación CODIGO_PRC deben ser comunales, nunca globales.")
        if str(policy.get("scope") or "") != "ONLY_NEW_UNITS_IN_VERSION_MIGRATION":
            raise RuntimeError("La generación de CODIGO_PRC sólo está autorizada para nuevas unidades de una migración normativa.")
        if bool(policy.get("rewrite_existing_codes", False)):
            raise RuntimeError("Una política de generación no puede autorizar reescritura de códigos existentes.")
    return policies


def derive_seed_codes(catalog: dict[str, Any], policy: dict[str, Any] | None) -> dict[str, Any]:
    """Deriva códigos únicamente para semillas nuevas y deja intacto el catálogo original."""
    result = copy.deepcopy(catalog)
    if not policy:
        return result
    if _key(policy.get("comuna")) != _key(result.get("comuna")):
        raise RuntimeError("La política CODIGO_PRC no corresponde a la comuna del catálogo.")
    if str(policy.get("rule") or "") != "{RIALCOMSII}-{ZONA}":
        raise RuntimeError("Regla CODIGO_PRC no soportada.")

    rial = str(result.get("rialcomsii") or "").strip()
    if not rial:
        raise RuntimeError("No se puede derivar CODIGO_PRC sin RIALCOMSII.")

    generated: list[str] = []
    for unit in result.get("unidades") or []:
        existing = str(unit.get("CODIGO_PRC") or "").strip()
        if existing:
            continue
        zona = str(unit.get("ZONA") or "").strip()
        if not zona:
            raise RuntimeError("Unidad vigente sin ZONA.")
        code = f"{rial}-{zona}"
        unit["CODIGO_PRC"] = code
        unit["CODIGO_PRC_ORIGIN"] = "DERIVADO_REGLA_COMUNAL_VERIFICADA"
        generated.append(code)
    result["_generated_codigo_prc"] = generated
    result["_code_policy_file"] = str(policy.get("_file") or "")
    return result


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
    ready_for_seed = bool(units) and not missing_codes and not units_without_variants
    explicitly_productive = bool(catalog.get("ready_for_productive_generation", False))
    return {
        "comuna": str(catalog.get("comuna") or ""),
        "catalog_file": str(catalog.get("_file") or ""),
        "units_prepared": len(units),
        "variants_prepared": len(variants),
        "units_missing_codigo_prc": missing_codes,
        "units_without_variants": units_without_variants,
        "codigo_prc_pending": bool(missing_codes),
        "generated_codigo_prc": list(catalog.get("_generated_codigo_prc") or []),
        "ready_for_seed": ready_for_seed,
        "ready_for_generation": ready_for_seed and explicitly_productive,
        "ready_for_productive_generation": ready_for_seed and explicitly_productive,
        "publicable": False,
    }
