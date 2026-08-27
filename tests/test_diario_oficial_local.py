from __future__ import annotations

import tempfile
import unittest
from datetime import date
from pathlib import Path

from automation.reports.daily_report import event_to_legacy_report, generate_daily_docx
from automation.sources.diario_oficial import (
    extract_edition,
    extract_publications,
    score_relevance,
    select_candidates,
)
from core.ingest import build_events


HTML = """
<html><body>
<div>Edición Núm. 44.517 del 5 de agosto de 2026</div>
<div>
  Ministerio de Vivienda y Urbanismo | Modificación al Plan Regulador Comunal de Prueba
  <a href="/docs/2026/08/05/01/1234567.pdf">Ver PDF (CVE-1234567)</a>
</div>
<div>
  Ministerio del Interior | Establece orden de subrogación de cargo
  <a href="/docs/2026/08/05/01/7654321.pdf">Ver PDF (CVE-7654321)</a>
</div>
</body></html>
"""


def sample_event():
    return build_events(
        [
            {
                "event_type": "normative_update",
                "title": "Modificación al Plan Regulador Comunal de Prueba",
                "event_date": "2026-08-05",
                "published_at": "2026-08-05",
                "summary": "Se publicó una modificación al instrumento comunal.",
                "why_it_matters": "Puede cambiar condiciones urbanísticas.",
                "practical_implications": "Corresponde revisar la cartografía vigente.",
                "impacted_parties": "Analistas, propietarios y desarrolladores.",
                "recommended_action": "Revisar la fuente oficial.",
                "recommended_action_code": "review_source",
                "relevance_level": "high",
                "impact_level": "medium",
                "confidence": 0.9,
                "review_status": "requires_review",
                "requires_review_reason": "Debe verificarse la fecha de entrada en vigencia.",
                "category": "planificacion_urbana",
                "topics": ["plan_regulador_comunal"],
                "market_segments": ["no_aplica"],
                "territory": {
                    "scale": "communal",
                    "region": "Región de prueba",
                    "commune": "Comuna de prueba",
                },
                "source": {
                    "source_name": "Diario Oficial de la República de Chile",
                    "source_type": "official",
                    "reliability_level": "primary",
                    "collection_method": "local_pipeline",
                    "url": "https://example.com/1234567.pdf",
                    "external_id": "1234567",
                    "edition": "44.517",
                    "document_type": "Resolución",
                },
            }
        ],
        strict=True,
    )[0]


class DiarioOficialLocalTests(unittest.TestCase):
    def test_extracts_edition_and_publications(self) -> None:
        edition = extract_edition(HTML)
        self.assertEqual(edition.number, "44.517")
        self.assertEqual(edition.publication_date, date(2026, 8, 5))
        publications = extract_publications(HTML)
        self.assertEqual(len(publications), 2)
        self.assertEqual(publications[0].cve, "1234567")

    def test_prefilter_includes_plan_and_excludes_subrogation(self) -> None:
        publications = extract_publications(HTML)
        candidates = select_candidates(publications, threshold=4)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].cve, "1234567")
        self.assertGreater(candidates[0].relevance_score, 4)
        self.assertLess(publications[1].relevance_score, 4)

    def test_scoring_is_accent_insensitive(self) -> None:
        score, terms = score_relevance(
            "Recepción definitiva de edificación",
            "Dirección de Obras Municipales",
        )
        self.assertGreaterEqual(score, 7)
        self.assertIn("recepcion definitiva", terms)

    def test_generates_docx_and_legacy_payload(self) -> None:
        event = sample_event()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            output = root / "reporte.docx"
            generated = generate_daily_docx(
                date(2026, 8, 5), "44.517", [event], output
            )
            self.assertTrue(generated.exists())
            self.assertGreater(generated.stat().st_size, 1000)
            legacy = event_to_legacy_report(event, output, root)
            self.assertEqual(legacy["estado_revision"], "requires_review")
            self.assertEqual(legacy["word_url"], "reporte.docx")


if __name__ == "__main__":
    unittest.main()
