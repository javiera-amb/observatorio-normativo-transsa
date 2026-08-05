from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import json
from pathlib import Path

from core.database import count_records, initialize_database, load_legacy_payloads
from core.legacy import read_legacy_reports
from core.paths import ProjectPaths


def main() -> int:
    paths = ProjectPaths.discover()
    initialize_database(paths.database)

    legacy = read_legacy_reports(paths.legacy_reports_js)
    exported = load_legacy_payloads(paths.database)

    errors: list[str] = []
    if legacy != exported:
        errors.append("La exportación desde SQLite no coincide con data/reportes.js.")

    event_count = count_records(paths.database, "events")
    if event_count != len(legacy):
        errors.append(f"La base contiene {event_count} eventos y se esperaban {len(legacy)}.")

    event_json_files = list(paths.events_dir.rglob("EVT-*.json"))
    if len(event_json_files) != len(legacy):
        errors.append(
            f"Se encontraron {len(event_json_files)} JSON canónicos y se esperaban {len(legacy)}."
        )

    for file_path in event_json_files:
        try:
            payload = json.loads(file_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"JSON inválido en {file_path}: {exc}")
            continue
        for required in ("event_id", "event_type", "title", "event_date", "summary", "territory", "source"):
            if required not in payload:
                errors.append(f"Falta {required} en {file_path}.")

    if errors:
        print("VALIDACIÓN FALLIDA")
        for error in errors:
            print(f"- {error}")
        return 1

    print("VALIDACIÓN CORRECTA")
    print(f"- Reportes heredados: {len(legacy)}")
    print(f"- Eventos SQLite: {event_count}")
    print(f"- JSON canónicos: {len(event_json_files)}")
    print("- Compatibilidad de data/reportes.js: exacta")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
