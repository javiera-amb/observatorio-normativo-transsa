from __future__ import annotations

import json
from pathlib import Path

from .models import NewsSource

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "fuentes_noticias.json"


class SourceConfigError(ValueError):
    pass


def load_sources(path: str | Path = DEFAULT_CONFIG_PATH, *, enabled_only: bool = False) -> list[NewsSource]:
    config_path = Path(path)
    if not config_path.exists():
        raise SourceConfigError(f"No existe la configuración de fuentes: {config_path}")

    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SourceConfigError(f"JSON inválido en {config_path}: {exc}") from exc

    raw_sources = payload.get("sources")
    if not isinstance(raw_sources, list):
        raise SourceConfigError("La configuración debe contener una lista 'sources'.")

    sources: list[NewsSource] = []
    seen_ids: set[str] = set()
    issues: list[str] = []

    for index, raw in enumerate(raw_sources):
        if not isinstance(raw, dict):
            issues.append(f"sources[{index}] debe ser un objeto")
            continue

        source = NewsSource.from_dict(raw)
        if source.source_id in seen_ids:
            issues.append(f"id duplicado: {source.source_id}")
        seen_ids.add(source.source_id)

        for issue in source.validate():
            issues.append(f"{source.source_id or f'sources[{index}]'}: {issue}")

        if not enabled_only or source.enabled:
            sources.append(source)

    if issues:
        raise SourceConfigError("; ".join(issues))

    return sorted(sources, key=lambda item: (-item.priority, item.name.casefold()))


def source_summary(path: str | Path = DEFAULT_CONFIG_PATH) -> dict[str, int]:
    sources = load_sources(path)
    return {
        "total": len(sources),
        "enabled": sum(1 for item in sources if item.enabled),
        "rss_enabled": sum(1 for item in sources if item.enabled and item.access_mode in {"rss", "atom"}),
        "tier_a": sum(1 for item in sources if item.confidence_tier == "A"),
        "tier_b": sum(1 for item in sources if item.confidence_tier == "B"),
        "commercial": sum(1 for item in sources if item.commercial_interest),
    }
