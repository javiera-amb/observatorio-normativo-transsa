from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from automation.news.sources import load_sources, source_summary


def main() -> int:
    sources = load_sources()
    summary = source_summary()

    print("TRANSSA URBAN INTELLIGENCE - FUENTES DE NOTICIAS")
    print(f"Total: {summary['total']}")
    print(f"Habilitadas: {summary['enabled']}")
    print(f"RSS/Atom habilitadas: {summary['rss_enabled']}")
    print(f"Nivel A: {summary['tier_a']}")
    print(f"Nivel B: {summary['tier_b']}")
    print(f"Con interés comercial declarado: {summary['commercial']}")
    print("")

    for source in sources:
        state = "ACTIVA" if source.enabled else "PENDIENTE"
        print(
            f"[{state}] {source.name} | confianza {source.confidence_tier} | "
            f"método {source.access_mode} | prioridad {source.priority}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
