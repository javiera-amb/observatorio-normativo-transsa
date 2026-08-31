from __future__ import annotations

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3 as v3


def test_conditional_grouping_rule_matches_after_delimiter_normalization():
    row = {field: "" for field in base.FIELDS}
    row.update({
        "COMUNA": "PEÑALOLÉN",
        "RIALCOMSII": 15152,
        "CODIGO_PRC": "15152-ZHM-3",
        "ZONA": "ZHM-3",
        "SUB_PREDIAL": 200,
        "AGRUPAMIENTO": "AISLADO, PAREADO, CONTINUO",
    })
    conditional = {
        "conditional_rules": [{
            "id": "zmh3",
            "comuna": "PEÑALOLÉN",
            "where": {"ZONA": "ZHM-3", "SUB_PREDIAL": "200"},
            "field": "AGRUPAMIENTO",
            "original": "AISLADO, PAREADO, CONTINUO",
            "corrected": "AISLADO",
            "status": "ERROR CONFIRMADO",
            "confidence": "ALTA",
            "auto_apply": True,
        }]
    }

    result = v3.audit_table(
        base.FIELDS,
        [row],
        conditional_rule_catalog=conditional,
        source_catalog={"source_checks": [], "review_rules": []},
    )

    assert result["input_rows"] == 1
    assert result["output_rows"] == 1
    assert result["rows"][0]["AGRUPAMIENTO"] == "AISLADO"
    assert any(
        item["rule_id"] == "zmh3" and item["status"] == "ERROR CONFIRMADO"
        for item in result["findings"]
    )
