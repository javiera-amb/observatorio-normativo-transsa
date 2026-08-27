from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import argparse
import json
from datetime import datetime, timezone

from core.database import connect, initialize_database, upsert_events
from core.events import write_event_json
from core.legacy import read_legacy_reports
from core.models import CanonicalEvent
from core.paths import ProjectPaths


def _run_id() -> str:
    return datetime.now(timezone.utc).strftime("RUN-MIGRATION-%Y%m%dT%H%M%SZ")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migra data/reportes.js al modelo canónico y SQLite."
    )
    parser.add_argument("--reset", action="store_true", help="Recrea la base antes de migrar.")
    args = parser.parse_args()

    paths = ProjectPaths.discover()
    paths.ensure_runtime_directories()

    if args.reset and paths.database.exists():
        paths.database.unlink()

    initialize_database(paths.database)
    reports = read_legacy_reports(paths.legacy_reports_js)
    events = [CanonicalEvent.from_legacy_report(report) for report in reports]

    run_id = _run_id()
    started_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    with connect(paths.database) as conn:
        conn.execute(
            """
            INSERT INTO pipeline_runs(run_id, pipeline_name, started_at, status, details_json)
            VALUES(?, 'legacy_migration', ?, 'running', ?)
            """,
            (run_id, started_at, json.dumps({"input": str(paths.legacy_reports_js)}, ensure_ascii=False)),
        )

    try:
        created, updated = upsert_events(paths.database, events)
        event_files = [write_event_json(paths.events_dir, event) for event in events]
        finished_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        with connect(paths.database) as conn:
            conn.execute(
                """
                UPDATE pipeline_runs
                SET finished_at=?, status='success', events_created=?, events_updated=?, details_json=?
                WHERE run_id=?
                """,
                (
                    finished_at,
                    created,
                    updated,
                    json.dumps({"event_files": [str(p.relative_to(paths.root)) for p in event_files]}, ensure_ascii=False),
                    run_id,
                ),
            )
    except Exception as exc:
        finished_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        with connect(paths.database) as conn:
            conn.execute(
                """
                UPDATE pipeline_runs
                SET finished_at=?, status='failed', errors_count=1, details_json=?
                WHERE run_id=?
                """,
                (finished_at, json.dumps({"error": str(exc)}, ensure_ascii=False), run_id),
            )
        raise

    print(f"Reportes leídos: {len(reports)}")
    print(f"Eventos creados: {created}")
    print(f"Eventos actualizados: {updated}")
    print(f"JSON canónicos escritos: {len(event_files)}")
    print(f"Base: {paths.database}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
