from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from openpyxl import Workbook

from . import engine as base

FIELDS = base.FIELDS


def _numeric(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value or "").strip().replace(",", ".")
    if re.fullmatch(r"-?\d+(?:\.\d+)?", text):
        try:
            return float(text)
        except ValueError:
            return None
    return None


def _key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", text).strip().upper()


def _same(left: Any, right: Any) -> bool:
    left_num = _numeric(left)
    right_num = _numeric(right)
    if left_num is not None and right_num is not None:
        return abs(left_num - right_num) < 1e-9
    return _key(left) == _key(right)


def load_conditional_catalog(path: str | Path | None) -> dict[str, Any]:
    if not path:
        return {"conditional_rules": []}
    rule_path = Path(path)
    if not rule_path.exists():
        return {"conditional_rules": []}
    return json.loads(rule_path.read_text(encoding="utf-8"))


def _matches_where(row: dict[str, Any], rule: dict[str, Any]) -> bool:
    if _key(rule.get("comuna")) != _key(row.get("COMUNA")):
        return False
    for field, expected in (rule.get("where") or {}).items():
        if field not in FIELDS or not _same(row.get(field), expected):
            return False
    return True


def apply_conditional_rules(result: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    findings = result["findings"]
    original_row_count = len(result["rows"])

    for row_number, row in enumerate(result["rows"], start=2):
        for rule in catalog.get("conditional_rules", []):
            field = rule.get("field")
            if field not in FIELDS or not _matches_where(row, rule):
                continue

            original = row.get(field, "")
            if "original" in rule and not _same(original, rule.get("original")):
                continue

            corrected = rule.get("corrected", original)
            confidence = str(rule.get("confidence", "MEDIA")).upper()
            source = str(rule.get("source", ""))
            source_url = str(rule.get("source_url", ""))
            auto_apply = confidence == "ALTA" and bool(rule.get("auto_apply", True))

            if field == "CODIGO_PRC" and not bool(rule.get("allow_codigo_prc_change", False)):
                findings.append({
                    "row": row_number,
                    "field": field,
                    "original": original,
                    "proposed": corrected,
                    "status": "POSIBLE ERROR",
                    "confidence": confidence,
                    "reason": (
                        str(rule.get("reason", "Regla normativa condicionada detectada."))
                        + " CODIGO_PRC se conserva porque la regla no autoriza expresamente su modificación."
                    ),
                    "source": source,
                    "page": str(rule.get("page", "")),
                    "rule_id": str(rule.get("id", "")),
                    "source_url": source_url,
                })
                continue

            status = str(rule.get("status", "ERROR CONFIRMADO" if confidence == "ALTA" else "POSIBLE ERROR"))
            findings.append({
                "row": row_number,
                "field": field,
                "original": original,
                "proposed": corrected,
                "status": status,
                "confidence": confidence,
                "reason": str(rule.get("reason", "Corrección respaldada por regla normativa condicionada.")),
                "source": source,
                "page": str(rule.get("page", "")),
                "rule_id": str(rule.get("id", "")),
                "source_url": source_url,
            })
            if auto_apply:
                row[field] = corrected

    assert len(result["rows"]) == original_row_count, "Las reglas condicionadas no pueden cambiar la cantidad de filas/polígonos."
    result["input_rows"] = result.get("input_rows", original_row_count)
    result["output_rows"] = len(result["rows"])
    result["critical"] = sum(item.get("status") == "ERROR CONFIRMADO" for item in findings)
    result["possible"] = sum(item.get("status") == "POSIBLE ERROR" for item in findings)
    result["formatting"] = sum(item.get("status") == "NORMALIZACIÓN DE FORMATO" for item in findings)
    result["conflicts"] = sum(item.get("status") == "CONFLICTO NORMATIVO" for item in findings)
    return result


def audit_table(
    headers: list[str],
    rows: list[dict[str, Any]],
    exact_rule_catalog: dict[str, Any] | None = None,
    conditional_rule_catalog: dict[str, Any] | None = None,
) -> dict[str, Any]:
    result = base.audit_table(headers, rows, exact_rule_catalog)
    return apply_conditional_rules(result, conditional_rule_catalog or {"conditional_rules": []})


def _write_qa_xlsx(path: Path, comuna: str, findings: list[dict[str, Any]]) -> None:
    columns = [
        "COMUNA", "FILA", "CAMPO", "VALOR_ORIGINAL", "VALOR_NUEVO", "ESTADO", "CONFIANZA",
        "MOTIVO", "FUENTE", "PAGE", "URL_FUENTE", "REGLA"
    ]
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "QA_TRAZABILIDAD"
    sheet.append(columns)
    for finding in findings:
        sheet.append([
            comuna,
            finding.get("row", ""),
            finding.get("field", ""),
            finding.get("original", ""),
            finding.get("proposed", ""),
            finding.get("status", ""),
            finding.get("confidence", ""),
            finding.get("reason", ""),
            finding.get("source", ""),
            finding.get("page", ""),
            finding.get("source_url", ""),
            finding.get("rule_id", ""),
        ])
    workbook.save(path)


def process_file(
    input_path: str | Path,
    normalized_dir: str | Path,
    qa_dir: str | Path,
    exact_rule_catalog_path: str | Path | None = None,
    conditional_rule_catalog_path: str | Path | None = None,
) -> dict[str, Any]:
    input_path = Path(input_path)
    normalized_dir = Path(normalized_dir)
    qa_dir = Path(qa_dir)
    normalized_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)

    headers, rows = base.read_table(input_path)
    exact_catalog = base.load_rule_catalog(exact_rule_catalog_path)
    conditional_catalog = load_conditional_catalog(conditional_rule_catalog_path)
    result = audit_table(headers, rows, exact_catalog, conditional_catalog)

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
    _write_qa_xlsx(qa_path, comuna, result["findings"])

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
        "input_rows": result.get("input_rows", len(rows)),
        "output_rows": result.get("output_rows", len(result["rows"])),
        "critical": result["critical"],
        "possible": result["possible"],
        "formatting": result["formatting"],
        "conflicts": result["conflicts"],
        "codigo_prc_policy": "PRESERVAR; sólo cambia con allow_codigo_prc_change=true y confianza ALTA",
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
