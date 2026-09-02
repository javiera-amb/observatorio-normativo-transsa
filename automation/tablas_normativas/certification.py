from __future__ import annotations

"""Generación conservadora de certificados de vigencia normativa.

El módulo NO transforma una alerta en aprobación. Sólo emite/renueva un certificado
cuando la auditoría tabular ya es publicable y existe evidencia suficiente para
acreditar la misma versión normativa en tabla y SIG.

Reglas:
- cero actos posteriores: puede certificarse automáticamente si la tabla V4 es
  publicable, el inventario normativo está completo, no hay candidatos pendientes
  y el consolidado SIG marca la comuna como SI;
- uno o más actos posteriores: exige una evidencia explícita por comuna/version
  con todos los official_id/id aplicados y los controles tabla/SIG aprobados;
- un cambio de version_normativa_id nunca reutiliza evidencia de una versión previa.
"""

import csv
import json
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Any

from . import vigencia_gate


def _slug(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-zA-Z0-9]+", "_", text).strip("_").lower()
    return text or "comuna"


def _sig_index(path: str | Path | None) -> dict[str, dict[str, str]]:
    if not path:
        return {}
    source = Path(path)
    if not source.exists():
        return {}
    with source.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter=";"))
    return {
        vigencia_gate.key(row.get("comuna")): row
        for row in rows
        if row.get("comuna")
    }


def _load_evidence(directory: str | Path | None) -> dict[str, dict[str, Any]]:
    if not directory:
        return {}
    root = Path(directory)
    if not root.exists():
        return {}
    result: dict[str, dict[str, Any]] = {}
    for path in sorted(root.glob("*.json")):
        item = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(item, dict) or not item.get("comuna"):
            raise RuntimeError(f"Evidencia de vigencia inválida: {path}")
        item["_archivo"] = str(path).replace("\\", "/")
        result[vigencia_gate.key(item["comuna"])] = item
    return result


def _positive_sig(row: dict[str, Any] | None) -> bool:
    if not row:
        return False
    value = str(row.get("apto_para_visor") or "").strip().upper()
    return value in {"SI", "SÍ", "OK", "APTO", "VIGENTE", "DISPONIBLE"}


def _table_is_audited_and_publishable(item: dict[str, Any] | None) -> bool:
    if not item:
        return False
    if item.get("publicable") is not True:
        return False
    if item.get("migracion_normativa", {}).get("migration_required") is True:
        return False
    if str(item.get("estado") or "").upper() in {
        "ERROR ESTRUCTURAL",
        "ERROR VÍNCULO",
        "FALTA TABLA",
        "CON OBSERVACIONES",
        "MIGRACIÓN NORMATIVA REQUERIDA",
    }:
        return False
    return True


