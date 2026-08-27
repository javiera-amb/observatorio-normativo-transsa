from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import argparse

from core.database import initialize_database
from core.paths import ProjectPaths


def main() -> int:
    parser = argparse.ArgumentParser(description="Inicializa la base SQLite de TUI.")
    parser.add_argument("--reset", action="store_true", help="Elimina la base actual antes de crearla.")
    args = parser.parse_args()

    paths = ProjectPaths.discover()
    paths.ensure_runtime_directories()

    if args.reset and paths.database.exists():
        paths.database.unlink()

    initialize_database(paths.database)
    print(f"Base inicializada: {paths.database}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
