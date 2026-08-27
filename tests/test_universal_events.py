from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from core.database import count_records, fetch_web_events, initialize_database, upsert_events
from core.events import write_event_json
from core.ingest import build_events, read_event_payloads
from core.validation import EventValidationError


VALID_EVENT = {
    "event_type": "market_signal",
    "title": "Aumenta la actividad residencial en una comuna de prueba",
    "event_date": "2026-08-05",
    "published_at": "2026-08-05",
    "summary": "Se identifica una señal de mayor actividad residencial.",
    "why_it_matters": "Puede anticipar cambios en la demanda y en los valores de mercado.",
    "practical_implications": "Conviene monitorear permisos, oferta y valores.",
    "impacted_parties": "Analistas y tasadores.",
    "recommended_action": "Monitorear indicadores durante los próximos meses.",
    "recommended_action_code": "monitor",
    "relevance_level": "high",
    "impact_level": "medium",
    "confidence": 0.9,
    "review_status": "preliminary",
    "category": "mercado_residencial",
    "topics": ["mercado_residencial", "permisos_y_construccion"],
    "topic_families": {
        "mercado_residencial": "mercado",
        "permisos_y_construccion": "desarrollo_urbano"
    },
    "market_segments": ["residencial", "suelo"],
    "actors": ["Empresa de prueba"],
    "projects": ["Proyecto de prueba"],
    "tags": ["actividad", "residencial"],
    "territory": {
        "scale": "communal",
        "region": "Región de prueba",
        "commune": "Comuna de prueba"
    },
    "source": {
        "source_name": "Medio de prueba",
        "source_type": "news_media",
        "reliability_level": "medium",
        "collection_method": "manual",
        "url": "https://example.com/test"
    }
}


class UniversalEventTests(unittest.TestCase):
    def test_build_store_and_export_universal_event(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            input_file = root / "input.json"
            db = root / "tui.sqlite3"
            events_dir = root / "events"
            input_file.write_text(json.dumps(VALID_EVENT, ensure_ascii=False), encoding="utf-8")

            events = build_events(read_event_payloads(input_file))
            self.assertEqual(len(events), 1)
            event = events[0]
            self.assertTrue(event.event_id.startswith("EVT-20260805-MARKET-SIGNA"))

            initialize_database(db)
            created, updated = upsert_events(db, events)
            self.assertEqual((created, updated), (1, 0))
            self.assertEqual(count_records(db, "market_segments"), 2)
            self.assertEqual(count_records(db, "actors"), 1)
            self.assertEqual(count_records(db, "projects"), 1)
            self.assertEqual(count_records(db, "event_tags"), 2)

            created, updated = upsert_events(db, events)
            self.assertEqual((created, updated), (0, 1))

            json_path = write_event_json(events_dir, event)
            self.assertTrue(json_path.exists())

            exported = fetch_web_events(db)
            self.assertEqual(len(exported), 1)
            self.assertEqual(exported[0]["market_segments"], ["residencial", "suelo"])
            self.assertEqual(exported[0]["actors"], ["Empresa de prueba"])
            self.assertEqual(exported[0]["projects"], ["Proyecto de prueba"])

    def test_invalid_event_is_rejected(self) -> None:
        payload = dict(VALID_EVENT)
        payload["event_date"] = "05-08-2026"
        with self.assertRaises(EventValidationError):
            build_events([payload])

    def test_requires_review_needs_reason(self) -> None:
        payload = dict(VALID_EVENT)
        payload["review_status"] = "requires_review"
        with self.assertRaises(EventValidationError):
            build_events([payload])


if __name__ == "__main__":
    unittest.main()
