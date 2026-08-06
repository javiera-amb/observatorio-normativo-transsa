from __future__ import annotations

import unittest

from automation.news.models import NewsSource
from automation.news.scope import detect_geographic_scope


class NewsScopeTests(unittest.TestCase):
    def _source(self, coverage: list[str]) -> NewsSource:
        return NewsSource(
            source_id="fuente",
            name="Fuente",
            base_url="https://ejemplo.cl/",
            source_type="news_media",
            reliability_level="high",
            confidence_tier="B",
            commercial_interest=False,
            access_mode="rss",
            feed_url="https://ejemplo.cl/feed.xml",
            enabled=True,
            priority=80,
            coverage=coverage,
        )

    def test_chilean_commune_has_priority(self) -> None:
        result = detect_geographic_scope(
            "Evalúan modificación del plan regulador de La Serena",
            "La propuesta considera infraestructura y suelo urbano.",
            self._source(["chile"]),
        )
        self.assertEqual(result.scope, "chile")
        self.assertEqual(result.country, "Chile")

    def test_mexican_news_is_international(self) -> None:
        result = detect_geographic_scope(
            "OMA invierte MXN 8.000 millones en el aeropuerto de Monterrey",
            "La inversión forma parte de un plan de infraestructura.",
            self._source(["latinoamerica", "chile"]),
        )
        self.assertEqual(result.scope, "international")
        self.assertEqual(result.country, "México")

    def test_regional_chilean_source_defaults_to_chile(self) -> None:
        result = detect_geographic_scope(
            "Debate por nueva infraestructura hídrica",
            "Especialistas analizan alternativas de inversión.",
            self._source(["region_de_coquimbo"]),
        )
        self.assertEqual(result.scope, "chile")
        self.assertEqual(result.country, "Chile")

    def test_ambiguous_international_source_remains_undetermined(self) -> None:
        result = detect_geographic_scope(
            "Mercado mantiene tendencia",
            "Informe trimestral de inversión.",
            self._source(["latinoamerica", "chile"]),
        )
        self.assertEqual(result.scope, "undetermined")


if __name__ == "__main__":
    unittest.main()
