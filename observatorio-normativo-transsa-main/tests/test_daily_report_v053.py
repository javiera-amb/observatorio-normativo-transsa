from __future__ import annotations

import tempfile
import unittest
from datetime import date
from pathlib import Path

from docx import Document

from automation.reports.daily_report import clean_edition_number, generate_daily_docx


class DailyReportV053Tests(unittest.TestCase):
    def test_cleans_trailing_period_from_edition(self):
        self.assertEqual(clean_edition_number("44.517."), "44.517")

    def test_docx_header_has_no_double_punctuation(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "reporte.docx"
            generate_daily_docx(
                report_date=date(2026, 8, 5),
                edition_number="44.517.",
                events=[],
                output_path=output,
                no_news_reason="Sin novedades.",
            )
            document = Document(output)
            text = "\n".join(p.text for p in document.paragraphs)
            self.assertIn("Edición N.º 44.517 · 5 de agosto de 2026", text)
            self.assertNotIn("44.517. ·", text)


if __name__ == "__main__":
    unittest.main()
