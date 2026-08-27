from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from core.database import count_records, fetch_web_events, initialize_database, upsert_events
from core.legacy import read_legacy_reports
from core.models import CanonicalEvent
from core.paths import ProjectPaths


class RepositoryMigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.paths = ProjectPaths.discover()

    def test_portal_events_can_build_a_fresh_database(self) -> None:
        """Valida el portal sin depender de la SQLite local ignorada por Git.

        ``data/db/tui.sqlite3`` es una base de ejecución local y no se publica.
        GitHub Actions debe reconstruir una base temporal desde
        ``data/reportes.js`` y comprobar que todos los registros heredados
        quedan representados como eventos canónicos.
        """
        legacy = read_legacy_reports(self.paths.legacy_reports_js)
        events = [CanonicalEvent.from_legacy_report(item) for item in legacy]

        with tempfile.TemporaryDirectory() as tmp:
            database = Path(tmp) / "tui.sqlite3"
            initialize_database(database)
            created, updated = upsert_events(database, events)
            stored = fetch_web_events(database)

            legacy_fingerprints = {
                (
                    str(item.get("titulo") or "").strip(),
                    str(item.get("fecha") or "").strip(),
                    str(item.get("source_url") or "").strip(),
                )
                for item in legacy
            }
            stored_fingerprints = {
                (
                    str(item.get("title") or "").strip(),
                    str(item.get("event_date") or "").strip(),
                    str(item.get("source_url") or "").strip(),
                )
                for item in stored
            }

            self.assertEqual(created, len(events))
            self.assertEqual(updated, 0)
            self.assertEqual(count_records(database, "events"), len(legacy))
            self.assertEqual(legacy_fingerprints, stored_fingerprints)


if __name__ == "__main__":
    unittest.main()
