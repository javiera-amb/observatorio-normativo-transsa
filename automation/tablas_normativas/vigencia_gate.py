from __future__ import annotations

"""Validación fail-closed entre seguimiento normativo, tabla y SIG."""

import json
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Any


def key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def _parse_date(value: Any) -> date | None:
    try:
        return date.fromisoformat(str(value or "")[:10])
    except ValueError:
        return None


def _read_js(path: Path, prefix: str) -> dict[str, Any]:
    if not path.exists():
        return {}
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise RuntimeError(f"Formato JS inválido: {path}")
    payload = json.loads(raw[len(prefix):-1])
    return payload if isinstance(payload, dict) else {}


def load_policy(path: str | Path) -> dict[str, Any]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("Política de vigencia inválida.")
    return payload


def load_tracking(path: str | Path) -> dict[str, dict[str, Any]]:
    payload = _read_js(Path(path), "window.SEGUIMIENTO_NORMATIVO = ")
    return {
        key(item.get("comuna")): item
        for item in payload.get("comunas", [])
        if isinstance(item, dict) and item.get("comuna")
    }


def load_certificates(directory: str | Path) -> dict[str, dict[str, Any]]:
    root = Path(directory)
    if not root.exists():
        return {}
    result: dict[str, dict[str, Any]] = {}
    for path in sorted(root.glob("*.json")):
        item = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(item, dict) or not item.get("comuna"):
            raise RuntimeError(f"Certificado inválido: {path}")
        item["_archivo"] = str(path).replace("\\", "/")
        result[key(item["comuna"])] = item
    return result


def act_ids(tracking: dict[str, Any]) -> set[str]:
    details = tracking.get("actos_posteriores_detalle") or []
    if details:
        return {
            str(item.get("official_id") or item.get("id") or "").strip()
            for item in details if isinstance(item, dict)
            and str(item.get("official_id") or item.get("id") or "").strip()
        }
    # Compatibilidad transitoria: si aún no existe detalle, el contador impide certificar.
    return set()


def evaluate(
    comuna: str,
    tracking: dict[str, Any] | None,
    certificate: dict[str, Any] | None,
    policy: dict[str, Any],
) -> dict[str, Any]:
    result = {
        "comuna": comuna,
        "vigencia_certificada": False,
        "estado_vigencia": "REVISAR",
        "bloqueantes_vigencia": [],
        "version_normativa_id": "",
        "actos_seguimiento": 0,
        "actos_aplicados": 0,
    }
    blockers: list[str] = result["bloqueantes_vigencia"]
    if not tracking:
        blockers.append("No existe seguimiento normativo comunal.")
        return result

    expected_count = int(tracking.get("actos_posteriores") or 0)
    expected_ids = act_ids(tracking)
    version = str(tracking.get("version_normativa_id") or "").strip()
    result["version_normativa_id"] = version
    result["actos_seguimiento"] = expected_count

    if expected_count and len(expected_ids) != expected_count:
        blockers.append(
            f"El seguimiento registra {expected_count} actos, pero no existe detalle completo de los {expected_count}."
        )
    if not certificate:
        blockers.append("No existe certificación de aplicación tabla/SIG para la versión normativa actual.")
        return result

    cert_version = str(certificate.get("version_normativa_id") or "").strip()
    if not version:
        blockers.append("El seguimiento no expone version_normativa_id.")
    elif cert_version != version:
        blockers.append("La certificación corresponde a una versión normativa distinta de la detectada.")

    applied = {
        str(value).strip() for value in certificate.get("actos_aplicados", [])
        if str(value).strip()
    }
    result["actos_aplicados"] = len(applied)
    missing = sorted(expected_ids - applied)
    extra = sorted(applied - expected_ids)
    if missing:
        blockers.append(f"Faltan {len(missing)} actos por aplicar: {', '.join(missing[:8])}")
    if extra:
        blockers.append(f"La certificación contiene {len(extra)} actos ajenos a la versión actual.")
    if expected_count != len(applied):
        blockers.append(
            f"Cobertura de actos incompleta: seguimiento={expected_count}, aplicados={len(applied)}."
        )

    checks = certificate.get("checks") or {}
    for check in policy.get("required_checks", []):
        if checks.get(check) is not True:
            blockers.append(f"Control obligatorio no aprobado: {check}")

    reviewed = _parse_date(certificate.get("fecha_revision"))
    if not reviewed:
        blockers.append("Certificación sin fecha_revision válida.")
    else:
        age = (date.today() - reviewed).days
        if age > int(policy.get("max_review_age_days", 8)):
            blockers.append(f"Certificación vencida: {age} días desde la última revisión.")

    if blockers:
        result["estado_vigencia"] = (
            "BLOQUEADA_ACTO_PENDIENTE" if missing or expected_count != len(applied) else "REVISAR"
        )
        return result

    result["vigencia_certificada"] = True
    result["estado_vigencia"] = "VIGENTE_SINCRONIZADA"
    return result


def apply_gate(
    result: dict[str, Any],
    *,
    tracking_path: str | Path,
    certificate_dir: str | Path,
    policy_path: str | Path,
) -> dict[str, Any]:
    tracking = load_tracking(tracking_path)
    certificates = load_certificates(certificate_dir)
    policy = load_policy(policy_path)

    for commune_key, item in (result.get("comunas") or {}).items():
        comuna = str(item.get("comuna") or commune_key)
        assessment = evaluate(
            comuna,
            tracking.get(key(comuna)),
            certificates.get(key(comuna)),
            policy,
        )
        item["vigencia_normativa"] = assessment
        if not assessment["vigencia_certificada"]:
            item["publicable"] = False
            item.pop("salida", None)
            item.pop("sin_cambios", None)
            if item.get("estado") not in {"ERROR ESTRUCTURAL", "ERROR VÍNCULO", "FALTA TABLA"}:
                item["estado"] = assessment["estado_vigencia"]
            item["motivo_no_publicacion"] = " | ".join(assessment["bloqueantes_vigencia"])
    result["vigencia_policy"] = policy
    result["certificados_vigencia"] = len(certificates)
    return result
