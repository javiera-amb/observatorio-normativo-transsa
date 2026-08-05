from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from core.database import connect, initialize_database, load_legacy_payloads, upsert_events
from core.events import write_event_json
from core.legacy import read_legacy_reports, write_legacy_reports
from core.models import CanonicalEvent


SAMPLE = [
    {
        "fecha": "2026-08-05",
        "titulo": "Ejemplo",
        "estado": "Con novedades",
        "escala": "Comunal",
        "categoria": "Planificación urbana",
        "region": "Maule",
        "comuna": "Talca",
        "organismo": "Organismo de prueba",
        "tipo_norma": "Resolución",
        "numero": "N.º 1",
        "resumen": "Resumen",
        "implicancia": "Implicancia",
        "impactados": "Actores",
        "destacado": True,
        "source_url": "https://example.com/1.pdf",
        "cve": "1",
        "edicion": "44.517",
    }
]


class LegacyMigrationTests(unittest.TestCase):
    def test_read_and_write_legacy_reports(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "reportes.js"
            write_legacy_reports(path, SAMPLE)
            self.assertEqual(read_legacy_reports(path), SAMPLE)

    def test_migration_is_idempotent_and_reversible(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db = root / "tui.sqlite3"
            events_dir = root / "events"
            initialize_database(db)

            events = [CanonicalEvent.from_legacy_report(item) for item in SAMPLE]
            created, updated = upsert_events(db, events)
            self.assertEqual((created, updated), (1, 0))

            created, updated = upsert_events(db, events)
            self.assertEqual((created, updated), (0, 1))
            self.assertEqual(load_legacy_payloads(db), SAMPLE)

            file_path = write_event_json(events_dir, events[0])
            payload = json.loads(file_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["event_id"], events[0].event_id)

            # Usamos el administrador de conexión del proyecto, que cierra
            # explícitamente SQLite antes de que Windows elimine la carpeta
            # temporal. Esto evita WinError 32 en Python 3.14.
            with connect(db) as conn:
                self.assertEqual(
                    conn.execute("SELECT COUNT(*) FROM events").fetchone()[0],
                    1,
                )
                self.assertEqual(
                    conn.execute("SELECT COUNT(*) FROM source_documents").fetchone()[0],
                    1,
                )


if __name__ == "__main__":
    unittest.main()
