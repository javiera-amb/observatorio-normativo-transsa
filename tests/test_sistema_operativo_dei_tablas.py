import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_sharepoint_config_usa_sistema_operativo_dei():
    cfg = json.loads((ROOT / "config" / "sharepoint_tui.json").read_text(encoding="utf-8"))
    assert cfg["cartografia_root"].startswith("Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA")
    assert "Cartografía Transsa_GENERAL" not in json.dumps(cfg, ensure_ascii=False)
    assert cfg["mode"] == "cloud"
    assert cfg["local_sync_required"] is False


def test_catalogo_declara_maestro_sql2_y_rutas_oficiales():
    text = (ROOT / "data" / "tablas_normativas_sharepoint.js").read_text(encoding="utf-8")
    assert 'canal_oficial: "Sistema Operativo DEI"' in text
    assert 'maestro_vigente: "PRC_SQL2.xlsx"' in text
    assert "Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional/02_Tablas_normativas" in text
    assert 'una_fila_por_poligono: true' in text
    assert 'preservar_codigo_prc_por_defecto: true' in text


def test_codigos_prms_descriptivos_no_se_autocorrigen():
    rules = json.loads((ROOT / "config" / "tablas_normativas_reglas.json").read_text(encoding="utf-8"))
    assert rules["policy"]["preserve_codigo_prc_by_default"] is True
    assert rules["policy"]["codigo_prc_requires_confirmed_error"] is True
    for rule in rules["exact_rules"]:
        if rule.get("field") == "CODIGO_PRC":
            assert rule.get("auto_apply") is False
            assert rule.get("review_only") is True


def test_r11_es_el_unico_codigo_prc_condicional_autorizado():
    rules = json.loads((ROOT / "config" / "tablas_normativas_condicionales.json").read_text(encoding="utf-8"))
    codigo_rules = [rule for rule in rules["conditional_rules"] if rule.get("field") == "CODIGO_PRC"]
    assert len(codigo_rules) == 1
    assert codigo_rules[0]["id"] == "pen-r11-codigo-prc"
    assert codigo_rules[0].get("allow_codigo_prc_change") is True
    assert codigo_rules[0].get("confidence") == "ALTA"


def test_zmh5_fuente_oficial_y_correcciones_clave():
    rules = json.loads((ROOT / "config" / "tablas_normativas_condicionales.json").read_text(encoding="utf-8"))
    by_id = {rule["id"]: rule for rule in rules["conditional_rules"]}
    assert by_id["pen-zmh5-300-constructibilidad"]["corrected"] == 0.6
    assert by_id["pen-zmh5-160-constructibilidad"]["corrected"] == 0.6
    assert by_id["pen-zmh5-densidad-maxima"]["corrected"] == 100
    assert by_id["pen-zmh5-equip-comunal-antejardin"]["corrected"] == 7
    assert by_id["pen-zmh5-300-agrupamiento"]["corrected"] == "AISLADO"
    assert by_id["pen-zmh5-160-agrupamiento"]["corrected"] == "PAREADO; CONTINUO"
