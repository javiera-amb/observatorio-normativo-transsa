from __future__ import annotations

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3 as v3


def _row(**values):
    row = {field: "" for field in base.FIELDS}
    row.update({"COMUNA": "PEÑALOLÉN", "RIALCOMSII": 15152})
    row.update(values)
    return row


def test_source_check_corrects_only_explicit_field_and_keeps_row_count():
    rows = [
        _row(CODIGO_PRC="15152-EQ-4", ZONA="EQ-4", OCUPACION=555),
        _row(CODIGO_PRC="15152-R5", ZONA="R5", OCUPACION=0.2),
    ]
    catalog = {
        "source_checks": [
            {
                "id": "eq4",
                "comuna": "PEÑALOLÉN",
                "where": {"ZONA": "EQ-4"},
                "expected": {"OCUPACION": 0.2},
                "auto_apply_fields": ["OCUPACION"],
                "confidence": "ALTA",
                "source": "Fuente oficial",
            }
        ],
        "review_rules": [],
    }

    result = v3.audit_table(base.FIELDS, rows, source_catalog=catalog)

    assert result["input_rows"] == 2
    assert result["output_rows"] == 2
    assert [row["CODIGO_PRC"] for row in result["rows"]] == ["15152-EQ-4", "15152-R5"]
    assert result["rows"][0]["OCUPACION"] == 0.2
    assert any(
        item["status"] == "ERROR CONFIRMADO"
        and item["field"] == "OCUPACION"
        and item["row"] == 2
        for item in result["findings"]
    )


def test_source_check_records_coincide_when_value_is_correct():
    rows = [_row(CODIGO_PRC="15152-EQ-2", ZONA="EQ-2", SUB_PREDIAL=10000)]
    catalog = {
        "source_checks": [
            {
                "id": "eq2",
                "comuna": "PEÑALOLÉN",
                "where": {"ZONA": "EQ-2"},
                "expected": {"SUB_PREDIAL": 10000},
                "confidence": "ALTA",
            }
        ],
        "review_rules": [],
    }

    result = v3.audit_table(base.FIELDS, rows, source_catalog=catalog)
    assert result["rows"][0]["SUB_PREDIAL"] == 10000
    assert result["matches"] == 1
    assert any(item["status"] == "COINCIDE" for item in result["findings"])


def test_codigo_prc_is_preserved_without_explicit_authorization():
    rows = [_row(CODIGO_PRC="15152-ART 5.2.2.", ZONA="ART 5.2.2.")]
    catalog = {
        "source_checks": [
            {
                "id": "codigo-review",
                "comuna": "PEÑALOLÉN",
                "where": {"ZONA": "ART 5.2.2."},
                "expected": {"CODIGO_PRC": "15152-RX"},
                "auto_apply_fields": ["CODIGO_PRC"],
                "confidence": "ALTA",
            }
        ],
        "review_rules": [],
    }

    result = v3.audit_table(base.FIELDS, rows, source_catalog=catalog)
    assert result["rows"][0]["CODIGO_PRC"] == "15152-ART 5.2.2."
    assert any(
        item["field"] == "CODIGO_PRC" and item["status"] == "POSIBLE ERROR"
        for item in result["findings"]
    )


def test_review_rule_never_changes_sql2_article_label():
    rows = [_row(CODIGO_PRC="15152-ART 1 Trans.", ZONA="ART 1 Trans.")]
    catalog = {
        "source_checks": [],
        "review_rules": [
            {
                "id": "art1",
                "comuna": "PEÑALOLÉN",
                "where": {"ZONA": "ART 1 Trans."},
                "field": "ZONA",
                "status": "POSIBLE ERROR",
                "confidence": "MEDIA",
                "reason": "Requiere ámbito espacial.",
            }
        ],
    }

    result = v3.audit_table(base.FIELDS, rows, source_catalog=catalog)
    assert result["rows"][0]["ZONA"] == "ART 1 Trans."
    assert result["rows"][0]["CODIGO_PRC"] == "15152-ART 1 Trans."
    assert any(item["rule_id"] == "art1" for item in result["findings"])
