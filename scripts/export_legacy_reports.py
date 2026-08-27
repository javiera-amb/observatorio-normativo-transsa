from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import argparse

from core.database import initialize_database, load_legacy_payloads
from core.legacy import write_legacy_reports
from core.paths import ProjectPaths


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Regenera data/reportes.js desde SQLite manteniendo compatibilidad."
    )
    parser.add_argument(
        "--output",
        help="Ruta de salida opcional. Por defecto sobrescribe data/reportes.js.",
    )
    args = parser.parse_args()

    paths = ProjectPaths.discover()
    initialize_database(paths.database)
    reports = load_legacy_payloads(paths.database)
    output = paths.root / args.output if args.output else paths.legacy_reports_js
    write_legacy_reports(output, reports)
    print(f"Reportes exportados: {len(reports)}")
    print(f"Archivo: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
