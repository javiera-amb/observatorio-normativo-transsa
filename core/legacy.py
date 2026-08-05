from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


_ASSIGNMENT_RE = re.compile(
    r"^\s*window\.REPORTES\s*=\s*(\[.*\])\s*;\s*$",
    flags=re.DOTALL,
)


class LegacyFormatError(ValueError):
    """El archivo JavaScript heredado no tiene el formato esperado."""


def read_legacy_reports(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    match = _ASSIGNMENT_RE.match(text)
    if not match:
        raise LegacyFormatError(
            f"No se encontró la asignación window.REPORTES en {path}."
        )

    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise LegacyFormatError(f"El arreglo de reportes no es JSON válido: {exc}") from exc

    if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
        raise LegacyFormatError("window.REPORTES debe contener una lista de objetos.")

    return payload


def write_legacy_reports(path: Path, reports: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "window.REPORTES = " + json.dumps(
        reports,
        ensure_ascii=False,
        indent=2,
    ) + ";\n"
    path.write_text(content, encoding="utf-8")
