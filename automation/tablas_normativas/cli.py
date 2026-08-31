from __future__ import annotations

import argparse
import json
from pathlib import Path

from .engine_v3 import process_file


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita y normaliza una tabla normativa IPT.")
    parser.add_argument("input", help="CSV/XLSX de entrada")
    parser.add_argument("--normalized-dir", required=True, help="Carpeta de salida normalizada")
    parser.add_argument("--qa-dir", required=True, help="Carpeta de QA/trazabilidad")
    parser.add_argument("--rules", default="config/tablas_normativas_reglas.json", help="Catálogo de reglas exactas fuente-específicas")
    parser.add_argument("--conditional-rules", default="config/tablas_normativas_condicionales.json", help="Catálogo de reglas condicionadas por campos de la fila")
    parser.add_argument("--source-checks", default="config/tablas_normativas_fuente.json", help="Comparaciones estructuradas contra fuentes oficiales")
    args = parser.parse_args()

    result = process_file(
        Path(args.input),
        Path(args.normalized_dir),
        Path(args.qa_dir),
        Path(args.rules) if args.rules else None,
        Path(args.conditional_rules) if args.conditional_rules else None,
        Path(args.source_checks) if args.source_checks else None,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
