from __future__ import annotations

import unittest

from automation.news.deduplication import are_duplicates, deduplicate
from automation.news.models import NewsItem, NewsSource
from automation.news.normalization import canonicalize_url, normalize_title
from automation.news.relevance import score_relevance
from automation.news.rss import parse_feed
from automation.news.sources import load_sources, source_summary
from automation.news.verification import load_verifications


class NewsNormalizationTests(unittest.TestCase):
    def test_canonicalize_url_removes_tracking(self) -> None:
        value = "https://www.EJEMPLO.cl/noticia/?utm_source=mail&b=2&a=1#seccion"
        self.assertEqual(canonicalize_url(value), "https://ejemplo.cl/noticia?a=1&b=2")

    def test_normalize_title_removes_accents_and_prefix(self) -> None:
        self.assertEqual(
            normalize_title("Última hora: Inversión inmobiliaria en Concepción"),
            "inversion inmobiliaria en concepcion",
        )


class NewsRelevanceTests(unittest.TestCase):
    def test_high_relevance_market_news(self) -> None:
        result = score_relevance(
            "Nuevo proyecto inmobiliario sumará 2.000 viviendas en Concepción",
            "La inversión considera infraestructura y permisos de edificación.",
            source_priority=90,
        )
        self.assertTrue(result.is_candidate)
        self.assertEqual(result.level, "high")
        self.assertIn("inversion_y_proyectos", result.categories)

    def test_irrelevant_sports_news_is_discarded(self) -> None:
        result = score_relevance(
            "Campeonato de fútbol define a sus finalistas",
            "La selección disputará el partido este domingo.",
        )
        self.assertFalse(result.is_candidate)
        self.assertEqual(result.level, "discard")


class NewsDeduplicationTests(unittest.TestCase):
    def _item(self, title: str, url: str, excerpt: str = "") -> NewsItem:
        return NewsItem(
            source_id="fuente",
            source_name="Fuente",
            title=title,
            url=url,
            published_at="2026-08-06",
            excerpt=excerpt,
        )

    def test_url_duplicate(self) -> None:
        left = self._item("Título A", "https://sitio.cl/nota?utm_source=x")
        right = self._item("Título distinto", "https://www.sitio.cl/nota")
        self.assertTrue(are_duplicates(left, right))

    def test_near_duplicate_keeps_richer_item(self) -> None:
        left = self._item(
            "Nuevo proyecto inmobiliario en Concepción",
            "https://medio-a.cl/nota",
        )
        right = self._item(
            "Nuevo proyecto inmobiliario se anuncia en Concepción",
            "https://medio-b.cl/otra",
            "Antecedentes completos del proyecto y de su inversión.",
        )
        result = deduplicate([left, right], threshold=0.75)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].url, right.url)


class NewsFeedTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = NewsSource(
            source_id="prueba",
            name="Fuente de prueba",
            base_url="https://ejemplo.cl/",
            source_type="news_media",
            reliability_level="high",
            confidence_tier="B",
            commercial_interest=False,
            access_mode="rss",
            feed_url="https://ejemplo.cl/feed.xml",
            enabled=True,
        )

    def test_parse_rss(self) -> None:
        xml = """<?xml version='1.0' encoding='UTF-8'?>
        <rss version='2.0'><channel><title>Prueba</title><item>
          <title>Nuevo parque industrial en Coquimbo</title>
          <link>https://ejemplo.cl/parque?utm_medium=rss</link>
          <guid>abc-1</guid>
          <pubDate>Thu, 06 Aug 2026 12:00:00 -0400</pubDate>
          <description><![CDATA[Proyecto con inversión e infraestructura logística.]]></description>
        </item></channel></rss>"""
        items = parse_feed(xml, self.source)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].published_at, "2026-08-06")
        self.assertEqual(items[0].canonical_url, "https://ejemplo.cl/parque")
        self.assertEqual(items[0].external_id, "abc-1")

    def test_parse_atom(self) -> None:
        source = NewsSource(
            source_id="atom",
            name="Atom",
            base_url="https://atom.cl/",
            source_type="news_media",
            reliability_level="high",
            confidence_tier="B",
            commercial_interest=False,
            access_mode="atom",
            feed_url="https://atom.cl/feed",
            enabled=True,
        )
        xml = """<feed xmlns='http://www.w3.org/2005/Atom'>
          <entry><title>Plan de inversión urbana</title>
          <link rel='alternate' href='https://atom.cl/noticia'/>
          <id>tag:atom.cl,2026:1</id><updated>2026-08-06T12:00:00Z</updated>
          <summary>Infraestructura y desarrollo urbano.</summary></entry>
        </feed>"""
        items = parse_feed(xml, source)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].url, "https://atom.cl/noticia")
        self.assertEqual(items[0].published_at, "2026-08-06")


class NewsSourceConfigTests(unittest.TestCase):
    def test_default_source_registry_is_valid(self) -> None:
        sources = load_sources()
        summary = source_summary()
        self.assertGreaterEqual(len(sources), 12)
        self.assertGreaterEqual(summary["enabled"], 2)
        self.assertGreaterEqual(summary["verified"], 3)
        self.assertGreaterEqual(summary["tier_a"], 5)
        self.assertTrue(all(not source.validate() for source in sources))

    def test_verification_registry_matches_sources(self) -> None:
        verifications = load_verifications()
        sources = {source.source_id: source for source in load_sources()}
        self.assertEqual(set(verifications), {"diario_el_dia_economia", "diario_el_dia_region", "inmobiliare"})
        self.assertTrue(all(source_id in sources for source_id in verifications))
        self.assertEqual(sources["inmobiliare"].verification_status, "verified_public_feed")


if __name__ == "__main__":
    unittest.main()
