from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .database import initialize_database, upsert_events
from .events import write_event_json
from .models import CanonicalEvent
from .paths import ProjectPaths
from .validation import validate_event


def read_event_payloads(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if isinstance(payload, dict):
        if isinstance(payload.get("events"), list):
            payload = payload["events"]
        else:
            payload = [payload]
    if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
        raise ValueError("El archivo debe contener un objeto JSON, una lista de objetos o {'events': [...] }.")
    return payload


def build_events(payloads: list[dict[str, Any]], *, strict: bool = True) -> list[CanonicalEvent]:
    events: list[CanonicalEvent] = []
    for payload in payloads:
        event = CanonicalEvent.from_dict(payload)
        validate_event(event, strict=strict)
        events.append(event)
    return events


def import_event_file(path: Path, project: ProjectPaths | None = None) -> tuple[int, int, list[Path]]:
    project = project or ProjectPaths.discover(path)
    project.ensure_runtime_directories()
    initialize_database(project.database)
    events = build_events(read_event_payloads(path), strict=True)
    created, updated = upsert_events(project.database, events)
    written = [write_event_json(project.events_dir, event) for event in events]
    return created, updated, written
