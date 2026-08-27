from __future__ import annotations

import argparse
import json
from pathlib import Path

from .engine import process_file


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita y normaliza una tabla normativa IPT.")
    parser.add_argument("input", help="CSV/XLSX de entrada")
    parser.add_argument("--normalized-dir", required=True, help="Carpeta de salida normalizada")
    parser.add_argument("--qa-dir", required=True, help="Carpeta de QA/trazabilidad")
    parser.add_argument("--rules", default="config/tablas_normativas_reglas.json", help="Catálogo de reglas fuente-específicas")
    args = parser.parse_args()

    result = process_file(
        Path(args.input),
        Path(args.normalized_dir),
        Path(args.qa_dir),
        Path(args.rules) if args.rules else None,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
