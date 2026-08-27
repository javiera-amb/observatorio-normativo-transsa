from __future__ import annotations

import json
from pathlib import Path

from .models import CanonicalEvent


def event_path(base_dir: Path, event: CanonicalEvent) -> Path:
    parts = event.event_date.split("-") if event.event_date else []
    year = parts[0] if len(parts) >= 1 else "unknown"
    month = parts[1] if len(parts) >= 2 else "unknown"
    return base_dir / year / month / f"{event.event_id}.json"


def write_event_json(base_dir: Path, event: CanonicalEvent) -> Path:
    path = event_path(base_dir, event)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(event.to_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path
