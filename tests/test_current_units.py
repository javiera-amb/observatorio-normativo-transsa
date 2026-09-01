from pathlib import Path

from automation.tablas_normativas import current_units


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "config" / "tablas_normativas_unidades_vigentes"


def test_chiguayante_unidades_nuevas_quedan_preparadas_sin_inventar_codigo():
    catalogs = current_units.load_current_unit_catalogs(CATALOG_DIR)
    catalog = catalogs[current_units._key("Chiguayante")]
    status = current_units.progress(catalog)

    assert status["units_prepared"] == 10
    assert status["variants_prepared"] == 17
    assert len(status["units_missing_codigo_prc"]) == 10
    assert status["codigo_prc_pending"] is True
    assert status["ready_for_generation"] is False
    assert status["publicable"] is False


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
