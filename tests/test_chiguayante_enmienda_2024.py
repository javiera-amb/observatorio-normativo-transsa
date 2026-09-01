import json
from pathlib import Path

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3
from automation.tablas_normativas.runner_v4 import build_source_bundle


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "config" / "tablas_normativas_fuentes" / "chiguayante.json"


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
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    rows = _chiguayante_rows_222()

    result = engine_v3.audit_table(base.FIELDS, rows, source_catalog=catalog)

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
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    row = _chiguayante_rows_222()[-1]
    result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=catalog)
    matches = {
        finding["field"] for finding in result["findings"]
        if finding.get("status") == "COINCIDE"
    }
    assert {"OCUPACION", "CONSTRUCCION"}.issubset(matches)


def test_runner_v4_compone_catalogo_global_y_comunal():
    bundle = build_source_bundle(
        ROOT / "config" / "tablas_normativas_fuente.json",
        ROOT / "config" / "tablas_normativas_fuentes",
    )
    ids = {str(rule.get("id")) for rule in bundle["source_checks"]}
    assert "chig-zr1-residencial-enmienda-2024" in ids
    assert "chig-zr1-otros-usos-enmienda-2024" in ids
    assert bundle["source_checks_count"] >= 2
