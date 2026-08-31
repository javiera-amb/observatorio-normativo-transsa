from automation.tablas_normativas.runner_v3 import (
    _blocking_findings,
    _filter_resolved_rules,
    _mark_confirmed_resolution,
)


def test_error_confirmado_aplicado_no_bloquea():
    result = {
        "rows": [{"CONSTRUCCION": 1.4}],
        "findings": [
            {
                "row": 2,
                "field": "CONSTRUCCION",
                "original": 21.4,
                "proposed": 1.4,
                "status": "ERROR CONFIRMADO",
                "confidence": "ALTA",
            }
        ],
    }
    _mark_confirmed_resolution(result)
    assert result["findings"][0]["resolved"] is True
    assert result["confirmed_unresolved"] == 0
    assert _blocking_findings(result["findings"]) == []


def test_error_confirmado_no_aplicado_bloquea_publicacion():
    result = {
        "rows": [{"SUB_PREDIAL": 500}],
        "findings": [
            {
                "row": 2,
                "field": "SUB_PREDIAL",
                "original": 500,
                "proposed": 5000,
                "status": "ERROR CONFIRMADO",
                "confidence": "ALTA",
            }
        ],
    }
    _mark_confirmed_resolution(result)
    assert result["findings"][0]["resolved"] is False
    assert result["confirmed_unresolved"] == 1
    assert len(_blocking_findings(result["findings"])) == 1


def test_posible_error_medio_sigue_bloqueando():
    findings = [
        {
            "row": 2,
            "field": "ZONA",
            "status": "POSIBLE ERROR",
            "confidence": "MEDIA",
        }
    ]
    assert len(_blocking_findings(findings)) == 1


def test_revisiones_resueltas_se_excluyen_sin_borrar_otras():
    exact = {
        "exact_rules": [
            {"id": "riesgo-revisado"},
            {"id": "otra-regla"},
        ]
    }
    source = {
        "source_checks": [{"id": "check-oficial"}],
        "review_rules": [
            {"id": "articulo-prms-revisado"},
            {"id": "revision-pendiente"},
        ],
    }
    resolutions = {
        "resolved_exact_rule_ids": ["riesgo-revisado"],
        "resolved_review_rule_ids": ["articulo-prms-revisado"],
    }
    filtered_exact, filtered_source = _filter_resolved_rules(exact, source, resolutions)
    assert [item["id"] for item in filtered_exact["exact_rules"]] == ["otra-regla"]
    assert [item["id"] for item in filtered_source["source_checks"]] == ["check-oficial"]
    assert [item["id"] for item in filtered_source["review_rules"]] == ["revision-pendiente"]
