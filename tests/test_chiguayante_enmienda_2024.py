import json
from pathlib import Path

import pytest

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3
from automation.tablas_normativas.runner_v4 import build_source_bundle


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "config" / "tablas_normativas_fuentes" / "chiguayante.json"


def _catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def _empty_row() -> dict:
    return {field: "" for field in base.FIELDS}


def _chiguayante_rows_222() -> list[dict]:
    rows = []
    for index in range(220):
        row = _empty_row()
        row.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": f"8211-TEST-{index:03d}",
            "ZONA": f"TEST-{index:03d}",
        })
        rows.append(row)

    residencial = _empty_row()
    residencial.update({
        "COMUNA": "CHIGUAYANTE",
        "RIALCOMSII": 8211,
        "CODIGO_PRC": "8211-RI",
        "ZONA": "RI",
        "ESPECIF_ESPECIF": "RESIDENCIAL",
        "DENS_HAB_HA": 12,
        "OCUPACION": 0.05,
        "CONSTRUCCION": 0.2,
    })
    rows.append(residencial)

    otros = _empty_row()
    otros.update({
        "COMUNA": "CHIGUAYANTE",
        "RIALCOMSII": 8211,
        "CODIGO_PRC": "8211-R1",
        "ZONA": "R1",
        "ESPECIF_ESPECIF": "EQUIPAMIENTO",
        "DENS_HAB_HA": 12,
        "OCUPACION": 0.1,
        "CONSTRUCCION": 0.3,
    })
    rows.append(otros)
    return rows


def test_enmienda_chiguayante_corrige_zr1_sin_cambiar_codigos_y_conserva_222_filas():
    rows = _chiguayante_rows_222()
    result = engine_v3.audit_table(base.FIELDS, rows, source_catalog=_catalog())

    assert len(result["rows"]) == 222
    assert result["input_rows"] == 222
    assert result["output_rows"] == 222

    residencial = result["rows"][220]
    assert residencial["CODIGO_PRC"] == "8211-RI"
    assert residencial["ZONA"] == "RI"
    assert residencial["DENS_HAB_HA"] == 10
    assert residencial["OCUPACION"] == 0.035
    assert residencial["CONSTRUCCION"] == 0.14

    otros = result["rows"][221]
    assert otros["CODIGO_PRC"] == "8211-R1"
    assert otros["ZONA"] == "R1"
    assert otros["DENS_HAB_HA"] == 10
    assert otros["OCUPACION"] == 0.1
    assert otros["CONSTRUCCION"] == 0.3

    changed_codes = [
        finding for finding in result["findings"]
        if finding.get("field") == "CODIGO_PRC"
        and finding.get("proposed") not in ("", finding.get("original"))
    ]
    assert changed_codes == []


def test_chiguayante_registra_coincidencias_para_otros_usos_zr1():
    row = _chiguayante_rows_222()[-1]
    result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())
    matches = {
        finding["field"] for finding in result["findings"]
        if finding.get("status") == "COINCIDE"
    }
    assert {"OCUPACION", "CONSTRUCCION"}.issubset(matches)


def test_cobertura_legal_detecta_zona_vigente_ausente_sin_inventar_filas():
    row = _empty_row()
    row.update({
        "COMUNA": "CHIGUAYANTE",
        "RIALCOMSII": 8211,
        "CODIGO_PRC": "8211-U2-A",
        "ZONA": "U2-A",
    })
    result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())

    assert len(result["rows"]) == 1
    assert result["input_rows"] == 1
    assert result["output_rows"] == 1
    assert result["coverage_missing"] >= 1

    missing_zu2a1 = [
        item for item in result["findings"]
        if item.get("rule_id") == "chig-cobertura-zu2-a1"
    ]
    assert len(missing_zu2a1) == 1
    assert missing_zu2a1[0]["status"] == "CONFLICTO NORMATIVO"
    assert missing_zu2a1[0]["scope"] == "COBERTURA_ZONA"
    assert missing_zu2a1[0]["row"] == 0


def test_cobertura_legal_acepta_alias_productivo_existente():
    row = _empty_row()
    row.update({
        "COMUNA": "CHIGUAYANTE",
        "RIALCOMSII": 8211,
        "CODIGO_PRC": "8211-U2-A1",
        "ZONA": "U2-A1",
    })
    result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())

    conflicts_for_alias = [
        item for item in result["findings"]
        if item.get("rule_id") == "chig-cobertura-zu2-a1"
        and item.get("status") != "COINCIDE"
    ]
    assert conflicts_for_alias == []
    assert result["rows"][0]["ZONA"] == "U2-A1"
    assert result["rows"][0]["CODIGO_PRC"] == "8211-U2-A1"


def test_zu1b_se_actualiza_a_parametros_vigentes_sin_cambiar_codigo():
    row = _empty_row()
    row.update({
        "COMUNA": "CHIGUAYANTE",
        "RIALCOMSII": 8211,
        "CODIGO_PRC": "8211-U1-B",
        "ZONA": "U1-B",
        "ESPECIF_GENERAL": "RESIDENCIAL",
        "DENS_HAB_HA": 135,
        "SUB_PREDIAL": 300,
        "CONSTRUCCION": 2.4,
        "OCUPACION": 0.4,
        "PISOS_MAX": 444,
        "ALTURA_MAX": 444,
        "ANTEJARDIN": 2,
    })

    result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())
    final = result["rows"][0]

    assert final["CODIGO_PRC"] == "8211-U1-B"
    assert final["ZONA"] == "U1-B"
    assert final["DENS_HAB_HA"] == 600
    assert final["SUB_PREDIAL"] == 200
    assert final["CONSTRUCCION"] == 2
    assert final["OCUPACION"] == 0.6
    assert final["PISOS_MAX"] == 5
    assert final["ALTURA_MAX"] == 15
    assert final["ANTEJARDIN"] == 2


def test_runner_v4_compone_catalogo_global_comunal_y_cobertura():
    bundle = build_source_bundle(
        ROOT / "config" / "tablas_normativas_fuente.json",
        ROOT / "config" / "tablas_normativas_fuentes",
    )
    source_ids = {str(rule.get("id")) for rule in bundle["source_checks"]}
    coverage_ids = {str(rule.get("id")) for rule in bundle["coverage_checks"]}

    assert "chig-zr1-residencial-enmienda-2024" in source_ids
    assert "chig-zr1-otros-usos-enmienda-2024" in source_ids
    assert "chig-zu1b-parametros-vigentes" in source_ids
    assert "chig-cobertura-zu2-a1" in coverage_ids
    assert bundle["source_checks_count"] >= 20
    assert bundle["coverage_checks_count"] >= 9


def test_runner_v4_rechaza_ids_duplicados_entre_secciones(tmp_path):
    global_path = tmp_path / "global.json"
    source_dir = tmp_path / "comunas"
    source_dir.mkdir()

    global_path.write_text(json.dumps({
        "source_checks": [{"id": "duplicada", "comuna": "X"}],
        "review_rules": [],
        "coverage_checks": [],
    }), encoding="utf-8")
    (source_dir / "x.json").write_text(json.dumps({
        "comuna": "X",
        "source_checks": [],
        "review_rules": [],
        "coverage_checks": [{"id": "duplicada", "comuna": "X"}],
    }), encoding="utf-8")

    with pytest.raises(RuntimeError, match="duplicado"):
        build_source_bundle(global_path, source_dir)
