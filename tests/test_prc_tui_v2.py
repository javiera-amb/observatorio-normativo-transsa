import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.indexar_prc_onedrive import detectar_estado, detectar_modelo, validar_gpkg


ROOT = Path(__file__).resolve().parents[1]


class PrcTuiV2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.estandar = json.loads(
            (ROOT / "config" / "estandar_prc_tui_v2.json").read_text(encoding="utf-8")
        )

    def test_detecta_version_y_estado_en_nombre(self):
        nombre = "IPT_00_PRC_Coquimbo_TUI_V2_Actualizado.gpkg"
        self.assertEqual(detectar_modelo(nombre), "tui_v2")
        self.assertEqual(detectar_estado(nombre), "actualizado")
        self.assertEqual(detectar_modelo("IPT_00_PRC_Coquimbo_Enviado.gpkg"), "sin_clasificar")

    def test_bloquea_gpkg_sin_tabla_normativa(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as temporal:
            ruta = Path(temporal) / "IPT_00_PRC_Prueba_TUI_V2_Actualizado.gpkg"
            conexion = sqlite3.connect(ruta)
            try:
                conexion.executescript(
                    """
                    CREATE TABLE gpkg_contents (
                      table_name TEXT PRIMARY KEY, data_type TEXT, identifier TEXT
                    );
                    CREATE TABLE gpkg_geometry_columns (
                      table_name TEXT, column_name TEXT
                    );
                    CREATE TABLE zonificacion (fid INTEGER PRIMARY KEY, geom BLOB);
                    INSERT INTO gpkg_contents VALUES ('zonificacion', 'features', 'zonificacion');
                    INSERT INTO gpkg_geometry_columns VALUES ('zonificacion', 'geom');
                    """
                )
                conexion.commit()
            finally:
                conexion.close()
            resultado = validar_gpkg(ruta, self.estandar, "tui_v2")
            self.assertFalse(resultado["atributos_embebidos"])
            self.assertFalse(resultado["estandar_tui_v2"]["cumple_estructura"])
            self.assertTrue(any("identificación de zona" in item for item in resultado["estandar_tui_v2"]["bloqueos"]))


if __name__ == "__main__":
    unittest.main()
