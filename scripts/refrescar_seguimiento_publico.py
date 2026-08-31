from __future__ import annotations

"""Refresca el seguimiento nacional sin depender de la cartografía local.

Conserva el diagnóstico cartográfico existente del consolidado SIG y actualiza
la parte normativa con los instrumentos/actos públicos ya sincronizados en Git:
- instrumento comunal vigente registrado;
- cantidad de actos vigentes posteriores;
- fecha del último acto posterior;
- fecha de la última revisión normativa.

Si aparece un PRC/LU nuevo o un acto posterior nuevo, el estado sólo puede
volverse más conservador (REVISAR); nunca se aprueba cartografía desde este paso.
"""

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402
import exportar_seguimiento_normativo as legacy  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "consolidados" / "vigencia" / "consolidado_sig_comunal.csv"
OUTPUT = ROOT / "data" / "seguimiento_normativo.js"


def load_current_acts() -> list[dict[str, Any]]:
    files = [ROOT / "data" / f"actos_ipt_nacional_{i:02d}.js" for i in range(1, 11)]
    rows = base.decode_act_files(files)
    acts: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 17:
            continue
        acts.append({
            "id": row[0],
            "region": row[1] or "",
            "comunas": row[2] if isinstance(row[2], list) else [],
            "nivel": row[3] or "",
            "tipo_ipt": row[4] or "",
            "titulo": row[5] or "",
            "estado": row[6] or "",
            "fecha": row[7] or "",
            "fecha_derogacion": row[8] or "",
            "codigos_origen": row[10] if isinstance(row[10], list) else [],
            "tipo_acto": row[11] or "Modificación",
        })
    if not acts:
        raise RuntimeError("No se pudieron leer actos del Portal IPT sincronizado.")
    return acts


def is_effective(act: dict[str, Any]) -> bool:
    state = base.norm(act.get("estado"))
    if "derog" in state:
        return False
    if act.get("fecha_derogacion") and base.valid_date(act.get("fecha_derogacion")):
        return False
    return state == "vigente" or "vigente" in state


def latest_local_instrument(
    instruments: list[dict[str, Any]], region: str, commune: str
) -> dict[str, Any] | None:
    matches = [
        item for item in instruments
        if base.norm(item.get("region")) == base.norm(region)
        and base.norm(item.get("comuna")) == base.norm(commune)
    ]
    prc = [item for item in matches if str(item.get("tipo_ipt") or "").upper() == "PRC"]
    lu = [item for item in matches if str(item.get("tipo_ipt") or "").upper() == "LU"]
    candidates = prc or lu
    if not candidates:
        return None
    return max(candidates, key=lambda item: str(item.get("fecha") or ""))


def posterior_acts(
    principal: dict[str, Any], acts: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    base_date = str(principal.get("fecha") or "")
    output: list[dict[str, Any]] = []
    for act in acts:
        if not is_effective(act):
            continue
        affects, _relation = base.act_affects_instrument(act, principal)
        if not affects:
            continue
        act_date = str(act.get("fecha") or "")
        if base.valid_date(base_date) and base.valid_date(act_date) and act_date <= base_date:
            continue
        # Sin fecha no afirmamos que sea posterior: queda para otros controles documentales.
        if not base.valid_date(act_date):
            continue
        output.append(act)
    output.sort(key=lambda item: (str(item.get("fecha") or ""), str(item.get("titulo") or "")))
    return output


def main() -> int:
    import csv

    with SOURCE.open(encoding="utf-8-sig", newline="") as source_file:
        rows = [legacy.normalize_row(row) for row in csv.DictReader(source_file, delimiter=";")]

    existing = {(str(row["region"]), str(row["comuna"])) for row in rows}
    for region, commune in legacy.MISSING_COMMUNES:
        if (region, commune) not in existing:
            rows.append(legacy.missing_row(region, commune))

    # Conserva excepciones QA conocidas; la revisión pública sólo puede escalar alertas.
    legacy.apply_known_overrides(rows)

    instruments = base.load_vigentes(ROOT)
    acts = load_current_acts()
    reviewed = date.today().isoformat()
    escalated = 0

    for row in rows:
        row["ultima_revision_normativa"] = reviewed
        principal = latest_local_instrument(instruments, str(row["region"]), str(row["comuna"]))
        if principal is None:
            continue

        previous_name = str(row.get("prc_nombre") or "")
        previous_date = str(row.get("prc_fecha") or "")
        current_name = str(principal.get("nombre") or "").strip()
        current_date = str(principal.get("fecha") or "").strip()

        changed_base = bool(
            current_date
            and previous_date
            and current_date != previous_date
            and base.valid_date(current_date)
            and base.valid_date(previous_date)
            and current_date > previous_date
        )

        if current_name:
            row["prc_nombre"] = current_name
        if current_date:
            row["prc_fecha"] = current_date

        posterior = posterior_acts(principal, acts)
        previous_count = int(row.get("actos_posteriores") or 0)
        row["actos_posteriores"] = len(posterior)
        row["ultimo_acto_posterior"] = max(
            (str(item.get("fecha") or "") for item in posterior), default=""
        )

        if changed_base:
            row.update({
                "estado_fuente": "Nuevo instrumento vigente detectado · revisar cartografía",
                "apto_para_visor": "REVISAR",
                "consumo_propieteq": "usar_con_revision",
                "estado_auditoria": "pendiente_revision",
                "motivo": (
                    f"El seguimiento público detectó un instrumento comunal más reciente "
                    f"({current_date}) que el registrado previamente ({previous_date}). "
                    "Debe comprobarse su incorporación en la cartografía y tabla normativa."
                ),
            })
            escalated += 1
        elif len(posterior) > 0 and len(posterior) > previous_count:
            row.update({
                "estado_fuente": "Requiere revisar cambios posteriores",
                "apto_para_visor": "REVISAR",
                "consumo_propieteq": "usar_con_revision",
                "estado_auditoria": "pendiente_revision",
                "motivo": (
                    "Se detectaron actos normativos vigentes posteriores al instrumento base. "
                    "Su incorporación en geometría, atributos y tabla normativa debe comprobarse."
                ),
            })
            escalated += 1

    order = {region: index for index, region in enumerate(legacy.REGION_ORDER)}
    rows.sort(key=lambda row: (order.get(str(row["region"]), 99), str(row["comuna"]).casefold()))
    if len(rows) != 346:
        raise RuntimeError(f"El seguimiento debe contener 346 comunas y contiene {len(rows)}")

    summary = {
        "total": len(rows),
        "disponibles": sum(row["consumo_propieteq"] == "disponible" for row in rows),
        "con_revision": sum(row["consumo_propieteq"] == "usar_con_revision" for row in rows),
        "no_disponibles": sum(row["consumo_propieteq"] == "no_disponible" for row in rows),
        "ultima_actualizacion": reviewed,
        "ultima_revision_normativa": reviewed,
        "frecuencia_objetivo_dias": 7,
        "fuentes_actualizacion": ["Portal IPT MINVU", "consolidado SIG TUI"],
        "actos_portal_leidos": len(acts),
        "alertas_escaladas": escalated,
        "alcance": "Todas las comunas de Chile",
    }
    payload = {"resumen": summary, "comunas": rows}
    OUTPUT.write_text(
        "window.SEGUIMIENTO_NORMATIVO = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Seguimiento público actualizado: {len(rows)} comunas")
    print(f"Actos Portal IPT: {len(acts)} · alertas escaladas: {escalated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
