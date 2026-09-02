import sqlite3
import tempfile
import unittest
from pathlib import Path

from automation.tablas_normativas.spatial_mapping import (
    analyze_spatial_zone_mapping,
    read_prc_zone_code_pairs,
)


class SpatialMigrationMappingTests(unittest.TestCase):
    def _gpkg(self, rows):
        tmp = tempfile.TemporaryDirectory()
        path = Path(tmp.name) / "prc.gpkg"
        con = sqlite3.connect(path)
        con.execute("CREATE TABLE gpkg_contents (table_name TEXT, data_type TEXT)")
        con.execute("INSERT INTO gpkg_contents VALUES ('PRC_CHIGUAYANTE', 'features')")
        con.execute(
            "CREATE TABLE PRC_CHIGUAYANTE (id INTEGER PRIMARY KEY, CODIGO_PRC TEXT, ZONA TEXT)"
        )
        con.executemany(
            "INSERT INTO PRC_CHIGUAYANTE (CODIGO_PRC, ZONA) VALUES (?, ?)", rows
        )
        con.commit()
        con.close()
        return tmp, path

    def test_lee_zona_y_codigo_del_gpkg(self):
        tmp, path = self._gpkg([
            ("8211-U2-A1", "ZU2-A1"),
            ("8211-U2-A2", "ZU2-A2"),
        ])
        try:
            count, layer, pairs = read_prc_zone_code_pairs(path)
            self.assertEqual(count, 2)
            self.assertEqual(layer, "PRC_CHIGUAYANTE")
            self.assertEqual(pairs[0]["CODIGO_PRC"], "8211-U2-A1")
            self.assertEqual(pairs[0]["ZONA"], "ZU2-A1")
        finally:
            tmp.cleanup()

    def test_equivalencia_simple_resuelve_pero_split_no_se_infiere(self):
        plan = {
            "zonas_vigentes_esperadas": ["ZU1-A", "ZIa", "ZIb"],
            "equivalencias_nomenclatura": {"U1-A": "ZU1-A"},
            "transformaciones_zona": [
                {
                    "type": "SPLIT",
                    "legacy_zones": ["ZI"],
                    "current_zones": ["ZIa", "ZIb"],
                    "requires_spatial_code_mapping": True,
                }
            ],
        }
        result = analyze_spatial_zone_mapping(plan, [
            {"CODIGO_PRC": "8211-U1-A", "ZONA": "U1-A"},
            {"CODIGO_PRC": "8211-ZI", "ZONA": "ZI"},
        ])
        self.assertEqual(result["codes_by_current_zone"]["ZU1-A"], ["8211-U1-A"])
        self.assertIn("ZIa", result["current_zones_missing_in_prc"])
        self.assertIn("ZIb", result["current_zones_missing_in_prc"])
        self.assertIn("ZI", result["unexpected_prc_zones"])
        self.assertFalse(result["mapping_complete"])

    def test_split_se_resuelve_solo_si_gpkg_trae_zonas_vigentes(self):
        plan = {
            "zonas_vigentes_esperadas": ["ZIa", "ZIb"],
            "equivalencias_nomenclatura": {},
            "transformaciones_zona": [
                {
                    "type": "SPLIT",
                    "legacy_zones": ["ZI"],
                    "current_zones": ["ZIa", "ZIb"],
                    "requires_spatial_code_mapping": True,
                }
            ],
        }
        result = analyze_spatial_zone_mapping(plan, [
            {"CODIGO_PRC": "8211-ZIa", "ZONA": "ZIa"},
            {"CODIGO_PRC": "8211-ZIb", "ZONA": "ZIb"},
        ])
        self.assertTrue(result["mapping_complete"])
        self.assertEqual(result["current_zones_missing_in_prc"], [])
        self.assertEqual(result["codes_by_current_zone"]["ZIa"], ["8211-ZIa"])
        self.assertEqual(result["codes_by_current_zone"]["ZIb"], ["8211-ZIb"])


if __name__ == "__main__":
    unittest.main()
