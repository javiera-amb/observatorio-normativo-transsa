from pathlib import Path

from automation.tablas_normativas import current_units


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "config" / "tablas_normativas_unidades_vigentes"
POLICY_DIR = ROOT / "config" / "tablas_normativas_codigo_generacion"


def _derived_chiguayante():
    catalogs = current_units.load_current_unit_catalogs(CATALOG_DIR)
    policies = current_units.load_code_generation_policies(POLICY_DIR)
    key = current_units._key("Chiguayante")
    original = catalogs[key]
    derived = current_units.derive_seed_codes(original, policies[key])
    return original, derived


def test_chiguayante_deriva_codigos_solo_en_semilla():
    original, derived = _derived_chiguayante()

    assert all(not str(unit.get("CODIGO_PRC") or "") for unit in original["unidades"])
    expected = {f"8211-{unit['ZONA']}" for unit in derived["unidades"]}
    actual = {unit["CODIGO_PRC"] for unit in derived["unidades"]}
    assert actual == expected
    assert len(actual) == 10
    assert all(
        unit["CODIGO_PRC_ORIGIN"] == "DERIVADO_REGLA_COMUNAL_VERIFICADA"
        for unit in derived["unidades"]
    )


def test_codigo_generado_no_habilita_tabla_productiva():
    _, catalog = _derived_chiguayante()
    status = current_units.progress(catalog)

    assert status["units_prepared"] == 10
    assert status["variants_prepared"] == 17
    assert status["units_missing_codigo_prc"] == []
    assert status["codigo_prc_pending"] is False
    assert status["ready_for_seed"] is True
    assert status["ready_for_generation"] is False
    assert status["ready_for_productive_generation"] is False
    assert status["publicable"] is False


def test_politica_codigo_es_comunal_y_no_reescribe_existentes():
    policies = current_units.load_code_generation_policies(POLICY_DIR)
    policy = policies[current_units._key("CHIGUAYANTE")]
    assert policy["global"] is False
    assert policy["scope"] == "ONLY_NEW_UNITS_IN_VERSION_MIGRATION"
    assert policy["rewrite_existing_codes"] is False
    assert policy["evidence"]["rows_checked"] == 222
    assert policy["evidence"]["rows_matching"] == 222
    assert policy["evidence"]["exceptions"] == 0


def test_unidades_clave_tienen_parametros_vigentes():
    catalog = current_units.load_current_unit_catalogs(CATALOG_DIR)[current_units._key("CHIGUAYANTE")]
    units = {item["ZONA"]: item for item in catalog["unidades"]}

    zr1 = units["ZR1"]["variantes"][0]
    assert zr1["SUB_PREDIAL"] == 2500
    assert zr1["DENS_HAB_HA"] == 10
    assert zr1["OCUPACION"] == 0.035
    assert zr1["CONSTRUCCION"] == 0.14

    zr1a = units["ZR1-A"]["variantes"][0]
    assert zr1a["SUB_PREDIAL"] == 3000
    assert zr1a["DENS_HAB_HA"] == 320
    assert zr1a["CONSTRUCCION"] == 0.7

    assert len(units["ZIa"]["variantes"]) == 2
    assert len(units["ZIb"]["variantes"]) == 2
    assert len(units["ZR2a"]["variantes"]) == 2
    assert len(units["ZR2b"]["variantes"]) == 2
    assert len(units["ZU2-A1"]["variantes"]) == 2
    assert len(units["ZU2-A2"]["variantes"]) == 2
