from __future__ import annotations

import unittest

from core.database import count_records, fetch_web_events
from core.legacy import read_legacy_reports
from core.paths import ProjectPaths


class RepositoryMigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.paths = ProjectPaths.discover()

    def test_database_contains_portal_events(self) -> None:
        """El portal heredado puede convivir con eventos canónicos nuevos.

        La igualdad exacta dejó de ser válida desde que el pipeline incorpora
        eventos universales cuyo legacy_payload no es una copia del registro web.
        Se comprueba identidad por event_id cuando está disponible y que la base
        no tenga menos eventos que el portal.
        """
        legacy = read_legacy_reports(self.paths.legacy_reports_js)
        stored = fetch_web_events(self.paths.database)
        stored_ids = {str(item.get("event_id") or "") for item in stored}
        portal_ids = {
            str(item.get("event_id") or "")
            for item in legacy
            if str(item.get("event_id") or "").strip()
        }
        self.assertTrue(portal_ids.issubset(stored_ids))
        self.assertGreaterEqual(count_records(self.paths.database, "events"), len(legacy))


if __name__ == "__main__":
    unittest.main()
