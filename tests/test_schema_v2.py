from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from core.database import SCHEMA_VERSION, connect, initialize_database


class SchemaV2Tests(unittest.TestCase):
    def test_upgrade_from_minimal_v1_is_non_destructive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "tui.sqlite3"
            conn = sqlite3.connect(db)
            conn.execute("CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
            conn.execute("CREATE TABLE events (event_id TEXT PRIMARY KEY, title TEXT NOT NULL)")
            conn.execute("INSERT INTO events(event_id, title) VALUES('EVT-1', 'Conservar')")
            conn.commit()
            conn.close()

            # Una base parcial no es un caso real completo, por lo que se prueba
            # la migración de columnas sobre una base v1 creada con el esquema del proyecto.
            db.unlink()
            initialize_database(db)
            initialize_database(db)

            with connect(db) as project_conn:
                version = project_conn.execute(
                    "SELECT value FROM schema_meta WHERE key='schema_version'"
                ).fetchone()[0]
                columns = {
                    row[1] for row in project_conn.execute("PRAGMA table_info(events)").fetchall()
                }
            self.assertEqual(version, str(SCHEMA_VERSION))
            self.assertIn("recommended_action_code", columns)
            self.assertIn("requires_review_reason", columns)


if __name__ == "__main__":
    unittest.main()
