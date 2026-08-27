import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

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
            self.assertFalse(resultado["tabla_normativa_separada"]["valido"])
            self.assertFalse(resultado["estandar_tui_v2"]["cumple_estructura"])
            self.assertTrue(any("identificación de zona" in item for item in resultado["estandar_tui_v2"]["bloqueos"]))

    def test_aprueba_geometria_y_normativa_separadas_con_clave_comun(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as temporal:
            carpeta = Path(temporal)
            ruta = carpeta / "IPT_00_PRC_Prueba_TUI_V2_Actualizado.gpkg"
            normativa = carpeta / "IPT_00_PRC_Prueba_TUI_V2_Normativa.csv"
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
                    CREATE TABLE zonificacion (
                      fid INTEGER PRIMARY KEY, geom BLOB, codigo_zona TEXT, unidad_normativa_id TEXT
                    );
                    INSERT INTO gpkg_contents VALUES ('zonificacion', 'features', 'zonificacion');
                    INSERT INTO gpkg_geometry_columns VALUES ('zonificacion', 'geom');
                    INSERT INTO zonificacion VALUES (1, X'00', 'Z1', 'PRUEBA-Z1');
                    """
                )
                conexion.commit()
            finally:
                conexion.close()
            normativa.write_text(
                "unidad_normativa_id;uso_suelo;altura_maxima\nPRUEBA-Z1;Residencial;14\n",
                encoding="utf-8",
            )
            with patch(
                "scripts.indexar_prc_onedrive.validar_geometrias",
                return_value={"estado": "ejecutado", "valido": True, "capas": []},
            ):
                resultado = validar_gpkg(ruta, self.estandar, "tui_v2", normativa)
            self.assertTrue(resultado["geometria_identificada"])
            self.assertTrue(resultado["tabla_normativa_separada"]["valido"])
            self.assertTrue(resultado["estandar_tui_v2"]["cumple_estructura"])


if __name__ == "__main__":
    unittest.main()
