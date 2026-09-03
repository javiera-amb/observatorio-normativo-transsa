import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VigenciaFuenteUnificadaTests(unittest.TestCase):
    def test_cargador_legacy_ya_no_inyecta_catalogos_historicos(self):
        text = (ROOT / "data" / "vigencia_cartografica.js").read_text(encoding="utf-8")
        self.assertNotIn("document.write", text)
        self.assertNotIn("ipt_vigentes_", text)
        self.assertNotIn("actos_ipt.js", text)
        self.assertIn("SEGUIMIENTO_NORMATIVO", text)

    def test_ux_carga_solo_adaptador_unificado_para_vigencia(self):
        text = (ROOT / "ux-refresh.js").read_text(encoding="utf-8")
        self.assertIn("vigencia-seguimiento-unificado.js", text)
        for legacy in (
            "actos_ipt_nacional_",
            "vigencia-comunal-v2.js",
            "vigencia-pilotos-v2.js",
            "vigencia-simplificada.js",
            "comparacion_coquimbo_detallada_v2.js",
        ):
            self.assertNotIn(legacy, text)

    def test_adaptador_usa_seguimiento_nacional_para_toda_la_ficha(self):
        text = (ROOT / "vigencia-seguimiento-unificado.js").read_text(encoding="utf-8")
        self.assertIn("window.SEGUIMIENTO_NORMATIVO", text)
        self.assertIn("actos_posteriores_detalle", text)
        self.assertIn("candidatos_normativos_detalle", text)
        self.assertIn('window.VIGENCIA_SOURCE_MODE = "seguimiento_nacional_unificado"', text)

    def test_chiguayante_conserva_ambos_decretos_2024_en_fuente_nacional(self):
        text = (ROOT / "data" / "seguimiento_normativo.js").read_text(encoding="utf-8")
        self.assertIn("BCN-1203429", text)
        self.assertIn("BCN-1203864", text)
        self.assertIn("chiguayante-da-898-2024", text)
        self.assertIn("chiguayante-da-1033-2024", text)


if __name__ == "__main__":
    unittest.main()
