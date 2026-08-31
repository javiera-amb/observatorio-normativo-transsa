import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from automation.tablas_normativas.engine import FIELDS
from automation.tablas_normativas.pairing import validate_prc_table_pair


class TablasNormativasPairingTests(unittest.TestCase):
    def _make_gpkg(self, path: Path, count: int):
        connection = sqlite3.connect(path)
        try:
            connection.executescript(
                """
                CREATE TABLE gpkg_contents (
                  table_name TEXT PRIMARY KEY, data_type TEXT, identifier TEXT
                );
                CREATE TABLE gpkg_geometry_columns (
                  table_name TEXT, column_name TEXT
                );
                CREATE TABLE zonificacion (
                  fid INTEGER PRIMARY KEY, geom BLOB, zona TEXT
                );
                INSERT INTO gpkg_contents VALUES ('zonificacion', 'features', 'zonificacion');
                INSERT INTO gpkg_geometry_columns VALUES ('zonificacion', 'geom');
                """
            )
            for index in range(1, count + 1):
                connection.execute(
                    "INSERT INTO zonificacion(fid, geom, zona) VALUES (?, X'00', ?)",
                    (index, f"Z{index}"),
                )
            connection.commit()
        finally:
            connection.close()

    def _make_table(self, path: Path, count: int, comuna: str = "PRUEBA"):
        with path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            for index in range(1, count + 1):
                row = {field: "" for field in FIELDS}
                row.update({
                    "COMUNA": comuna,
                    "RIALCOMSII": "99999",
                    "CODIGO_PRC": f"Z{index}",
                    "ZONA": f"Z{index}",
                })
                writer.writerow(row)

    def test_aprueba_mismo_numero_poligonos_y_filas(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, 3)
            self._make_table(table, 3)
            result = validate_prc_table_pair(gpkg, table, expected_comuna="PRUEBA")
            self.assertTrue(result["valid"])
            self.assertEqual(result["state"], "LISTO_AUDITAR")
            self.assertEqual(result["polygon_count"], 3)
            self.assertEqual(result["row_count"], 3)

    def test_bloquea_si_filas_no_igualan_poligonos(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, 3)
            self._make_table(table, 2)
            result = validate_prc_table_pair(gpkg, table)
            self.assertFalse(result["valid"])
            self.assertEqual(result["state"], "ERROR_ESTRUCTURAL")
            self.assertTrue(any("3 polígonos" in error and "2 filas" in error for error in result["errors"]))

    def test_bloquea_tabla_de_otra_comuna(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_OTRA.csv"
            self._make_gpkg(gpkg, 1)
            self._make_table(table, 1, comuna="OTRA")
            result = validate_prc_table_pair(gpkg, table, expected_comuna="PRUEBA")
            self.assertFalse(result["valid"])
            self.assertTrue(any("no a PRUEBA" in error for error in result["errors"]))

    def test_bloquea_si_falta_un_archivo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            result = validate_prc_table_pair(root / "faltante.gpkg", root / "faltante.csv")
            self.assertFalse(result["valid"])
            self.assertIn("Falta el archivo PRC.", result["errors"])
            self.assertIn("Falta la tabla normativa asociada.", result["errors"])


if __name__ == "__main__":
    unittest.main()
