from __future__ import annotations

"""Genera la cola nacional de saneamiento de Tablas Normativas.

No reemplaza el gate de vigencia. Traduce sus bloqueantes y la cobertura disponible
en una acción operativa única y prioritaria por cada una de las 346 comunas.
"""

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
TRACKING = ROOT / "data" / "seguimiento_normativo.js"
VIGENCIA = ROOT / "data" / "vigencia_tablas_normativas.js"
SHAREPOINT = ROOT / "data" / "tablas_normativas_sharepoint.js"
COVERAGE = ROOT / "config" / "tablas_normativas_cobertura.json"
OUTPUT = ROOT / "data" / "cola_tablas_normativas.js"


def key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "", text.upper())


def read_assignment(path: Path, prefix: str) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise RuntimeError(f"Formato JS inválido: {path}")
    payload = json.loads(raw[len(prefix):-1])
    if not isinstance(payload, dict):
        raise RuntimeError(f"Payload inválido: {path}")
    return payload


def table_inventory() -> set[str]:
    raw = SHAREPOINT.read_text(encoding="utf-8")
    names = re.findall(r'"PRC_([^"/]+?)_35_CAMPOS\.csv"', raw, flags=re.IGNORECASE)
    return {key(name.replace("_", " ")) for name in names}


def coverage_index() -> dict[str, dict[str, Any]]:
    payload = json.loads(COVERAGE.read_text(encoding="utf-8"))
    return {
        key(name): data
        for name, data in (payload.get("por_comuna") or {}).items()
        if isinstance(data, dict)
    }


def priority_action(
    *,
    tracking: dict[str, Any],
    vigencia: dict[str, Any],
    has_table: bool,
    coverage_state: str,
) -> tuple[str, str]:
    if bool(vigencia.get("vigencia_certificada")):
        return "CERTIFICADA", "Seguimiento, tabla y SIG acreditan la misma versión normativa."

    version = str(tracking.get("version_normativa_id") or "").strip()
    expected = int(vigencia.get("actos_seguimiento") or 0)
    applied = int(vigencia.get("actos_aplicados") or 0)
    candidates = int(vigencia.get("candidatos_pendientes") or 0)

    if not version:
        return (
            "VERIFICAR_INSTRUMENTO_BASE",
            "No existe una version_normativa_id verificable para construir la línea base.",
        )
    if not has_table:
        return (
            "OBTENER_TABLA_BASE",
            "Existe seguimiento normativo, pero la comuna no figura en el inventario tabular vigente.",
        )
    if coverage_state != "COMPLETA":
        return (
            "COMPLETAR_CATALOGO_OFICIAL",
            f"La cobertura de fuentes oficiales está {coverage_state.lower()} y no permite publicar.",
        )
    if candidates:
        return (
            "CONCILIAR_ACTOS_RECIENTES",
            f"Hay {candidates} antecedente(s) oficial(es) reciente(s) aún sin conciliar.",
        )
    if expected > applied:
        return (
            "APLICAR_ACTOS_TABLA_SIG",
            f"Falta acreditar la aplicación de {expected - applied} acto(s) en tabla y SIG.",
        )
    return (
        "AUDITAR_Y_CERTIFICAR_V5",
        "La evidencia base está disponible; falta cerrar auditoría y certificado V5.",
    )


def main() -> int:
    tracking_payload = read_assignment(TRACKING, "window.SEGUIMIENTO_NORMATIVO = ")
    vigencia_payload = read_assignment(VIGENCIA, "window.VIGENCIA_TABLAS_NORMATIVAS = ")
    tables = table_inventory()
    coverage = coverage_index()

    tracking_rows = tracking_payload.get("comunas") or []
    vigencia_rows = vigencia_payload.get("comunas") or []
    if len(tracking_rows) != 346 or len(vigencia_rows) != 346:
        raise RuntimeError(
            f"La cola nacional exige 346/346 filas: seguimiento={len(tracking_rows)}, "
            f"vigencia={len(vigencia_rows)}."
        )

    vigencia_by_key = {
        key(row.get("comuna")): row
        for row in vigencia_rows
        if isinstance(row, dict) and row.get("comuna")
    }

    rows: list[dict[str, Any]] = []
    action_counts: Counter[str] = Counter()
    for tracking in tracking_rows:
        commune = str(tracking.get("comuna") or "").strip()
        region = str(tracking.get("region") or "").strip()
        commune_key = key(commune)
        vigencia = vigencia_by_key.get(commune_key)
        if not vigencia:
            raise RuntimeError(f"La comuna {commune} no existe en la salida de vigencia.")

        has_table = commune_key in tables
        coverage_item = coverage.get(commune_key) or {}
        coverage_state = str(coverage_item.get("estado") or "PENDIENTE").strip().upper()
        action, reason = priority_action(
            tracking=tracking,
            vigencia=vigencia,
            has_table=has_table,
            coverage_state=coverage_state,
        )
        action_counts[action] += 1
        rows.append({
            "comuna": commune,
            "region": region,
            "accion_prioritaria": action,
            "motivo_accion": reason,
            "tiene_tabla_base": has_table,
            "cobertura_fuentes": coverage_state,
            "nota_cobertura": str(coverage_item.get("nota") or ""),
            "vigencia_certificada": bool(vigencia.get("vigencia_certificada")),
            "estado_vigencia": str(vigencia.get("estado_vigencia") or "REVISAR"),
            "version_normativa_id": str(vigencia.get("version_normativa_id") or ""),
            "actos_exigidos": int(vigencia.get("actos_seguimiento") or 0),
            "actos_aplicados": int(vigencia.get("actos_aplicados") or 0),
            "candidatos_pendientes": int(vigencia.get("candidatos_pendientes") or 0),
            "ultimo_acto_posterior": str(vigencia.get("ultimo_acto_posterior") or ""),
            "bloqueantes": list(vigencia.get("bloqueantes_vigencia") or []),
        })

    rows.sort(key=lambda row: (row["region"], row["comuna"]))
    payload = {
        "schema_version": 1,
        "modo": "fail_closed",
        "total_comunas": len(rows),
        "con_tabla_base": sum(bool(row["tiene_tabla_base"]) for row in rows),
        "sin_tabla_base": sum(not bool(row["tiene_tabla_base"]) for row in rows),
        "certificadas": sum(bool(row["vigencia_certificada"]) for row in rows),
        "bloqueadas": sum(not bool(row["vigencia_certificada"]) for row in rows),
        "acciones": dict(sorted(action_counts.items())),
        "comunas": rows,
    }
    if payload["total_comunas"] != 346:
        raise RuntimeError(f"Cola incompleta: {payload['total_comunas']}/346 comunas.")

    OUTPUT.write_text(
        "window.COLA_TABLAS_NORMATIVAS = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(
        f"Cola nacional: {payload['total_comunas']} comunas · "
        f"{payload['con_tabla_base']} con tabla · {payload['certificadas']} certificadas."
    )
    print(json.dumps(payload["acciones"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
