from pathlib import Path

from scripts import refrescar_seguimiento_publico as seguimiento


ROOT = Path(__file__).resolve().parents[1]


def test_chiguayante_backfill_contiene_dos_actos_2024():
    acts = seguimiento.load_verified_acts(ROOT / "config" / "vigencia_actos_verificados.json")
    chiguayante = [
        act for act in acts
        if "chiguayante" in {str(value).lower() for value in act.get("comunas", [])}
    ]
    assert [act["fecha"] for act in chiguayante] == ["2024-05-09", "2024-05-29"]
    assert all(act["source_url"].startswith("https://www.bcn.cl/") for act in chiguayante)


def test_chiguayante_actos_son_posteriores_y_afectan_prc():
    acts = seguimiento.load_verified_acts(ROOT / "config" / "vigencia_actos_verificados.json")
    principal = {
        "registro": 1,
        "region": "Biobío",
        "comuna": "Chiguayante",
        "tipo_ipt": "PRC",
        "fecha": "2003-07-04",
    }
    posterior = seguimiento.posterior_acts(principal, acts)
    assert len(posterior) == 2
    assert posterior[-1]["fecha"] == "2024-05-29"


def test_backfill_se_deduplica_si_portal_ipt_incorpora_el_acto():
    verified = seguimiento.load_verified_acts(ROOT / "config" / "vigencia_actos_verificados.json")
    portal_copy = {
        "id": 999999,
        "region": "Biobío",
        "comunas": ["Chiguayante"],
        "nivel": "Comunal",
        "tipo_ipt": "PRC",
        "titulo": "APRUEBA ENMIENDA AL PLAN REGULADOR COMUNAL VIGENTE DE CHIGUAYANTE",
        "estado": "Vigente",
        "fecha": "2024-05-09",
        "fecha_derogacion": "",
        "codigos_origen": [],
        "tipo_acto": "Enmienda",
    }
    merged, added = seguimiento.merge_acts([portal_copy], verified)
    assert added == 1
    assert len(merged) == 2
    assert max(act["fecha"] for act in merged) == "2024-05-29"
