from __future__ import annotations

import unittest

from automation.ollama.analyzer import analyze_document
from automation.ollama.client import parse_json_object
from automation.ollama.config import OllamaConfig
from automation.ollama.normalize import normalize_analysis


class StubClient:
    def __init__(self, response: dict):
        self.response = response
        self.config = OllamaConfig(max_input_characters=2000)

    def generate_json(self, prompt: str) -> dict:
        self.last_prompt = prompt
        return self.response


class OllamaModuleTests(unittest.TestCase):
    def test_parse_json_fenced(self) -> None:
        parsed = parse_json_object('```json\n{"es_relevante": true}\n```')
        self.assertTrue(parsed["es_relevante"])

    def test_normalizes_spanish_aliases(self) -> None:
        result = normalize_analysis(
            {
                "es_relevante": "sí",
                "tipo_evento": "Regulación urbana",
                "resumen": "Resumen de prueba.",
                "accion_sugerida": "Revisar la fuente.",
                "codigo_accion": "revisar_fuente",
                "relevancia": "alta",
                "impacto": "medio",
                "confianza": 1.4,
                "territorio": {"escala": "comunal", "comuna": "Prueba"},
            }
        )
        self.assertEqual(result["event_type"], "normative_update")
        self.assertEqual(result["recommended_action_code"], "review_source")
        self.assertEqual(result["relevance_level"], "high")
        self.assertEqual(result["impact_level"], "medium")
        self.assertEqual(result["confidence"], 1.0)
        self.assertEqual(result["territory"]["scale"], "communal")


    def test_reason_forces_requires_review_status(self) -> None:
        result = normalize_analysis(
            {
                "es_relevante": True,
                "event_type": "news",
                "review_status": "preliminary",
                "requires_review_reason": "Debe verificarse la comuna.",
                "territory": {"scale": "communal", "commune": ""},
            }
        )
        self.assertEqual(result["review_status"], "requires_review")
        self.assertIn("comuna", result["requires_review_reason"].lower())

    def test_official_plan_regulator_overrides_news_type(self) -> None:
        client = StubClient(
            {
                "es_relevante": True,
                "event_type": "news",
                "summary": "Se modificó el instrumento comunal.",
                "why_it_matters": "Cambia condiciones urbanísticas.",
                "practical_implications": "Se debe revisar la cartografía.",
                "impacted_parties": "Analistas y propietarios.",
                "recommended_action": "Revisar la fuente.",
                "recommended_action_code": "review_source",
                "relevance_level": "high",
                "impact_level": "medium",
                "confidence": 0.82,
                "review_status": "preliminary",
                "requires_review_reason": "La comuna no está identificada.",
                "category": "planificacion_urbana",
                "topics": ["plan_regulador_comunal"],
                "market_segments": ["no_aplica"],
                "actors": [],
                "projects": [],
                "tags": [],
                "territory": {
                    "scale": "communal",
                    "country": "Chile",
                    "region": "",
                    "commune": "",
                    "province": "",
                    "locality": "",
                },
            }
        )
        metadata = {
            "title": "Modificación al Plan Regulador Comunal",
            "event_date": "2026-08-05",
            "source": {
                "source_name": "Municipalidad de ejemplo",
                "source_type": "municipal",
                "reliability_level": "primary",
            },
        }
        analysis, event = analyze_document(
            client,
            metadata,
            "La municipalidad publicó una modificación al Plan Regulador Comunal.",
        )
        self.assertEqual(analysis["event_type"], "normative_update")
        self.assertEqual(event.event_type, "normative_update")
        self.assertEqual(event.review_status, "requires_review")
        self.assertIn("hybrid_classification", event.tags)
        self.assertEqual(event.legacy_payload["ai_event_type_raw"], "news")

    def test_environmental_assessment_has_priority(self) -> None:
        client = StubClient(
            {
                "es_relevante": True,
                "event_type": "news",
                "summary": "Se abrió participación ciudadana.",
                "review_status": "preliminary",
                "territory": {"scale": "regional", "region": "Biobío"},
            }
        )
        metadata = {
            "title": "Participación ciudadana de proyecto",
            "event_date": "2026-08-05",
            "source": {
                "source_name": "Servicio de Evaluación Ambiental",
                "source_type": "official",
                "reliability_level": "primary",
            },
        }
        analysis, event = analyze_document(
            client, metadata, "Declaración de Impacto Ambiental del proyecto."
        )
        self.assertEqual(analysis["event_type"], "environmental_assessment")
        self.assertEqual(event.event_type, "environmental_assessment")


    def test_environmental_procedure_overrides_imprecise_ai_wording(self) -> None:
        client = StubClient(
            {
                "es_relevante": True,
                "event_type": "environmental_assessment",
                "summary": "Comenzó la evaluación ambiental.",
                "why_it_matters": "Puede afectar la percepción local.",
                "practical_implications": "El proceso se abrirá por 20 días.",
                "impacted_parties": "Comunidad y titular.",
                "recommended_action": "Recopilar opiniones.",
                "recommended_action_code": "monitor",
                "relevance_level": "medium",
                "impact_level": "unknown",
                "confidence": 0.8,
                "review_status": "preliminary",
                "category": "evaluacion_ambiental",
                "territory": {"scale": "communal", "country": "Chile", "region": "", "commune": "", "province": "", "locality": ""},
            }
        )
        metadata = {
            "title": "Participación ciudadana de proyecto portuario",
            "event_date": "2026-08-05",
            "source": {"source_name": "Diario Oficial de la República de Chile", "source_type": "official", "reliability_level": "primary"},
        }
        text = (
            "Servicio de Evaluación Ambiental / Región del Biobío NOTIFICA. Mediante resolución "
            "exenta N° 20260800181, de fecha 29 de julio de 2026, se resolvió dar inicio a un proceso "
            "de participación ciudadana por un plazo de 20 días hábiles, en la Declaración de Impacto "
            "Ambiental del proyecto denominado “Puerto de prueba”, cuyo proponente es Empresa S.A. "
            "El Proyecto se pretende localizar en comuna de Coronel, provincia de Concepción, Región del Biobío. "
            "El objetivo central del Proyecto es realizar dragado y atender naves de mayor calado. "
            "Las observaciones se reciben por 20 días hábiles contados a partir del día hábil siguiente "
            "de la presente publicación, conforme al artículo 30 bis de la ley N° 19.300 y los artículos "
            "94 y 95 del DS N° 40/2012."
        )
        analysis, event = analyze_document(client, metadata, text)
        self.assertIn("ya se encuentra en curso", event.why_it_matters)
        self.assertIn("quedó abierto", event.practical_implications)
        self.assertNotIn("se abrirá", event.practical_implications)
        self.assertIn("actividad logística", event.recommended_action)
        self.assertEqual(event.legacy_payload["official_act"]["participation_start_rule"], "Desde el día hábil siguiente a la publicación en el Diario Oficial")
        self.assertIn("Artículos 94 y 95", event.legacy_payload["official_act"]["legal_basis"])

    def test_builds_valid_preliminary_event(self) -> None:
        client = StubClient(
            {
                "es_relevante": True,
                "event_type": "news",
                "summary": "Se anunció una inversión urbana.",
                "why_it_matters": "Puede afectar la actividad local.",
                "practical_implications": "Conviene monitorear el proyecto.",
                "impacted_parties": "Analistas y tasadores.",
                "recommended_action": "Monitorear avances.",
                "recommended_action_code": "monitor",
                "relevance_level": "high",
                "impact_level": "medium",
                "confidence": 0.85,
                "review_status": "preliminary",
                "requires_review_reason": "",
                "category": "inversion_inmobiliaria",
                "topics": ["inversion_inmobiliaria"],
                "market_segments": ["residencial"],
                "actors": ["Empresa de prueba"],
                "projects": [],
                "tags": ["inversion"],
                "territory": {
                    "scale": "communal",
                    "country": "Chile",
                    "region": "Región de prueba",
                    "commune": "Comuna de prueba",
                    "province": "",
                    "locality": "",
                },
            }
        )
        metadata = {
            "title": "Inversión de prueba",
            "event_date": "2026-08-05",
            "source": {
                "source_name": "Medio de prueba",
                "source_type": "news_media",
                "reliability_level": "medium",
            },
        }
        analysis, event = analyze_document(client, metadata, "Texto de prueba")
        self.assertTrue(analysis["es_relevante"])
        self.assertEqual(event.event_type, "news")
        self.assertEqual(event.review_status, "preliminary")
        self.assertIn("ollama_preliminary", event.tags)


if __name__ == "__main__":
    unittest.main()
