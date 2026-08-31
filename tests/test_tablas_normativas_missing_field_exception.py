import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from automation.tablas_normativas.engine import FIELDS
from automation.tablas_normativas.pairing import validate_prc_table_pair


class MissingFieldExceptionTests(unittest.TestCase):
    def _make_gpkg(self, path: Path):
        connection = sqlite3.connect(path)
        try:
            connection.executescript("""
                CREATE TABLE gpkg_contents (table_name TEXT PRIMARY KEY, data_type TEXT, identifier TEXT);
                CREATE TABLE gpkg_geometry_columns (table_name TEXT, column_name TEXT);
                CREATE TABLE zonificacion (fid INTEGER PRIMARY KEY, geom BLOB, CODIGO_PRC TEXT);
                INSERT INTO gpkg_contents VALUES ('zonificacion', 'features', 'zonificacion');
                INSERT INTO gpkg_geometry_columns VALUES ('zonificacion', 'geom');
                INSERT INTO zonificacion VALUES (1, X'00', 'Z1');
            """)
            connection.commit()
        finally:
            connection.close()

    def _make_table_without_ocupacion_sup(self, path: Path):
        fields = [field for field in FIELDS if field != "OCUPACION_SUP"]
        with path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            row = {field: "" for field in fields}
            row.update({"COMUNA": "PRUEBA", "RIALCOMSII": "99999", "CODIGO_PRC": "Z1", "ZONA": "Z1"})
            writer.writerow(row)

    def test_sin_excepcion_bloquea_y_con_excepcion_permite_auditar(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "tabla.csv"
            self._make_gpkg(gpkg)
            self._make_table_without_ocupacion_sup(table)

            blocked = validate_prc_table_pair(gpkg, table)
            self.assertFalse(blocked["valid"])
            self.assertIn("OCUPACION_SUP", blocked["blocking_missing_fields"])

            allowed = validate_prc_table_pair(gpkg, table, allowed_missing_fields=["OCUPACION_SUP"])
            self.assertTrue(allowed["valid"])
            self.assertEqual(allowed["repairable_missing_fields"], ["OCUPACION_SUP"])
            self.assertEqual(allowed["blocking_missing_fields"], [])


if __name__ == "__main__":
    unittest.main()
