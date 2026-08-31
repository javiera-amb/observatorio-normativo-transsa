from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from . import engine as base
from . import engine_v2 as v2

FIELDS = base.FIELDS
_GROUPS = {"AISLADO", "PAREADO", "CONTINUO"}


def _group_tokens(value: Any) -> list[str] | None:
    tokens = [
        token.strip().upper()
        for token in re.split(r"[;,/]+", str(value or ""))
        if token.strip()
    ]
    if not tokens or not all(token in _GROUPS for token in tokens):
        return None
    return sorted(set(tokens))


def _semantic_same(left: Any, right: Any) -> bool:
    """Compara valores normalizados y trata , ; / como equivalentes en AGRUPAMIENTO."""
    if v2._same(left, right):
        return True
    left_groups = _group_tokens(left)
    right_groups = _group_tokens(right)
    return left_groups is not None and left_groups == right_groups


def load_source_catalog(path: str | Path | None) -> dict[str, Any]:
    if not path:
        return {"source_checks": [], "review_rules": []}
    source_path = Path(path)
    if not source_path.exists():
        return {"source_checks": [], "review_rules": []}
    payload = json.loads(source_path.read_text(encoding="utf-8"))
    payload.setdefault("source_checks", [])
    payload.setdefault("review_rules", [])
    return payload


def _finding(
    *,
    row: int,
    field: str,
    original: Any,
    proposed: Any,
    status: str,
    confidence: str,
    reason: str,
    source: str,
    page: str,
    rule_id: str,
    source_url: str,
) -> dict[str, Any]:
    return {
        "row": row,
        "field": field,
        "original": original,
        "proposed": proposed,
        "status": status,
        "confidence": confidence,
        "reason": reason,
        "source": source,
        "page": page,
        "rule_id": rule_id,
        "source_url": source_url,
    }


def _matches(row: dict[str, Any], rule: dict[str, Any]) -> bool:
    if v2._key(rule.get("comuna")) != v2._key(row.get("COMUNA")):
        return False
    for field, expected in (rule.get("where") or {}).items():
        if field not in FIELDS or not _semantic_same(row.get(field), expected):
            return False
    return True


