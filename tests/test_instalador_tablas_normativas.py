import unittest
from pathlib import Path


class InstaladorTablasNormativasTests(unittest.TestCase):
    def test_instalador_usa_sistema_operativo_dei_y_normalizadas(self):
        text = Path("automation/tablas_normativas/instalar_automatizacion.ps1").read_text(encoding="utf-8")
        self.assertIn("Sistema Operativo DEI", text)
        self.assertIn("PRC_SQL2.xlsx", text)
        self.assertIn("NORMALIZADAS", text)
        self.assertIn("schtasks.exe", text)
        self.assertNotIn("Azure", text)
        self.assertNotIn("Power Automate", text)

    def test_lanzador_usa_runner_y_catalogos_controlados(self):
        text = Path("automation/tablas_normativas/ejecutar_automatizacion.ps1").read_text(encoding="utf-8")
        self.assertIn("automation.tablas_normativas.runner", text)
        self.assertIn("tablas_normativas_codigo_aliases.json", text)
        self.assertIn("tablas_normativas_cobertura.json", text)
        self.assertIn("estado_tablas_normativas.json", text)


if __name__ == "__main__":
    unittest.main()
