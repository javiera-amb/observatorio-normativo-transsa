from __future__ import annotations

import csv
import json
import math
import re
import unicodedata
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from openpyxl import Workbook, load_workbook

FIELDS = [
    "COMUNA","RIALCOMSII","CODIGO_PRC","ZONA","USO","SUBZONA_USO","EDIF","SUBZONA_EDIF",
    "DEFINICION_ZONA","ESPECIF_GENERAL","ESPECIF_ESPECIF","UPERM","UPROH","TABLA",
    "DETALLE_TABLA_ORDENANZA","DENS_HAB_HA","DENS_VIV_HA","SUB_PREDIAL","CONSTRUCCION",
    "OCUPACION","OCUPACION_SUP","PISOS_MAX","ALTURA_MIN","ALTURA_MAX","ARBORIZACION","PAGE",
    "AREA_LIBRE_MIN","AGRUPAMIENTO","RASANTE","DIST_MEDIANEROS","ADOSAMIENTO","ANTEJARDIN",
    "INCENTIVO","FUENTE","COMENTS_NORM",
]

NULL_LITERALS = {"NULL", "N/A", "N/D", "-"}
GROUP_ORDER = ["AISLADO", "PAREADO", "CONTINUO"]
NUMERIC_DECIMAL = {
    "DENS_HAB_HA", "DENS_VIV_HA", "SUB_PREDIAL", "CONSTRUCCION", "OCUPACION",
    "OCUPACION_SUP", "ALTURA_MIN", "ALTURA_MAX", "AREA_LIBRE_MIN",
}
OCR_PATTERN = re.compile(r"(^|[^A-Z])[OPIl][.,]?\d|\d[.,]?[OIl]($|[^A-Z])", re.I)


@dataclass
class Finding:
    row: int
    field: str
    original: Any
    proposed: Any
    status: str
    confidence: str
    reason: str
    source: str = ""
    page: str = ""
    rule_id: str = ""


