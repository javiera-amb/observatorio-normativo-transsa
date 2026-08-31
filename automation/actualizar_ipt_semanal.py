#!/usr/bin/env python3
"""Revisión incremental semanal de cambios IPT en fuentes oficiales.

Complementa las sincronizaciones diarias de Diario Oficial y Portal IPT.
Cada ejecución revisa una ventana solapada de hasta 8 días dentro del mes
corriente, fusiona los hallazgos sin duplicar y vuelve a generar el reporte
mensual acumulado. Aunque no encuentre cambios, registra la fecha de revisión.
"""

from __future__ import annotations

import sys
from datetime import timedelta

from actualizar_ipt_mensual import (
    REGIONS,
    TIMEZONE,
    client,
    create_csv,
    create_word,
    deduplicate,
    load_reports,
    month_name,
    research_region,
    save_reports,
)
from datetime import datetime, date


def parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(str(value or "")[:10])
    except ValueError:
        return None


def current_month_start(reference: date) -> date:
    return date(reference.year, reference.month, 1)


def main() -> int:
    now = datetime.now(TIMEZONE)
    today = now.date()
    month_start = current_month_start(today)
    start = max(month_start, today - timedelta(days=8))
    end = today
    period = f"{today.year:04d}-{today.month:02d}"
    label = month_name(today.year, today.month)

    reports = load_reports()
    existing = next((report for report in reports if report.get("periodo") == period), None)
    previous_changes = list((existing or {}).get("cambios", []) or [])

    api = client()
    discovered: list[dict[str, object]] = []
    warnings: list[str] = []

    for region in REGIONS:
        print(f"Revisión semanal {region}: {start.isoformat()} → {end.isoformat()}")
        try:
            records = research_region(api, region, start, end)
            # El reporte del mes corriente no incorpora actos fechados en meses anteriores.
            for record in records:
                published = parse_iso_date(str(record.get("fecha_publicacion", "")))
                if published is not None and published < month_start:
                    continue
                discovered.append(record)
        except Exception as exc:
            warning = f"{region}: {type(exc).__name__}: {exc}"
            warnings.append(warning)
            print(f"Advertencia: {warning}", file=sys.stderr)

    changes = deduplicate([*previous_changes, *discovered])
    generated_at = now.strftime("%Y-%m-%d %H:%M")
    word_path = create_word(period, label, changes, generated_at)
    csv_path = create_csv(period, changes)

    communes = len({r.get("comuna") for r in changes if r.get("comuna")})
    regions = len({r.get("region") for r in changes if r.get("region")})
    new_count = max(0, len(changes) - len(deduplicate(previous_changes)))

    if changes:
        summary = (
            f"Acumulado de {len(changes)} cambios o actuaciones relevantes en "
            f"{communes} comunas y {regions} regiones durante {label}. "
            f"La última revisión semanal incorporó {new_count} registros nuevos."
        )
    else:
        summary = (
            f"No se identificaron cambios IPT respaldados por las fuentes oficiales "
            f"consultadas durante {label}. La revisión semanal quedó registrada."
        )

    report = {
        "periodo": period,
        "titulo": f"Actualizaciones IPT · {label.capitalize()}",
        "fecha_generacion": generated_at,
        "ultima_revision_semanal": generated_at,
        "ventana_ultima_revision": {
            "desde": start.isoformat(),
            "hasta": end.isoformat(),
            "dias_solapamiento": 8,
        },
        "resumen_ejecutivo": summary,
        "cambios": changes,
        "word_url": word_path.relative_to(word_path.parents[2]).as_posix(),
        "csv_url": csv_path.relative_to(csv_path.parents[2]).as_posix(),
        "excel_url": "",
        "alcance": "Revisión nacional semanal por 16 regiones",
        "advertencias_revision": warnings,
        "nota_cobertura": (
            "La revisión semanal complementa Diario Oficial y Portal IPT. La ausencia "
            "de un resultado en buscadores públicos no acredita ausencia de normativa; "
            "los documentos deben contrastarse con la fuente oficial antes de corregir datos."
        ),
    }

    if existing is None:
        reports.append(report)
    else:
        existing.clear()
        existing.update(report)

    save_reports(reports)
    print(f"Revisión semanal registrada: {generated_at}")
    print(f"Ventana: {start.isoformat()} → {end.isoformat()}")
    print(f"Nuevos: {new_count} · acumulados del mes: {len(changes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
