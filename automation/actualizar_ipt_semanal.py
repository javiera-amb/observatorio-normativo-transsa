#!/usr/bin/env python3
"""Revisión incremental nacional de cambios IPT en fuentes oficiales.

La ejecución normal usa una ventana solapada de al menos 8 días. Si el barrido
multifuente está vacío o quedó atrasado, amplía automáticamente la ventana para
recuperar el período faltante (hasta 90 días) y distribuye los hallazgos en el
mes que corresponde. De este modo un fallo temporal no deja un hueco permanente.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

from actualizar_ipt_mensual import (
    REGIONS,
    ROOT,
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

ACT_SYNC = ROOT / "data" / "actos_ipt_sync.json"
MIN_OVERLAP_DAYS = 8
MAX_RECOVERY_DAYS = 90


def parse_iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat(str(value or "")[:10])
    except ValueError:
        return None


def period_from_date(value: date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def period_label(period: str) -> str:
    year, month = (int(part) for part in period.split("-", 1))
    return month_name(year, month)


def portal_cutoff() -> date | None:
    if not ACT_SYNC.exists():
        return None
    try:
        payload = json.loads(ACT_SYNC.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return parse_iso_date(str(payload.get("fecha_maxima_vigencia") or ""))


def latest_multisource_review(reports: list[dict]) -> date | None:
    dates: list[date] = []
    for report in reports:
        value = report.get("ultima_revision_semanal") or report.get("fecha_generacion") or ""
        parsed = parse_iso_date(str(value))
        if parsed is not None:
            dates.append(parsed)
    return max(dates) if dates else None


def review_start(reports: list[dict], today: date) -> date:
    floor = today - timedelta(days=MAX_RECOVERY_DAYS)
    overlap = today - timedelta(days=MIN_OVERLAP_DAYS)

    if not reports:
        cutoff = portal_cutoff()
        if cutoff is not None:
            return max(floor, min(today, cutoff + timedelta(days=1)))
        return max(floor, today - timedelta(days=60))

    latest = latest_multisource_review(reports)
    if latest is None:
        return max(floor, today - timedelta(days=60))

    # Siempre reabre al menos 8 días y, si hubo una interrupción mayor,
    # retrocede hasta la última revisión para recuperar el hueco.
    return max(floor, min(overlap, latest - timedelta(days=1)))


def months_between(start: date, end: date) -> list[str]:
    current = date(start.year, start.month, 1)
    last = date(end.year, end.month, 1)
    periods: list[str] = []
    while current <= last:
        periods.append(period_from_date(current))
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)
    return periods


def main() -> int:
    now = datetime.now(TIMEZONE)
    today = now.date()
    reports = load_reports()
    start = review_start(reports, today)
    end = today

    api = client()
    discovered: list[dict[str, object]] = []
    warnings: list[str] = []

    for region in REGIONS:
        print(f"Revisión IPT {region}: {start.isoformat()} → {end.isoformat()}")
        try:
            records = research_region(api, region, start, end)
            for record in records:
                published = parse_iso_date(str(record.get("fecha_publicacion", "")))
                if published is not None and not (start <= published <= end):
                    continue
                discovered.append(record)
        except Exception as exc:
            warning = f"{region}: {type(exc).__name__}: {exc}"
            warnings.append(warning)
            print(f"Advertencia: {warning}", file=sys.stderr)

    by_period: dict[str, list[dict[str, object]]] = {}
    current_period = period_from_date(today)
    for record in discovered:
        published = parse_iso_date(str(record.get("fecha_publicacion", "")))
        period = period_from_date(published) if published is not None else current_period
        by_period.setdefault(period, []).append(record)

    # Registramos todos los meses tocados por la ventana, aunque no tengan
    # novedades, para dejar una huella verificable de que sí fueron revisados.
    affected_periods = set(months_between(start, end)) | set(by_period)
    generated_at = now.strftime("%Y-%m-%d %H:%M")
    total_new = 0
    total_accumulated = 0

    for period in sorted(affected_periods):
        label = period_label(period)
        existing = next((report for report in reports if report.get("periodo") == period), None)
        previous_changes = list((existing or {}).get("cambios", []) or [])
        changes = deduplicate([*previous_changes, *by_period.get(period, [])])
        previous_unique = deduplicate(previous_changes)
        new_count = max(0, len(changes) - len(previous_unique))
        total_new += new_count
        total_accumulated += len(changes)

        word_path = create_word(period, label, changes, generated_at)
        csv_path = create_csv(period, changes)
        communes = len({r.get("comuna") for r in changes if r.get("comuna")})
        regions = len({r.get("region") for r in changes if r.get("region")})

        if changes:
            summary = (
                f"Acumulado de {len(changes)} cambios o actuaciones relevantes en "
                f"{communes} comunas y {regions} regiones durante {label}. "
                f"La última revisión incorporó {new_count} registros nuevos."
            )
        else:
            summary = (
                f"No se identificaron cambios IPT respaldados por las fuentes oficiales "
                f"consultadas durante {label}. La revisión quedó registrada."
            )

        report = {
            "periodo": period,
            "titulo": f"Actualizaciones IPT · {label.capitalize()}",
            "fecha_generacion": generated_at,
            "ultima_revision_semanal": generated_at,
            "ventana_ultima_revision": {
                "desde": start.isoformat(),
                "hasta": end.isoformat(),
                "dias_solapamiento": (end - start).days + 1,
            },
            "resumen_ejecutivo": summary,
            "cambios": changes,
            "word_url": word_path.relative_to(ROOT).as_posix(),
            "csv_url": csv_path.relative_to(ROOT).as_posix(),
            "excel_url": "",
            "alcance": "Revisión nacional incremental por 16 regiones",
            "advertencias_revision": warnings,
            "nota_cobertura": (
                "El barrido multifuente complementa Portal IPT y Diario Oficial. "
                "Los hallazgos nuevos se mantienen como candidatos hasta conciliarlos "
                "con una fuente oficial y con el instrumento/cartografía correspondiente."
            ),
        }

        if existing is None:
            reports.append(report)
        else:
            existing.clear()
            existing.update(report)

    save_reports(reports)
    print(f"Revisión registrada: {generated_at}")
    print(f"Ventana: {start.isoformat()} → {end.isoformat()}")
    print(f"Nuevos: {total_new} · acumulados en meses revisados: {total_accumulated}")
    if warnings:
        print(f"Regiones con advertencias: {len(warnings)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
