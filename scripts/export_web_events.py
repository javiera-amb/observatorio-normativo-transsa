from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.database import fetch_web_events, initialize_database
from core.paths import ProjectPaths


def export_web_events(paths: ProjectPaths) -> int:
    initialize_database(paths.database)
    events = fetch_web_events(paths.database)
    payload = "window.TUI_EVENTS = " + json.dumps(events, ensure_ascii=False, indent=2) + ";\n"
    paths.web_events_js.write_text(payload, encoding="utf-8")
    return len(events)


def main() -> int:
    paths = ProjectPaths.discover(ROOT)
    paths.ensure_runtime_directories()
    count = export_web_events(paths)
    print("EXPORTACIÓN WEB CORRECTA")
    print(f"- Eventos exportados: {count}")
    print(f"- Archivo: {paths.web_events_js}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
