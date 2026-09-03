from __future__ import annotations

"""Control de salud del seguimiento normativo nacional.

Falla si Portal IPT, el seguimiento por comuna o el barrido multifuente llevan
más días sin revisión que el máximo permitido. No intenta afirmar que una fuente
oficial sea exhaustiva: controla que el sistema efectivamente la haya vuelto a
consultar y que el universo nacional siga íntegro.
"""

import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PORTAL_SYNC = ROOT / "data" / "actos_ipt_sync.json"
SEGUIMIENTO = ROOT / "data" / "seguimiento_normativo.js"
IPT_REPORTS = ROOT / "data" / "ipt_reportes.js"


def read_assignment(path: Path, prefix: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise RuntimeError(f"Formato inválido: {path.name}")
    return json.loads(raw[len(prefix):-1])


def parse_date(value: object) -> date | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def parse_datetime(value: object) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        pass
    try:
        parsed = datetime.strptime(text[:16], "%Y-%m-%d %H:%M")
        return parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def require_recent_date(label: str, value: object, max_age_days: int, today: date) -> None:
    parsed = parse_date(value)
    if parsed is None:
        raise RuntimeError(f"{label} no tiene una fecha válida: {value!r}")
    age = (today - parsed).days
    if age < 0:
        raise RuntimeError(f"{label} está fechada en el futuro: {parsed}")
    if age > max_age_days:
        raise RuntimeError(
            f"{label} está atrasada: {parsed.isoformat()} ({age} días; máximo {max_age_days})."
        )


def require_recent_datetime(
    label: str, value: object, max_age_days: int, now: datetime
) -> None:
    parsed = parse_datetime(value)
    if parsed is None:
        raise RuntimeError(f"{label} no tiene fecha/hora válida: {value!r}")
    age = now - parsed
    if age < timedelta(0):
        raise RuntimeError(f"{label} está fechada en el futuro: {parsed.isoformat()}")
    if age > timedelta(days=max_age_days):
        raise RuntimeError(
            f"{label} está atrasada: {parsed.isoformat()} "
            f"({age.days} días; máximo {max_age_days})."
        )


def validate_portal(max_age_days: int, now: datetime) -> dict[str, Any]:
    payload = json.loads(PORTAL_SYNC.read_text(encoding="utf-8"))
    require_recent_datetime(
        "Sincronización Portal IPT",
        payload.get("fecha_sincronizacion_utc"),
        max_age_days,
        now,
    )
    total = int(payload.get("total") or 0)
    if total < 1:
        raise RuntimeError("Portal IPT no contiene actos sincronizados.")
    return payload


def validate_tracking(max_age_days: int, today: date, portal_total: int) -> dict[str, Any]:
    payload = read_assignment(SEGUIMIENTO, "window.SEGUIMIENTO_NORMATIVO = ")
    if not isinstance(payload, dict):
        raise RuntimeError("Seguimiento normativo no es un objeto.")
    summary = payload.get("resumen") or {}
    communes = payload.get("comunas")
    if not isinstance(communes, list) or len(communes) != 346:
        raise RuntimeError(
            f"El seguimiento nacional debe contener 346 comunas y contiene "
            f"{len(communes) if isinstance(communes, list) else 'un valor inválido'}."
        )
    keys = {
        (str(row.get("region") or "").strip(), str(row.get("comuna") or "").strip())
        for row in communes
        if isinstance(row, dict)
    }
    if len(keys) != 346:
        raise RuntimeError("El seguimiento nacional contiene comunas duplicadas o incompletas.")
    require_recent_date(
        "Última revisión normativa nacional",
        summary.get("ultima_revision_normativa"),
        max_age_days,
        today,
    )
    portal_read = int(summary.get("actos_portal_leidos") or 0)
    if portal_read != portal_total:
        raise RuntimeError(
            f"Seguimiento y Portal IPT no están sincronizados: seguimiento={portal_read}, "
            f"portal={portal_total}."
        )
    if int(summary.get("actos_totales_evaluados") or 0) < portal_read:
        raise RuntimeError("El total de actos evaluados es menor que los actos del Portal IPT.")
    return payload


def validate_multisource(max_age_days: int, today: date) -> list[dict[str, Any]]:
    reports = read_assignment(IPT_REPORTS, "window.IPT_REPORTES = ")
    if not isinstance(reports, list) or not reports:
        raise RuntimeError("El barrido multifuente aún no tiene ninguna revisión registrada.")

    reviewed = [
        parse_date(report.get("ultima_revision_semanal") or report.get("fecha_generacion"))
        for report in reports
        if isinstance(report, dict)
    ]
    reviewed = [value for value in reviewed if value is not None]
    if not reviewed:
        raise RuntimeError("Los reportes multifuente no contienen una fecha de revisión válida.")
    require_recent_date(
        "Última revisión multifuente",
        max(reviewed).isoformat(),
        max_age_days,
        today,
    )
    return reports


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-age-days", type=int, default=8)
    parser.add_argument(
        "--require-multifuente",
        action="store_true",
        help="Exige que el barrido complementario también haya corrido recientemente.",
    )
    args = parser.parse_args()
    if args.max_age_days < 1:
        raise SystemExit("--max-age-days debe ser al menos 1")

    now = datetime.now(timezone.utc)
    today = now.date()
    portal = validate_portal(args.max_age_days, now)
    tracking = validate_tracking(args.max_age_days, today, int(portal["total"]))
    reports: list[dict[str, Any]] = []
    if args.require_multifuente:
        reports = validate_multisource(args.max_age_days, today)

    summary = tracking.get("resumen") or {}
    print(
        "Frescura normativa OK · "
        f"Portal IPT: {portal['total']} actos · "
        f"346 comunas · actos evaluados: {summary.get('actos_totales_evaluados', 0)}"
        + (f" · reportes multifuente: {len(reports)}" if args.require_multifuente else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
