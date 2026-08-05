from __future__ import annotations

import unittest

from automation.official_extractors import (
    build_environmental_intelligence,
    extract_official_fields,
)


class OfficialExtractorTests(unittest.TestCase):
    def test_extracts_sea_participation_act(self):
        text = (
            "Servicio de Evaluación Ambiental / Región Metropolitana NOTIFICA "
            "resolución exenta N° 202613001215 del Servicio de Evaluación Ambiental "
            "de la Región Metropolitana, del 29 de julio de 2026, se ha resuelto dar "
            "inicio a un proceso de participación ciudadana, por un plazo de 20 días hábiles "
            "en la Declaración de Impacto Ambiental del proyecto denominado “Modernización "
            "y Optimización Planta Colina Aceros AZA”, cuyo Titular es Aceros AZA S.A. "
            "El proyecto consiste en aumentar la capacidad de producción de acero de 580.000 "
            "a 700.000 toneladas anuales, mediante mejoras de infraestructura, y se encuentra "
            "ubicado en Panamericana Norte 18968, comuna de Colina, Región Metropolitana. "
            "La comunidad podrá formular observaciones dentro de 20 días hábiles contados desde "
            "la presente publicación, conforme al artículo 30 bis de la ley N° 19.300 y los "
            "artículos 94 y 95 del DS N° 40/2012."
        )
        result = extract_official_fields(text)
        self.assertEqual(result["official_issuer"], "Servicio de Evaluación Ambiental de la Región Metropolitana de Santiago")
        self.assertEqual(result["act_number"], "202613001215")
        self.assertEqual(result["act_date"], "2026-07-29")
        self.assertEqual(result["participation_days"], 20)
        self.assertEqual(result["participation_start_rule"], "Desde la fecha de publicación en el Diario Oficial")
        self.assertIn("Artículo 30 bis", result["legal_basis"])
        self.assertIn("Artículos 94 y 95", result["legal_basis"])
        self.assertEqual(result["project_holder"], "Aceros AZA S.A")
        self.assertIn("580.000 a 700.000 toneladas", result["project_description"])
        self.assertEqual(result["commune"], "Colina")

    def test_extracts_port_project_facts_and_next_business_day_rule(self):
        text = (
            "Servicio de Evaluación Ambiental / Región del Biobío NOTIFICA. Mediante "
            "resolución exenta N° 20260800181, de fecha 29 de julio de 2026, se resolvió "
            "dar inicio a un proceso de participación ciudadana por un plazo de 20 días hábiles, "
            "de acuerdo al artículo 30 bis de la ley N° 19.300, para el proyecto denominado "
            "“Modificación de Puerto de Coronel”, cuyo proponente es Compañía Puerto de Coronel S.A. "
            "El Proyecto se pretende localizar en el sector Playa Negra, comuna de Coronel, provincia "
            "de Concepción, Región del Biobío. El objetivo central del Proyecto es actualizar sus "
            "operaciones. Asimismo, realizar dragado de profundización para atender naves de mayor "
            "calado y aumentar la capacidad de carga. Considera una vida útil de 50 años. "
            "Las observaciones se reciben conforme al artículo 95 del DS N° 40/2012, por 20 días "
            "hábiles, contados a partir del día hábil siguiente de la presente publicación."
        )
        result = extract_official_fields(text)
        self.assertEqual(result["act_number"], "20260800181")
        self.assertEqual(result["participation_start_rule"], "Desde el día hábil siguiente a la publicación en el Diario Oficial")
        self.assertIn("vida útil de 50 años", result["project_description"])
        self.assertEqual(result["commune"], "Coronel")
        self.assertEqual(result["province"], "Concepción")

    def test_builds_concrete_environmental_intelligence(self):
        fields = {
            "procedure_stage": "Apertura de participación ciudadana dentro de una evaluación ambiental en curso",
            "participation_days": 20,
            "participation_start_rule": "Desde el día hábil siguiente a la publicación en el Diario Oficial",
            "project_description": "realizar dragado de profundización y atender naves de mayor calado.",
        }
        result = build_environmental_intelligence(fields, "Puerto, muelle, dragado y centro logístico")
        self.assertIn("ya se encuentra en curso", result["why_it_matters"])
        self.assertIn("quedó abierto", result["practical_implications"])
        self.assertNotIn("se abrirá", result["practical_implications"])
        self.assertIn("actividad logística", result["recommended_action"])


if __name__ == "__main__":
    unittest.main()
