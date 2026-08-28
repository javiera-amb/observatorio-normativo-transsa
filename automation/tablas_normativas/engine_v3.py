from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from . import engine as base
from . import engine_v2 as v2

FIELDS = base.FIELDS


def load_source_catalog(path: str | Path | None) -> dict[str, Any]:
    if not path:
        return {"source_checks": []}
    source_path = Path(path)
    if not source_path.exists():
        return {"source_checks": []}
    return json.loads(source_path.read_text(encoding="utf-8"))


def apply_source_checks(result: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    findings = result["findings"]
    checked_fields = 0
    matches = 0
    source_errors = 0

    for row_number, row in enumerate(result["rows"], start=2):
        for check in catalog.get("source_checks", []):
            if v2._key(check.get("comuna")) != v2._key(row.get("COMUNA")):
                continue
            if not v2._matches_where(row, check):
                continue

            for field, expected in (check.get("expect") or {}).items():
                if field not in FIELDS:
                    continue
                checked_fields += 1
                actual = row.get(field, "")
                is_match = v2._same(actual, expected)
                if is_match:
                    matches += 1
                    findings.append({
                        "row": row_number,
                        "field": field,
                        "original": actual,
                        "proposed": expected,
                        "status": "COINCIDE",
                        "confidence": str(check.get("confidence", "ALTA")).upper(),
                        "reason": str(check.get("reason", "Valor contrastado con fuente normativa oficial.")),
                        "source": str(check.get("source", "")),
                        "page": str(check.get("page", "")),
                        "rule_id": str(check.get("id", "")),
                        "source_url": str(check.get("source_url", "")),
                    })
                    continue

                source_errors += 1
                confidence = str(check.get("confidence", "ALTA")).upper()
                findings.append({
                    "row": row_number,
                    "field": field,
                    "original": actual,
                    "proposed": expected,
                    "status": "ERROR CONFIRMADO",
                    "confidence": confidence,
                    "reason": str(check.get("reason", "El valor no coincide con la fuente normativa oficial.")),
                    "source": str(check.get("source", "")),
                    "page": str(check.get("page", "")),
                    "rule_id": str(check.get("id", "")),
                    "source_url": str(check.get("source_url", "")),
                })
                if confidence == "ALTA" and bool(check.get("auto_apply", True)):
                    row[field] = expected

    result["critical"] = sum(item.get("status") == "ERROR CONFIRMADO" for item in findings)
    result["possible"] = sum(item.get("status") == "POSIBLE ERROR" for item in findings)
    result["formatting"] = sum(item.get("status") == "NORMALIZACIÓN DE FORMATO" for item in findings)
    result["conflicts"] = sum(item.get("status") == "CONFLICTO NORMATIVO" for item in findings)
    result["coincide"] = sum(item.get("status") == "COINCIDE" for item in findings)
    result["source_checked_fields"] = checked_fields
    result["source_matches"] = matches
    result["source_errors"] = source_errors
    return result


def audit_table(
    headers: list[str],
    rows: list[dict[str, Any]],
    exact_rule_catalog: dict[str, Any] | None = None,
    conditional_rule_catalog: dict[str, Any] | None = None,
    source_catalog: dict[str, Any] | None = None,
) -> dict[str, Any]:
    result = v2.audit_table(headers, rows, exact_rule_catalog, conditional_rule_catalog)
    return apply_source_checks(result, source_catalog or {"source_checks": []})


def process_file(
    input_path: str | Path,
    normalized_dir: str | Path,
    qa_dir: str | Path,
    exact_rule_catalog_path: str | Path | None = None,
    conditional_rule_catalog_path: str | Path | None = None,
    source_catalog_path: str | Path | None = None,
) -> dict[str, Any]:
    input_path = Path(input_path)
    normalized_dir = Path(normalized_dir)
    qa_dir = Path(qa_dir)
    normalized_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)

    headers, rows = base.read_table(input_path)
    exact_catalog = base.load_rule_catalog(exact_rule_catalog_path)
    conditional_catalog = v2.load_conditional_catalog(conditional_rule_catalog_path)
    source_catalog = load_source_catalog(source_catalog_path)
    result = audit_table(headers, rows, exact_catalog, conditional_catalog, source_catalog)

    comuna = str(result["rows"][0].get("COMUNA", "") if result["rows"] else "").strip() or input_path.stem
    safe = re.sub(
        r"[^A-Za-z0-9]+",
        "_",
        unicodedata.normalize("NFD", comuna).encode("ascii", "ignore").decode(),
    ).strip("_").upper()

    normalized_path = normalized_dir / f"PRC_{safe}_NORMALIZADO.xlsx"
    qa_path = qa_dir / f"QA_PRC_{safe}.xlsx"
    status_path = qa_dir / f"STATUS_PRC_{safe}.json"

    base._write_table_xlsx(normalized_path, result["rows"])
    v2._write_qa_xlsx(qa_path, comuna, result["findings"])

    requires_review = any(
        finding.get("status") in {"POSIBLE ERROR", "CONFLICTO NORMATIVO"}
        or (finding.get("status") == "ERROR CONFIRMADO" and finding.get("confidence") != "ALTA")
        for finding in result["findings"]
    )
    status = {
        "comuna": comuna,
        "source_file": input_path.name,
        "normalized_file": normalized_path.name,
        "qa_file": qa_path.name,
        "critical": result["critical"],
        "possible": result["possible"],
        "formatting": result["formatting"],
        "conflicts": result["conflicts"],
        "coincide": result.get("coincide", 0),
        "source_checked_fields": result.get("source_checked_fields", 0),
        "source_matches": result.get("source_matches", 0),
        "source_errors": result.get("source_errors", 0),
        "state": "REQUIERE_REVISION" if requires_review else "CORREGIDA",
        "processed_at": result["processed_at"],
    }
    status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        **status,
        "normalized_path": str(normalized_path),
        "qa_path": str(qa_path),
        "status_path": str(status_path),
    }
