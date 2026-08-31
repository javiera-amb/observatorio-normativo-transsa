import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class TablasNormativasUiAutomaticoTests(unittest.TestCase):
    def test_estado_tabla_base_no_se_presenta_como_tabla_final(self):
        text = (ROOT / "data" / "tablas_normativas_sharepoint.js").read_text(encoding="utf-8")
        self.assertIn('TABLA BASE DETECTADA', text)
        self.assertIn('La existencia de una tabla base no significa que esté auditada', text)

    def test_carga_manual_se_oculta_del_flujo_productivo(self):
        text = (ROOT / "data" / "tablas_normativas_sharepoint.js").read_text(encoding="utf-8")
        self.assertIn('El selector de archivos era parte del prototipo', text)
        self.assertIn('topDiagnostic.hidden = true', text)
        self.assertIn('No tienes que subir ningún archivo', text)

    def test_staging_es_calculado_y_no_checkbox_manual(self):
        text = (ROOT / "data" / "tablas_normativas_sharepoint.js").read_text(encoding="utf-8")
        self.assertIn('Control de staging automático', text)
        self.assertIn('Actos posteriores detectados', text)
        self.assertIn('Vínculo PRC ↔ CODIGO_PRC ↔ variantes', text)

    def test_renca_registra_prc_y_enmienda_2026_publicos(self):
        text = (ROOT / "tablas-normativas-fuentes.js").read_text(encoding="utf-8")
        self.assertIn('renca-muni-prc-2022', text)
        self.assertIn('renca-muni-enmienda-1-2026', text)
        self.assertIn('Decreto N° 1460 de 15-06-2026', text)
        self.assertIn('enmienda-n1-del-plan-regulador-comunal-2026', text)

    def test_fuentes_hacen_fallback_al_seguimiento_nacional(self):
        text = (ROOT / "tablas-normativas-fuentes.js").read_text(encoding="utf-8")
        self.assertIn('window.SEGUIMIENTO_NORMATIVO', text)
        self.assertIn('DETECCIÓN NACIONAL DE VIGENCIA', text)
        self.assertIn('Último acto detectado', text)


if __name__ == "__main__":
    unittest.main()