def _plain(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return value


def _clean_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = re.sub(r"[\u200B-\u200D\uFEFF]", "", value)
    return re.sub(r"\s+", " ", value).strip()


def _numeric(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = _clean_text(str(value))
    if re.fullmatch(r"-?\d+(?:[.,]\d+)?", text):
        try:
            return float(text.replace(",", "."))
        except ValueError:
            return None
    return None


def _rule_key(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", text).strip().upper()


def _same_value(left: Any, right: Any) -> bool:
    left_num = _numeric(left)
    right_num = _numeric(right)
    if left_num is not None and right_num is not None:
        return abs(left_num - right_num) < 1e-9
    return _rule_key(left) == _rule_key(right)


def _row_signature(row: dict[str, Any]) -> str:
    return json.dumps([row.get(field, "") for field in FIELDS], ensure_ascii=False, default=str)


def load_rule_catalog(path: str | Path | None) -> dict[str, Any]:
    if not path:
        return {"exact_rules": []}
    rule_path = Path(path)
    if not rule_path.exists():
        return {"exact_rules": []}
    return json.loads(rule_path.read_text(encoding="utf-8"))


def _matching_rule(
    row: dict[str, Any], field: str, original: Any, catalog: dict[str, Any]
) -> dict[str, Any] | None:
    for rule in catalog.get("exact_rules", []):
        if _rule_key(rule.get("comuna")) != _rule_key(row.get("COMUNA")):
            continue
        if rule.get("field") != field:
            continue
        if not _same_value(rule.get("original"), original):
            continue
        instrument = rule.get("instrumento")
        if instrument and _rule_key(instrument) not in _rule_key(row.get("FUENTE")):
            continue
        where = rule.get("where") or {}
        if any(not _same_value(row.get(where_field), expected) for where_field, expected in where.items()):
            continue
        return rule
    return None


def _apply_rule(
    row_number: int,
    row: dict[str, Any],
    field: str,
    value: Any,
    findings: list[Finding],
    catalog: dict[str, Any],
) -> Any:
    rule = _matching_rule(row, field, value, catalog)
    if not rule:
        return value

    confidence = str(rule.get("confidence", "MEDIA")).upper()
    proposed = rule.get("corrected", value)
    auto_apply = confidence == "ALTA" and bool(rule.get("auto_apply", True))

    # CODIGO_PRC es identificador productivo y se preserva por defecto.
    # Incluso una regla de alta confianza necesita una autorización explícita adicional.
    if field == "CODIGO_PRC" and not bool(rule.get("allow_codigo_prc_change", False)):
        findings.append(Finding(
            row=row_number,
            field=field,
            original=value,
            proposed=proposed,
            status="POSIBLE ERROR",
            confidence=confidence,
            reason=(rule.get("reason", "Regla normativa detectada.") +
                    " CODIGO_PRC se conserva porque la regla no autoriza expresamente su modificación."),
            source=rule.get("source", ""),
            page=str(rule.get("page", "")),
            rule_id=rule.get("id", ""),
        ))
        return value

    status = "ERROR CONFIRMADO" if confidence == "ALTA" else "POSIBLE ERROR"
    findings.append(Finding(
        row=row_number,
        field=field,
        original=value,
        proposed=proposed,
        status=status,
        confidence=confidence,
        reason=rule.get("reason", "Corrección respaldada por regla normativa específica."),
        source=rule.get("source", ""),
        page=str(rule.get("page", "")),
        rule_id=rule.get("id", ""),
    ))
    return proposed if auto_apply else value


def _normalize_cell(row_number: int, field: str, value: Any, findings: list[Finding]) -> Any:
    value = _plain(value)
    original = value

    if isinstance(value, str):
        cleaned = _clean_text(value)
        if cleaned.upper() in NULL_LITERALS:
            findings.append(Finding(
                row_number, field, original, "", "NORMALIZACIÓN DE FORMATO", "ALTA",
                "Literal de ausencia reemplazado por vacío."
            ))
            return ""
        if cleaned != value:
            findings.append(Finding(
                row_number, field, original, cleaned, "NORMALIZACIÓN DE FORMATO", "ALTA",
                "Espacios o caracteres invisibles normalizados."
            ))
        value = cleaned

    if field == "AGRUPAMIENTO" and value:
        tokens = [token.strip().upper() for token in re.split(r"[;,/]+", str(value)) if token.strip()]
        if tokens and all(token in GROUP_ORDER for token in tokens):
            proposed = "; ".join(item for item in GROUP_ORDER if item in tokens)
            if proposed != str(value):
                findings.append(Finding(
                    row_number, field, original, proposed, "NORMALIZACIÓN DE FORMATO", "ALTA",
                    "Agrupamiento normalizado en una sola celda; nunca se crean filas por alternativas."
                ))
            value = proposed

    if field in NUMERIC_DECIMAL and isinstance(value, str):
        num = _numeric(value)
        if num is not None:
            if str(value) != str(num):
                findings.append(Finding(
                    row_number, field, original, num, "NORMALIZACIÓN DE FORMATO", "ALTA",
                    "Valor convertido a tipo numérico sin alterar su magnitud."
                ))
            value = num

    if field == "PISOS_MAX" and isinstance(value, str):
        num = _numeric(value)
        if num is not None and num.is_integer():
            proposed = int(num)
            if str(value) != str(proposed):
                findings.append(Finding(
                    row_number, field, original, proposed, "NORMALIZACIÓN DE FORMATO", "ALTA",
                    "PISOS_MAX convertido a entero."
                ))
            value = proposed

    return value


def audit_table(
    headers: list[str], rows: list[dict[str, Any]], rule_catalog: dict[str, Any] | None = None
) -> dict[str, Any]:
    rule_catalog = rule_catalog or {"exact_rules": []}
    findings: list[Finding] = []
    normalized_rows: list[dict[str, Any]] = []
    missing = [field for field in FIELDS if field not in headers]
    extras = [field for field in headers if field not in FIELDS]

    if missing:
        findings.append(Finding(
            0, "ESTRUCTURA", ", ".join(missing), "", "ERROR CONFIRMADO", "ALTA",
            "Faltan campos productivos obligatorios."
        ))
    if extras:
        findings.append(Finding(
            0, "ESTRUCTURA", ", ".join(extras), "", "POSIBLE ERROR", "MEDIA",
            "Existen columnas adicionales; se excluyen de la salida de 35 campos sin alterar las filas."
        ))
    if len(headers) >= len(FIELDS) and not missing and headers[:len(FIELDS)] != FIELDS:
        findings.append(Finding(
            0, "ESTRUCTURA", " | ".join(headers[:len(FIELDS)]), " | ".join(FIELDS),
            "NORMALIZACIÓN DE FORMATO", "ALTA", "Los campos productivos se ordenan al contrato oficial de 35 campos."
        ))

    # Regla estructural central: una fila de entrada produce exactamente una fila de salida.
    for index, source_row in enumerate(rows, start=2):
        row = {field: _normalize_cell(index, field, source_row.get(field, ""), findings) for field in FIELDS}
        for field in FIELDS:
            row[field] = _apply_rule(index, row, field, row[field], findings, rule_catalog)
        normalized_rows.append(row)

        code = str(row.get("CODIGO_PRC", "") or "").strip()
        if code and (len(code) > 45 or len(re.findall(r"\s+", code)) >= 4):
            findings.append(Finding(
                index, "CODIGO_PRC", code, "", "POSIBLE ERROR", "MEDIA",
                "CODIGO_PRC parece descriptivo; se conserva hasta demostrar que el identificador es incorrecto."
            ))

        pisos = row.get("PISOS_MAX")
        pisos_num = _numeric(pisos)
        if pisos_num is not None and not pisos_num.is_integer():
            findings.append(Finding(
                index, "PISOS_MAX", pisos, "", "POSIBLE ERROR", "ALTA",
                "PISOS_MAX es decimal; no se trunca sin fuente oficial."
            ))

        for field in ["CONSTRUCCION", "OCUPACION", "OCUPACION_SUP", "ALTURA_MIN", "ALTURA_MAX", "AREA_LIBRE_MIN"]:
            value = row.get(field)
            num = _numeric(value)
            if num is not None and num < 0:
                findings.append(Finding(
                    index, field, value, "", "POSIBLE ERROR", "MEDIA",
                    "Valor negativo que normalmente no corresponde a este parámetro."
                ))
            if isinstance(value, str) and OCR_PATTERN.search(value):
                findings.append(Finding(
                    index, field, value, "", "POSIBLE ERROR", "MEDIA",
                    "Patrón compatible con OCR O/0, P/0 o I/l/1; no se autocorrige sin fuente."
                ))

        amin = _numeric(row.get("ALTURA_MIN"))
        amax = _numeric(row.get("ALTURA_MAX"))
        if amin is not None and amax is not None and amin > amax:
            findings.append(Finding(
                index, "ALTURA_MIN / ALTURA_MAX", f"{row.get('ALTURA_MIN')} > {row.get('ALTURA_MAX')}", "",
                "ERROR CONFIRMADO", "ALTA", "ALTURA_MIN es mayor que ALTURA_MAX."
            ))

        if re.search(r"AISLADO|PAREADO|CONTINUO", str(row.get("AREA_LIBRE_MIN", "")), re.I):
            findings.append(Finding(
                index, "AREA_LIBRE_MIN", row.get("AREA_LIBRE_MIN"), "", "POSIBLE ERROR", "MEDIA",
                "Contenido compatible con AGRUPAMIENTO; posible desplazamiento de columnas."
            ))
        if re.search(r"AISLADO|PAREADO|CONTINUO", str(row.get("RASANTE", "")), re.I):
            findings.append(Finding(
                index, "RASANTE", row.get("RASANTE"), "", "POSIBLE ERROR", "MEDIA",
                "Contenido incompatible con rasante; posible desplazamiento de columnas."
            ))

    # Filas con atributos iguales pueden corresponder a polígonos distintos.
    # Se conservan siempre y, a lo sumo, se señalan para revisión.
    seen: dict[str, int] = {}
    for index, row in enumerate(normalized_rows, start=2):
        signature = _row_signature(row)
        if signature in seen:
            findings.append(Finding(
                index, "FILA", f"Atributos iguales a fila {seen[signature]}", "", "POSIBLE ERROR", "BAJA",
                "Las filas no se fusionan ni eliminan: pueden representar polígonos distintos con igual normativa."
            ))
        else:
            seen[signature] = index

    assert len(normalized_rows) == len(rows), "La auditoría no puede cambiar la cantidad de filas/polígonos."

    critical = sum(f.status == "ERROR CONFIRMADO" for f in findings)
    possible = sum(f.status == "POSIBLE ERROR" for f in findings)
    formatting = sum(f.status == "NORMALIZACIÓN DE FORMATO" for f in findings)
    conflicts = sum(f.status == "CONFLICTO NORMATIVO" for f in findings)

    return {
        "headers": headers,
        "rows": normalized_rows,
        "findings": [asdict(item) for item in findings],
        "missing": missing,
        "extras": extras,
        "critical": critical,
        "possible": possible,
        "formatting": formatting,
        "conflicts": conflicts,
        "input_rows": len(rows),
        "output_rows": len(normalized_rows),
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }


def _read_csv(path: Path) -> tuple[list[str], list[dict[str, Any]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = [str(item or "").strip() for item in (reader.fieldnames or [])]
        rows = [{str(key or "").strip(): value for key, value in row.items()} for row in reader]
    return headers, rows


def _read_xlsx(path: Path) -> tuple[list[str], list[dict[str, Any]]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook[workbook.sheetnames[0]]
    matrix = sheet.iter_rows(values_only=True)
    try:
        headers = [str(value or "").strip() for value in next(matrix)]
    except StopIteration:
        return [], []
    rows = []
    for values in matrix:
        if not any(value not in (None, "") for value in values):
            continue
        rows.append({header: (values[index] if index < len(values) else "") for index, header in enumerate(headers)})
    return headers, rows


def read_table(path: str | Path) -> tuple[list[str], list[dict[str, Any]]]:
    path = Path(path)
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return _read_csv(path)
    if suffix in {".xlsx", ".xlsm"}:
        return _read_xlsx(path)
    raise ValueError(f"Formato no soportado: {suffix}")


def _write_table_xlsx(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "TABLA_NORMALIZADA"
    sheet.append(FIELDS)
    for row in rows:
        sheet.append([row.get(field, "") for field in FIELDS])
    workbook.save(path)


def _write_qa_xlsx(path: Path, comuna: str, findings: list[dict[str, Any]]) -> None:
    columns = [
        "COMUNA", "FILA", "CAMPO", "VALOR_ORIGINAL", "VALOR_NUEVO", "ESTADO", "CONFIANZA",
        "MOTIVO", "FUENTE", "PAGE", "REGLA"
    ]
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "QA_TRAZABILIDAD"
    sheet.append(columns)
    for finding in findings:
        sheet.append([
            comuna,
            finding.get("row", ""), finding.get("field", ""), finding.get("original", ""), finding.get("proposed", ""),
            finding.get("status", ""), finding.get("confidence", ""), finding.get("reason", ""), finding.get("source", ""),
            finding.get("page", ""), finding.get("rule_id", ""),
        ])
    workbook.save(path)


def process_file(
    input_path: str | Path,
    normalized_dir: str | Path,
    qa_dir: str | Path,
    rule_catalog_path: str | Path | None = None,
) -> dict[str, Any]:
    input_path = Path(input_path)
    normalized_dir = Path(normalized_dir)
    qa_dir = Path(qa_dir)
    normalized_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)

    headers, rows = read_table(input_path)
    catalog = load_rule_catalog(rule_catalog_path)
    result = audit_table(headers, rows, catalog)
    comuna = str(result["rows"][0].get("COMUNA", "") if result["rows"] else "").strip() or input_path.stem
    safe = re.sub(
        r"[^A-Za-z0-9]+", "_",
        unicodedata.normalize("NFD", comuna).encode("ascii", "ignore").decode()
    ).strip("_").upper()

    normalized_path = normalized_dir / f"PRC_{safe}_NORMALIZADO.xlsx"
    qa_path = qa_dir / f"QA_PRC_{safe}.xlsx"
    status_path = qa_dir / f"STATUS_PRC_{safe}.json"

    _write_table_xlsx(normalized_path, result["rows"])
    _write_qa_xlsx(qa_path, comuna, result["findings"])

    requires_review = any(
        finding["status"] in {"POSIBLE ERROR", "CONFLICTO NORMATIVO"} or
        (finding["status"] == "ERROR CONFIRMADO" and finding["confidence"] != "ALTA")
        for finding in result["findings"]
    )
    status = {
        "comuna": comuna,
        "source_file": input_path.name,
        "normalized_file": normalized_path.name,
        "qa_file": qa_path.name,
        "input_rows": result["input_rows"],
        "output_rows": result["output_rows"],
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
