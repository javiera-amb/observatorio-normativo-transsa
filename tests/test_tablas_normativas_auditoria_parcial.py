from automation.tablas_normativas.runner_v4 import (
    _merge_partial_audit,
    _promote_catalogued_communes_for_audit,
)


def test_cobertura_parcial_se_promueve_solo_en_segunda_pasada():
    coverage = {
        "por_comuna": {
            "CHIGUAYANTE": {"estado": "PARCIAL"},
            "COQUIMBO": {"estado": "COMPLETA"},
        }
    }
    commune_catalogs = {
        "CHIGUAYANTE": {"comuna": "CHIGUAYANTE", "estado_cobertura": "EN_AUDITORIA"},
        "COQUIMBO": {"comuna": "COQUIMBO", "estado_cobertura": "COMPLETA"},
    }
    promoted, partial_keys = _promote_catalogued_communes_for_audit(coverage, commune_catalogs)

    assert partial_keys == {"CHIGUAYANTE"}
    assert promoted["por_comuna"]["CHIGUAYANTE"]["estado"] == "COMPLETA"
    assert promoted["por_comuna"]["CHIGUAYANTE"]["_promovida_solo_para_auditoria"] is True
    assert coverage["por_comuna"]["CHIGUAYANTE"]["estado"] == "PARCIAL"
    assert promoted["por_comuna"]["COQUIMBO"]["estado"] == "COMPLETA"


def test_resultado_parcial_conserva_qa_pero_nunca_salida_productiva():
    primary = {
        "comunas": {
            "CHIGUAYANTE": {
                "comuna": "CHIGUAYANTE",
                "estado": "FUENTES INCOMPLETAS",
                "errores": ["Cobertura incompleta"],
            }
        }
    }
    audit_only = {
        "comunas": {
            "CHIGUAYANTE": {
                "comuna": "CHIGUAYANTE",
                "estado": "LISTA PARA STAGING",
                "correcciones_confirmadas": 4,
                "posibles": 0,
                "normalizaciones_formato": 8,
                "conflictos": 0,
                "hallazgos_bloqueantes": 0,
                "filas_normativas": 222,
                "salida": "/tmp/PRC_CHIGUAYANTE_NORMALIZADO.xlsx",
                "errores": [],
            }
        }
    }
    coverage = {"por_comuna": {"CHIGUAYANTE": {"estado": "PARCIAL"}}}

    _merge_partial_audit(primary, audit_only, {"CHIGUAYANTE"}, coverage)
    item = primary["comunas"]["CHIGUAYANTE"]

    assert item["estado"] == "AUDITADA · FUENTES PARCIALES"
    assert item["auditoria_ejecutada"] is True
    assert item["publicable"] is False
    assert item["correcciones_confirmadas"] == 4
    assert item["filas_normativas"] == 222
    assert "salida" not in item


def test_resultado_parcial_con_hallazgos_sigue_bloqueado():
    primary = {"comunas": {"CHIGUAYANTE": {"comuna": "CHIGUAYANTE"}}}
    audit_only = {
        "comunas": {
            "CHIGUAYANTE": {
                "comuna": "CHIGUAYANTE",
                "estado": "CON OBSERVACIONES",
                "hallazgos_bloqueantes": 2,
                "errores": ["Hallazgo A", "Hallazgo B"],
            }
        }
    }
    coverage = {"por_comuna": {"CHIGUAYANTE": {"estado": "PARCIAL"}}}

    _merge_partial_audit(primary, audit_only, {"CHIGUAYANTE"}, coverage)
    item = primary["comunas"]["CHIGUAYANTE"]

    assert item["estado"] == "CON OBSERVACIONES"
    assert item["publicable"] is False
    assert item["hallazgos_bloqueantes"] == 2
