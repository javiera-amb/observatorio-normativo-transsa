import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from automation.tablas_normativas.engine import FIELDS
from automation.tablas_normativas.pairing import validate_prc_table_pair


class TablasNormativasPairingTests(unittest.TestCase):
    def _make_gpkg(self, path: Path, codes: list[str]):
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
                  fid INTEGER PRIMARY KEY, geom BLOB, ZONA TEXT, CODIGO_PRC TEXT
                );
                INSERT INTO gpkg_contents VALUES ('zonificacion', 'features', 'zonificacion');
                INSERT INTO gpkg_geometry_columns VALUES ('zonificacion', 'geom');
                """
            )
            for index, code in enumerate(codes, start=1):
                connection.execute(
                    "INSERT INTO zonificacion(fid, geom, ZONA, CODIGO_PRC) VALUES (?, X'00', ?, ?)",
                    (index, code, code),
                )
            connection.commit()
        finally:
            connection.close()

    def _make_table(self, path: Path, codes: list[str], comuna: str = "PRUEBA"):
        with path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            for index, code in enumerate(codes, start=1):
                row = {field: "" for field in FIELDS}
                row.update({
                    "COMUNA": comuna,
                    "RIALCOMSII": "99999",
                    "CODIGO_PRC": code,
                    "ZONA": code,
                    "SUB_PREDIAL": 100 + index,
                })
                writer.writerow(row)

    def test_aprueba_varios_poligonos_y_variantes_por_codigo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, ["Z1", "Z1", "Z2"])
            self._make_table(table, ["Z1", "Z1", "Z1", "Z2"])
            result = validate_prc_table_pair(gpkg, table, expected_comuna="PRUEBA")
            self.assertTrue(result["valid"])
            self.assertEqual(result["state"], "LISTO_AUDITAR")
            self.assertEqual(result["polygon_count"], 3)
            self.assertEqual(result["row_count"], 4)
            self.assertEqual(result["link_field"], "CODIGO_PRC")

    def test_no_exige_igualdad_entre_poligonos_y_filas(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, ["Z1", "Z1", "Z1"])
            self._make_table(table, ["Z1"])
            result = validate_prc_table_pair(gpkg, table)
            self.assertTrue(result["valid"])
            self.assertEqual(result["polygon_count"], 3)
            self.assertEqual(result["row_count"], 1)

    def test_bloquea_codigo_del_prc_sin_fila_normativa(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, ["Z1", "Z2"])
            self._make_table(table, ["Z1"])
            result = validate_prc_table_pair(gpkg, table)
            self.assertFalse(result["valid"])
            self.assertEqual(result["state"], "ERROR_VINCULO")
            self.assertIn("Z2", result["missing_in_table"])

    def test_bloquea_fila_normativa_sin_codigo_en_prc(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, ["Z1"])
            self._make_table(table, ["Z1", "Z2"])
            result = validate_prc_table_pair(gpkg, table)
            self.assertFalse(result["valid"])
            self.assertIn("Z2", result["orphan_table_codes"])

    def test_alias_permite_vincular_sin_modificar_codigo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_PRUEBA.csv"
            self._make_gpkg(gpkg, ["15152-ART 5.2.2. PRMS"])
            self._make_table(table, ["15152-ART 5.2.2."])
            result = validate_prc_table_pair(
                gpkg,
                table,
                codigo_aliases={"15152-ART 5.2.2. PRMS": "15152-ART 5.2.2."},
            )
            self.assertTrue(result["valid"])

    def test_bloquea_tabla_de_otra_comuna(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            gpkg = root / "PRC_PRUEBA.gpkg"
            table = root / "PRC_OTRA.csv"
            self._make_gpkg(gpkg, ["Z1"])
            self._make_table(table, ["Z1"], comuna="OTRA")
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
