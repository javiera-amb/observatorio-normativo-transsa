from __future__ import annotations

import unittest

from automation.news.events import news_item_to_event
from automation.news.models import NewsItem, NewsSource
from automation.news.territory import detect_territory
from core.validation import validate_event


class TerritoryDetectionTests(unittest.TestCase):
    def test_detects_commune_and_region(self) -> None:
        result = detect_territory(
            "Nuevo proyecto inmobiliario en Concepción",
            "La iniciativa considera infraestructura urbana.",
        )
        self.assertEqual(result.scale, "communal")
        self.assertEqual(result.commune, "Concepcion")
        self.assertEqual(result.region, "Región del Biobío")
        self.assertGreaterEqual(result.confidence, 0.8)

    def test_detects_multiple_communes(self) -> None:
        result = detect_territory(
            "Plan conecta Valparaíso y Viña del Mar",
            "Proyecto de movilidad urbana intercomunal.",
        )
        self.assertEqual(result.scale, "multiple")
        self.assertEqual(result.region, "Región de Valparaíso")

    def test_returns_undetermined_without_signal(self) -> None:
        result = detect_territory("Mercado mantiene tendencia", "Informe sectorial trimestral.")
        self.assertEqual(result.scale, "undetermined")


class NewsEventConversionTests(unittest.TestCase):
    def test_candidate_becomes_valid_review_event(self) -> None:
        source = NewsSource(
            source_id="medio-prueba",
            name="Medio de prueba",
            base_url="https://ejemplo.cl/",
            source_type="news_media",
            reliability_level="high",
            confidence_tier="B",
            commercial_interest=False,
            access_mode="rss",
            feed_url="https://ejemplo.cl/feed.xml",
            enabled=True,
            priority=80,
        )
        item = NewsItem(
            source_id=source.source_id,
            source_name=source.name,
            title="Proyecto inmobiliario se anuncia en Puerto Montt",
            url="https://ejemplo.cl/proyecto",
            canonical_url="https://ejemplo.cl/proyecto",
            published_at="2026-08-06",
            excerpt="La inversión considera viviendas e infraestructura.",
            external_id="noticia-1",
            categories=["inversion_y_proyectos"],
            relevance_score=18,
            relevance_level="high",
            relevance_reasons=["proyecto inmobiliario", "infraestructura"],
        )

        event = news_item_to_event(item, source)
        issues = validate_event(event, strict=False)

        self.assertEqual(event.event_type, "news")
        self.assertEqual(event.review_status, "requires_review")
        self.assertEqual(event.territory.commune, "Puerto Montt")
        self.assertEqual(event.source.source_name, source.name)
        self.assertFalse([issue for issue in issues if issue.severity == "error"])


if __name__ == "__main__":
    unittest.main()
