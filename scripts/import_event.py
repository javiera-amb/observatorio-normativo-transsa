from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.ingest import import_event_file
from core.paths import ProjectPaths


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Importa uno o más eventos universales a Transsa Urban Intelligence."
    )
    parser.add_argument("archivo", type=Path, help="Archivo JSON con uno o más eventos.")
    args = parser.parse_args()

    path = args.archivo.expanduser().resolve()
    if not path.exists():
        print(f"ERROR: no existe el archivo: {path}")
        return 1

    try:
        project = ProjectPaths.discover(ROOT)
        created, updated, written = import_event_file(path, project)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    print("IMPORTACIÓN CORRECTA")
    print(f"- Eventos creados: {created}")
    print(f"- Eventos actualizados: {updated}")
    for item in written:
        print(f"- JSON canónico: {item.relative_to(project.root)}")
    print("Ejecuta scripts/export_web_events.py para actualizar data/eventos.js.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
