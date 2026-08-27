import json
import tempfile
import unittest
from pathlib import Path

from scripts.indexar_prc_onedrive import contexto, seleccionar_archivos_prc
from scripts.sincronizar_tui_local import resolver_raiz_prc


class RutasOneDriveTest(unittest.TestCase):
    def test_migra_raiz_anterior_a_ipt_nacional(self):
        with tempfile.TemporaryDirectory() as temporal:
            base = Path(temporal)
            nueva = base / "00_IPT_Nacional"
            nueva.mkdir()
            config_path = base / "rutas_tui.json"
            config = {
                "prc_root": str(base / "00_PRC_Actualización Transsa_2026_S2"),
                "capas_root": str(base / "FUENTES_TUI"),
            }
            config_path.write_text(json.dumps(config), encoding="utf-8")

            resultado = resolver_raiz_prc(config, config_path)

            self.assertEqual(resultado, nueva)
            guardada = json.loads(config_path.read_text(encoding="utf-8"))
            self.assertEqual(Path(guardada["prc_root"]), nueva)

    def test_reconoce_prc_con_prefijo_y_excluye_otros_ipt(self):
        with tempfile.TemporaryDirectory() as temporal:
            raiz = Path(temporal)
            prc = raiz / "Valparaíso" / "01_PRC" / "Quilpué" / "zonas.gpkg"
            pri = raiz / "Valparaíso" / "02_PRI" / "Satélite" / "zonas.gpkg"
            prc.parent.mkdir(parents=True)
            pri.parent.mkdir(parents=True)
            prc.touch()
            pri.touch()

            seleccionados, ignorados = seleccionar_archivos_prc([prc, pri], raiz)

            self.assertEqual(seleccionados, [prc])
            self.assertEqual(ignorados, 1)
            self.assertEqual(contexto(prc, raiz)["comuna"], "Quilpué")


if __name__ == "__main__":
    unittest.main()