def _assessment_reason(
    commune: str,
    tracking: dict[str, Any] | None,
    table_item: dict[str, Any] | None,
    sig_row: dict[str, Any] | None,
    evidence: dict[str, Any] | None,
) -> tuple[bool, list[str], dict[str, Any] | None]:
    blockers: list[str] = []
    if not tracking:
        return False, ["Sin seguimiento normativo."], None

    version = str(tracking.get("version_normativa_id") or "").strip()
    expected_count = int(tracking.get("actos_posteriores") or 0)
    expected_ids = vigencia_gate.act_ids(tracking)
    candidates = [
        item for item in (tracking.get("candidatos_normativos_detalle") or [])
        if isinstance(item, dict)
    ]

    if not version:
        blockers.append("Sin instrumento base/version_normativa_id verificable.")
    if expected_count != len(expected_ids):
        blockers.append(
            f"Inventario de actos incompleto: seguimiento={expected_count}, ids={len(expected_ids)}."
        )
    if candidates:
        blockers.append(f"Hay {len(candidates)} antecedentes normativos pendientes de conciliación.")
    if not _table_is_audited_and_publishable(table_item):
        blockers.append("La tabla todavía no supera la auditoría V4 con cobertura oficial completa.")

    if expected_count == 0:
        if not _positive_sig(sig_row):
            blockers.append("El SIG no está marcado SI para la versión base sin actos posteriores.")
        applied: set[str] = set()
        evidence_file = ""
    else:
        if not evidence:
            blockers.append(
                "Existen actos posteriores: falta evidencia explícita de aplicación en tabla y SIG."
            )
            applied = set()
            evidence_file = ""
        else:
            evidence_version = str(evidence.get("version_normativa_id") or "").strip()
            if evidence_version != version:
                blockers.append("La evidencia pertenece a otra version_normativa_id.")
            applied = {
                str(value).strip()
                for value in (evidence.get("actos_aplicados") or [])
                if str(value).strip()
            }
            missing = sorted(expected_ids - applied)
            extra = sorted(applied - expected_ids)
            if missing:
                blockers.append(
                    f"La evidencia no acredita {len(missing)} actos: {', '.join(missing[:8])}."
                )
            if extra:
                blockers.append("La evidencia incluye actos que no pertenecen a la versión actual.")
            checks = evidence.get("checks") or {}
            for check in (
                "actos_posteriores_verificados",
                "actos_posteriores_aplicados_tabla",
                "actos_posteriores_aplicados_sig",
                "texto_vigente_verificado",
                "version_normativa_coincidente",
            ):
                if checks.get(check) is not True:
                    blockers.append(f"Evidencia sin control aprobado: {check}.")
            evidence_file = str(evidence.get("_archivo") or "")

    if blockers:
        return False, blockers, None

    certificate = {
        "schema_version": 1,
        "comuna": commune,
        "version_normativa_id": version,
        "fecha_revision": date.today().isoformat(),
        "actos_aplicados": sorted(expected_ids if expected_count else set()),
        "checks": {
            "instrumento_base_verificado": True,
            "inventario_actos_posteriores_completo": True,
            "actos_posteriores_verificados": True,
            "actos_posteriores_aplicados_tabla": True,
            "actos_posteriores_aplicados_sig": True,
            "texto_vigente_verificado": True,
            "tabla_normativa_auditada": True,
            "version_normativa_coincidente": True,
        },
        "evidencia": {
            "modo": "automatico_sin_actos" if expected_count == 0 else "explicita_actos_posteriores",
            "archivo_evidencia": evidence_file,
            "estado_tabla_pre_gate": str((table_item or {}).get("estado") or ""),
            "sig_apto_para_visor": str((sig_row or {}).get("apto_para_visor") or ""),
        },
    }
    return True, [], certificate


def refresh_certificates(
    result: dict[str, Any],
    *,
    tracking_path: str | Path,
    certificate_dir: str | Path,
    evidence_dir: str | Path | None = None,
    sig_path: str | Path | None = None,
) -> dict[str, Any]:
    tracking = vigencia_gate.load_tracking(tracking_path)
    evidences = _load_evidence(evidence_dir)
    sig = _sig_index(sig_path)
    output = Path(certificate_dir)
    output.mkdir(parents=True, exist_ok=True)

    generated = 0
    blocked = 0
    communes = result.get("comunas") or {}
    for commune_key, table_item in communes.items():
        commune = str((table_item or {}).get("comuna") or commune_key)
        key = vigencia_gate.key(commune)
        ok, reasons, certificate = _assessment_reason(
            commune,
            tracking.get(key),
            table_item,
            sig.get(key),
            evidences.get(key),
        )
        table_item["certificacion_automatica"] = {
            "elegible": ok,
            "bloqueantes": reasons,
        }
        if not ok or not certificate:
            blocked += 1
            continue

        path = output / f"{_slug(commune)}.json"
        serialized = json.dumps(certificate, ensure_ascii=False, indent=2) + "\n"
        if not path.exists() or path.read_text(encoding="utf-8") != serialized:
            path.write_text(serialized, encoding="utf-8")
        generated += 1

    result["certificacion_automatica_generada"] = generated
    result["certificacion_automatica_bloqueada"] = blocked
    return result
