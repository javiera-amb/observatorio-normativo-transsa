from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.ingest import build_events, read_event_payloads
from core.validation import EventValidationError


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida un archivo de eventos sin guardarlo.")
    parser.add_argument("archivo", type=Path)
    args = parser.parse_args()
    path = args.archivo.expanduser().resolve()

    try:
        events = build_events(read_event_payloads(path), strict=True)
    except (OSError, ValueError, EventValidationError) as exc:
        print(f"VALIDACIÓN FALLIDA: {exc}")
        return 1

    print("VALIDACIÓN CORRECTA")
    print(f"- Eventos válidos: {len(events)}")
    for event in events:
        print(f"- {event.event_id}: {event.title}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
