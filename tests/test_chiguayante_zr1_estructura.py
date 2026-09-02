import unittest
from pathlib import Path

from automation.tablas_normativas import engine as base
from automation.tablas_normativas import engine_v3
from automation.tablas_normativas.runner_v4 import build_source_bundle


ROOT = Path(__file__).resolve().parents[1]


def _empty_row() -> dict:
    return {field: "" for field in base.FIELDS}


def _bundle() -> dict:
    return build_source_bundle(
        ROOT / "config" / "tablas_normativas_fuente.json",
        ROOT / "config" / "tablas_normativas_fuentes",
    )


class ChiguayanteZR1EstructuraTests(unittest.TestCase):
    def test_corrige_desplazamiento_real_zr1_y_conserva_222_filas(self):
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

        # Forma real observada en PRC_SQL2: superficie y densidad están desplazadas.
        residencial = _empty_row()
        residencial.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": "8211-RI",
            "ZONA": "RI",
            "ESPECIF_ESPECIF": "RESIDENCIAL",
            "DENS_HAB_HA": 5000,
            "SUB_PREDIAL": 12,
            "CONSTRUCCION": 0.2,
            "OCUPACION": 0.05,
        })
        rows.append(residencial)

        otros = _empty_row()
        otros.update({
            "COMUNA": "CHIGUAYANTE",
            "RIALCOMSII": 8211,
            "CODIGO_PRC": "8211-R1",
            "ZONA": "R1",
            "ESPECIF_ESPECIF": "EQUIPAMIENTO",
            "DENS_HAB_HA": 10000,
            "SUB_PREDIAL": 12,
            "CONSTRUCCION": 0.3,
            "OCUPACION": 0.1,
        })
        rows.append(otros)

        result = engine_v3.audit_table(base.FIELDS, rows, source_catalog=_bundle())

        self.assertEqual(result["input_rows"], 222)
        self.assertEqual(result["output_rows"], 222)
        self.assertEqual(len(result["rows"]), 222)

        final_res = result["rows"][220]
        self.assertEqual(final_res["CODIGO_PRC"], "8211-RI")
        self.assertEqual(final_res["ZONA"], "RI")
        self.assertEqual(final_res["SUB_PREDIAL"], 5000)
        self.assertEqual(final_res["DENS_HAB_HA"], 10)
        self.assertEqual(final_res["OCUPACION"], 0.035)
        self.assertEqual(final_res["CONSTRUCCION"], 0.14)
        self.assertEqual(final_res["AGRUPAMIENTO"], "AISLADO")

        final_otros = result["rows"][221]
        self.assertEqual(final_otros["CODIGO_PRC"], "8211-R1")
        self.assertEqual(final_otros["ZONA"], "R1")
        self.assertEqual(final_otros["SUB_PREDIAL"], 10000)
        self.assertEqual(final_otros["DENS_HAB_HA"], 10)
        self.assertEqual(final_otros["OCUPACION"], 0.1)
        self.assertEqual(final_otros["CONSTRUCCION"], 0.3)
        self.assertEqual(final_otros["AGRUPAMIENTO"], "AISLADO")

    def test_bundle_incluye_reglas_estructurales_zr1(self):
        bundle = _bundle()
        ids = {str(rule.get("id")) for rule in bundle["source_checks"]}
        self.assertIn("chig-zr1-residencial-estructura-vigente-2024", ids)
        self.assertIn("chig-zr1-otros-usos-estructura-vigente-2024", ids)


if __name__ == "__main__":
    unittest.main()
