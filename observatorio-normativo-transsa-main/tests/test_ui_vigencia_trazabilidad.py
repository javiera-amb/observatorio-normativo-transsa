import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VigenciaTrazabilidadUiTests(unittest.TestCase):
    def test_timeline_es_vertical_y_con_linea_continua(self):
        source = (ROOT / "vigencia-simplificada.js").read_text(encoding="utf-8")
        self.assertIn(".compact-normative-timeline .timeline::before { display:block", source)
        self.assertIn("grid-template-columns:1fr", source)
        self.assertNotIn("repeat(auto-fit,minmax(170px,1fr))", source)

    def test_actos_sin_fecha_y_fuentes_oficiales_se_renderizan(self):
        source = (ROOT / "vigencia-estrategica.js").read_text(encoding="utf-8")
        pipeline = (ROOT / "vigencia-pilotos-v2.js").read_text(encoding="utf-8")
        self.assertIn("Sin fecha informada", source)
        self.assertIn("Consultar registro oficial", source)
        self.assertIn("Documento oficial", source)
        self.assertIn("documentos_oficiales", pipeline)

    def test_detalle_normativo_distingue_datos_y_pendientes(self):
        source = (ROOT / "vigencia-simplificada.js").read_text(encoding="utf-8")
        self.assertIn("Detalle de cambios normativos", source)
        self.assertIn("Aún no hay cambios específicos validados", source)
        self.assertIn("change.antes", source)
        self.assertIn("change.despues", source)

    def test_selector_comunal_aparece_despues_de_cobertura_nacional(self):
        source = (ROOT / "index.html").read_text(encoding="utf-8")
        regions = source.index('class="capas-regions-section"')
        selector = source.index('class="capas-commune-picker"')
        detail = source.index('class="capas-kpis"')
        self.assertLess(regions, selector)
        self.assertLess(selector, detail)

    def test_seccionales_integran_consolidado_sin_compararse_entre_si(self):
        pipeline = (ROOT / "vigencia-pilotos-v2.js").read_text(encoding="utf-8")
        view = (ROOT / "vigencia-simplificada.js").read_text(encoding="utf-8")
        self.assertIn('if (type === "PS" || type === "LU") return false', pipeline)
        self.assertIn('event.clase_evento !== "comparacion_versiones"', pipeline)
        self.assertIn("...versionComparisons.map(timelineFromComparison)", pipeline)
        self.assertIn("Consolidado normativo comunal PRC + seccionales", pipeline)
        self.assertIn("instrumentos_escala_superior", pipeline)
        self.assertIn("Consolidado comunal a entregar: PRC +", view)
        self.assertIn("Los seccionales de sectores distintos", view)
        self.assertIn("Escalas superiores y otros instrumentos", view)

    def test_seccionales_aparecen_como_cambios_normativos_en_todas_las_comunas(self):
        pipeline = (ROOT / "vigencia-pilotos-v2.js").read_text(encoding="utf-8")
        view = (ROOT / "vigencia-simplificada.js").read_text(encoding="utf-8")
        self.assertIn('tipo_cambio: "sustitucion_normativa_sectorial"', pipeline)
        self.assertIn("cambios_normativos:", pipeline)
        self.assertIn("sectionalChanges", view)
        self.assertIn('origen_cambio: "plan_seccional"', view)
        self.assertIn("Ámbito del seccional · zonas por identificar", view)
        self.assertIn("detalle normativo pendiente", view)


if __name__ == "__main__":
    unittest.main()
