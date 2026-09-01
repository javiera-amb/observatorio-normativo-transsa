import json
import tempfile
import unittest
from pathlib import Path

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


class ChiguayanteNormativaTests(unittest.TestCase):
    def test_enmienda_corrige_zr1_sin_cambiar_codigos_y_conserva_222_filas(self):
        rows = _chiguayante_rows_222()
        result = engine_v3.audit_table(base.FIELDS, rows, source_catalog=_catalog())

        self.assertEqual(len(result["rows"]), 222)
        self.assertEqual(result["input_rows"], 222)
        self.assertEqual(result["output_rows"], 222)

        residencial = result["rows"][220]
        self.assertEqual(residencial["CODIGO_PRC"], "8211-RI")
        self.assertEqual(residencial["ZONA"], "RI")
        self.assertEqual(residencial["DENS_HAB_HA"], 10)
        self.assertEqual(residencial["OCUPACION"], 0.035)
        self.assertEqual(residencial["CONSTRUCCION"], 0.14)

        otros = result["rows"][221]
        self.assertEqual(otros["CODIGO_PRC"], "8211-R1")
        self.assertEqual(otros["ZONA"], "R1")
        self.assertEqual(otros["DENS_HAB_HA"], 10)
        self.assertEqual(otros["OCUPACION"], 0.1)
        self.assertEqual(otros["CONSTRUCCION"], 0.3)

        changed_codes = [
            finding for finding in result["findings"]
            if finding.get("field") == "CODIGO_PRC"
            and finding.get("proposed") not in ("", finding.get("original"))
        ]
        self.assertEqual(changed_codes, [])

    def test_registra_coincidencias_para_otros_usos_zr1(self):
        row = _chiguayante_rows_222()[-1]
        result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())
        matches = {
            finding["field"] for finding in result["findings"]
            if finding.get("status") == "COINCIDE"
        }
        self.assertTrue({"OCUPACION", "CONSTRUCCION"}.issubset(matches))

    def test_cobertura_legal_detecta_zona_ausente_sin_inventar_filas(self):
        row = _empty_row()
        row.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": "8211-U2-A",
            "ZONA": "U2-A",
        })
        result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())

        self.assertEqual(len(result["rows"]), 1)
        self.assertEqual(result["input_rows"], 1)
        self.assertEqual(result["output_rows"], 1)
        self.assertGreaterEqual(result["coverage_missing"], 1)

        missing = [
            item for item in result["findings"]
            if item.get("rule_id") == "chig-cobertura-zu2-a1"
        ]
        self.assertEqual(len(missing), 1)
        self.assertEqual(missing[0]["status"], "CONFLICTO NORMATIVO")
        self.assertEqual(missing[0]["scope"], "COBERTURA_ZONA")
        self.assertEqual(missing[0]["row"], 0)

    def test_cobertura_legal_acepta_alias_productivo_existente(self):
        row = _empty_row()
        row.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": "8211-U2-A1",
            "ZONA": "U2-A1",
        })
        result = engine_v3.audit_table(base.FIELDS, [row], source_catalog=_catalog())

        conflicts = [
            item for item in result["findings"]
            if item.get("rule_id") == "chig-cobertura-zu2-a1"
            and item.get("status") != "COINCIDE"
        ]
        self.assertEqual(conflicts, [])
        self.assertEqual(result["rows"][0]["ZONA"], "U2-A1")
        self.assertEqual(result["rows"][0]["CODIGO_PRC"], "8211-U2-A1")

    def test_zu1b_actualiza_parametros_vigentes_sin_cambiar_codigo(self):
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

        self.assertEqual(final["CODIGO_PRC"], "8211-U1-B")
        self.assertEqual(final["ZONA"], "U1-B")
        self.assertEqual(final["DENS_HAB_HA"], 600)
        self.assertEqual(final["SUB_PREDIAL"], 200)
        self.assertEqual(final["CONSTRUCCION"], 2)
        self.assertEqual(final["OCUPACION"], 0.6)
        self.assertEqual(final["PISOS_MAX"], 5)
        self.assertEqual(final["ALTURA_MAX"], 15)
        self.assertEqual(final["ANTEJARDIN"], 2)

    def test_runner_v4_compone_catalogo_global_comunal_y_cobertura(self):
        bundle = build_source_bundle(
            ROOT / "config" / "tablas_normativas_fuente.json",
            ROOT / "config" / "tablas_normativas_fuentes",
        )
        source_ids = {str(rule.get("id")) for rule in bundle["source_checks"]}
        coverage_ids = {str(rule.get("id")) for rule in bundle["coverage_checks"]}

        self.assertIn("chig-zr1-residencial-enmienda-2024", source_ids)
        self.assertIn("chig-zr1-otros-usos-enmienda-2024", source_ids)
        self.assertIn("chig-zu1b-parametros-vigentes", source_ids)
        self.assertIn("chig-cobertura-zu2-a1", coverage_ids)
        self.assertGreaterEqual(bundle["source_checks_count"], 20)
        self.assertGreaterEqual(bundle["coverage_checks_count"], 9)

    def test_runner_v4_rechaza_ids_duplicados_entre_secciones(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            global_path = root / "global.json"
            source_dir = root / "comunas"
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

            with self.assertRaisesRegex(RuntimeError, "duplicado"):
                build_source_bundle(global_path, source_dir)


if __name__ == "__main__":
    unittest.main()