def apply_source_checks(result: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    """Compara la tabla ya normalizada por v2 contra valores oficiales explícitos.

    Principios:
    - nunca crea, elimina, fusiona ni reordena filas;
    - COINCIDE registra trazabilidad positiva;
    - una diferencia sólo se autocorrige si la comprobación lo autoriza expresamente;
    - CODIGO_PRC se preserva salvo autorización explícita y error demostrado;
    - las reglas de revisión nunca modifican datos.
    """
    findings = result["findings"]
    original_count = len(result["rows"])

    for row_number, row in enumerate(result["rows"], start=2):
        for check in catalog.get("source_checks", []):
            if not _matches(row, check):
                continue

            confidence = str(check.get("confidence", "ALTA")).upper()
            source = str(check.get("source", ""))
            source_url = str(check.get("source_url", ""))
            page = str(check.get("page", ""))
            check_id = str(check.get("id", ""))
            auto_fields = set(check.get("auto_apply_fields") or [])

            for field, expected in (check.get("expected") or {}).items():
                if field not in FIELDS:
                    continue
                current = row.get(field, "")
                if _semantic_same(current, expected):
                    findings.append(_finding(
                        row=row_number,
                        field=field,
                        original=current,
                        proposed=expected,
                        status="COINCIDE",
                        confidence="ALTA",
                        reason=str(check.get("match_reason", "Valor coincide con la fuente oficial estructurada.")),
                        source=source,
                        page=page,
                        rule_id=check_id,
                        source_url=source_url,
                    ))
                    continue

                if field == "CODIGO_PRC" and not bool(check.get("allow_codigo_prc_change", False)):
                    findings.append(_finding(
                        row=row_number,
                        field=field,
                        original=current,
                        proposed=expected,
                        status="POSIBLE ERROR",
                        confidence=confidence,
                        reason=(
                            str(check.get("reason", "El valor difiere de la referencia oficial."))
                            + " CODIGO_PRC se conserva hasta demostrar que el identificador productivo es incorrecto."
                        ),
                        source=source,
                        page=page,
                        rule_id=check_id,
                        source_url=source_url,
                    ))
                    continue

                status = str(check.get(
                    "error_status",
                    "ERROR CONFIRMADO" if confidence == "ALTA" else "POSIBLE ERROR",
                ))
                findings.append(_finding(
                    row=row_number,
                    field=field,
                    original=current,
                    proposed=expected,
                    status=status,
                    confidence=confidence,
                    reason=str(check.get("reason", "El valor difiere de la fuente oficial estructurada.")),
                    source=source,
                    page=page,
                    rule_id=check_id,
                    source_url=source_url,
                ))

                if (
                    field in auto_fields
                    and confidence == "ALTA"
                    and status == "ERROR CONFIRMADO"
                ):
                    row[field] = expected

        for review in catalog.get("review_rules", []):
            if not _matches(row, review):
                continue
            field = str(review.get("field", "ZONA"))
            if field not in FIELDS:
                continue
            findings.append(_finding(
                row=row_number,
                field=field,
                original=row.get(field, ""),
                proposed=review.get("proposed", ""),
                status=str(review.get("status", "POSIBLE ERROR")),
                confidence=str(review.get("confidence", "MEDIA")).upper(),
                reason=str(review.get("reason", "Revisión manual requerida.")),
                source=str(review.get("source", "")),
                page=str(review.get("page", "")),
                rule_id=str(review.get("id", "")),
                source_url=str(review.get("source_url", "")),
            ))

    assert len(result["rows"]) == original_count, (
        "Los source checks no pueden cambiar la cantidad de filas/polígonos."
    )

    result["input_rows"] = result.get("input_rows", original_count)
    result["output_rows"] = len(result["rows"])
    result["critical"] = sum(item.get("status") == "ERROR CONFIRMADO" for item in findings)
    result["possible"] = sum(item.get("status") == "POSIBLE ERROR" for item in findings)
    result["formatting"] = sum(item.get("status") == "NORMALIZACIÓN DE FORMATO" for item in findings)
    result["conflicts"] = sum(item.get("status") == "CONFLICTO NORMATIVO" for item in findings)
    result["matches"] = sum(item.get("status") == "COINCIDE" for item in findings)
    return result


def audit_table(
    headers: list[str],
    rows: list[dict[str, Any]],
    exact_rule_catalog: dict[str, Any] | None = None,
    conditional_rule_catalog: dict[str, Any] | None = None,
    source_catalog: dict[str, Any] | None = None,
) -> dict[str, Any]:
    # v2 evalúa las reglas condicionadas después de normalizar AGRUPAMIENTO.
    # Se reemplaza el comparador sólo durante esa etapa para que una coma o
    # punto y coma no impida reconocer la misma combinación normativa.
    original_same = v2._same
    v2._same = _semantic_same
    try:
        result = v2.audit_table(
            headers,
            rows,
            exact_rule_catalog,
            conditional_rule_catalog,
        )
    finally:
        v2._same = original_same

    return apply_source_checks(
        result,
        source_catalog or {"source_checks": [], "review_rules": []},
    )


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
    result = audit_table(
        headers,
        rows,
        exact_catalog,
        conditional_catalog,
        source_catalog,
    )

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
        "input_rows": result.get("input_rows", len(rows)),
        "output_rows": result.get("output_rows", len(result["rows"])),
        "critical": result["critical"],
        "possible": result["possible"],
        "formatting": result["formatting"],
        "conflicts": result["conflicts"],
        "matches": result.get("matches", 0),
        "codigo_prc_policy": "PRESERVAR; sólo cambia con autorización explícita y error confirmado",
        "row_policy": "1 fila origen = 1 polígono = 1 fila salida; mismo orden",
        "state": "CON_OBSERVACIONES" if requires_review else "CORREGIDA",
        "processed_at": result["processed_at"],
    }
    status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        **status,
        "normalized_path": str(normalized_path),
        "qa_path": str(qa_path),
        "status_path": str(status_path),
    }
