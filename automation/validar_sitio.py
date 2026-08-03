#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

DAILY_REQUIRED = {
    "fecha", "titulo", "estado", "escala", "categoria", "region", "comuna",
    "organismo", "tipo_norma", "numero", "resumen", "implicancia", "impactados",
}

IPT_CHANGE_REQUIRED = {
    "region", "comuna", "territorio", "tipo_ipt", "acto", "numero",
    "fecha_publicacion", "estado", "resumen", "vigencia", "fuente",
}


def load_js_array(path: Path, prefix: str) -> list:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError(f"Formato inválido: {path.name}")
    value = json.loads(raw[len(prefix):-1])
    if not isinstance(value, list):
        raise ValueError(f"La base no es una lista: {path.name}")
    return value


def validate_file(path: Path, label: str) -> None:
    if not path.exists() or path.stat().st_size == 0:
        raise ValueError(f"{label} inexistente o vacío: {path}")


def main() -> int:
    try:
        for filename in ("index.html", "styles.css", "app.js"):
            validate_file(ROOT / filename, filename)

        daily = load_js_array(
            ROOT / "data" / "reportes.js",
            "window.REPORTES = ",
        )
        for position, record in enumerate(daily):
            missing = sorted(DAILY_REQUIRED - set(record))
            if missing:
                raise ValueError(
                    f"Registro diario {position} incompleto: {', '.join(missing)}"
                )
            for key in ("word_url",):
                if record.get(key):
                    validate_file(ROOT / record[key], key)

        ipt = load_js_array(
            ROOT / "data" / "ipt_reportes.js",
            "window.IPT_REPORTES = ",
        )
        for report_position, report in enumerate(ipt):
            for key in ("periodo", "titulo", "fecha_generacion", "cambios"):
                if key not in report:
                    raise ValueError(
                        f"Reporte IPT {report_position} sin campo {key}"
                    )

            if not isinstance(report["cambios"], list):
                raise ValueError(
                    f"cambios no es lista en reporte IPT {report_position}"
                )

            for change_position, change in enumerate(report["cambios"]):
                missing = sorted(IPT_CHANGE_REQUIRED - set(change))
                if missing:
                    raise ValueError(
                        f"Cambio IPT {report_position}:{change_position} "
                        f"incompleto: {', '.join(missing)}"
                    )

            for key in ("word_url", "csv_url", "excel_url"):
                if report.get(key):
                    validate_file(ROOT / report[key], key)

        print(
            f"Validación correcta. Diarios: {len(daily)} · IPT: {len(ipt)}"
        )
        return 0

    except Exception as exc:
        print(f"Error de validación: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
