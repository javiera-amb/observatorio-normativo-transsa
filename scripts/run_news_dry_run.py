from __future__ import annotations

import argparse
import json
from pathlib import Path

from automation.news.collector import collect_enabled_feeds


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Recolecta feeds habilitados y muestra candidatos sin modificar la base principal."
    )
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        help="ID de fuente a ejecutar. Puede repetirse.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Ruta opcional para guardar el resultado JSON del dry run.",
    )
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()

    result = collect_enabled_feeds(
        source_ids=set(args.source) or None,
        timeout=args.timeout,
    )

    payload = {
        "source_counts": result.source_counts,
        "collected_count": len(result.collected),
        "candidate_count": len(result.candidates),
        "discarded_count": len(result.discarded),
        "errors": result.errors,
        "candidates": [item.to_dict() for item in result.candidates],
    }

    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        print(f"Resultado guardado en: {args.output}")
    else:
        print(rendered)

    return 1 if result.errors and not result.collected else 0


if __name__ == "__main__":
    raise SystemExit(main())
