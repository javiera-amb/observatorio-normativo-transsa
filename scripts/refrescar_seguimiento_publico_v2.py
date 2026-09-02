from __future__ import annotations

"""Extiende el seguimiento público con detalle de actos y versión normativa.

Ejecuta primero el refresco estable existente y luego agrega la información que
necesita el gate de tablas: inventario individual de actos posteriores, candidatos
multifuente recientes y una huella determinística de la versión normativa.
"""

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402
import refrescar_seguimiento_publico as current  # noqa: E402

OUTPUT = ROOT / "data" / "seguimiento_normativo.js"
REPORTS = ROOT / "data" / "ipt_reportes.js"
ACT_SYNC = ROOT / "data" / "actos_ipt_sync.json"


def _stable_id(parts: list[str]) -> str:
    raw = "|".join(str(value or "").strip().casefold() for value in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def _read_assignment(path: Path, prefix: str) -> Any:
    if not path.exists():
        return None
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        return None
    return json.loads(raw[len(prefix):-1])


def _write_tracking(payload: dict[str, Any]) -> None:
    OUTPUT.write_text(
        "window.SEGUIMIENTO_NORMATIVO = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )


def _public_act(act: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(act.get("id") or ""),
        "official_id": str(act.get("official_id") or ""),
        "fecha": str(act.get("fecha") or ""),
        "tipo_acto": str(act.get("tipo_acto") or ""),
        "tipo_ipt": str(act.get("tipo_ipt") or ""),
        "titulo": str(act.get("titulo") or ""),
        "estado": str(act.get("estado") or ""),
        "origen": str(act.get("origen_seguimiento") or "Portal IPT MINVU"),
        "fuente": str(act.get("source_url") or "https://portalipt.minvu.cl/instrumentos"),
        "verificado_fuente": bool(act.get("verificado", False))
        or str(act.get("origen_seguimiento") or "").startswith("Portal IPT")
        or str(act.get("origen_seguimiento") or "").startswith("Backfill oficial"),
        "codigos_origen": list(act.get("codigos_origen") or []),
    }


def _multisource_candidates() -> list[dict[str, Any]]:
    reports = _read_assignment(REPORTS, "window.IPT_REPORTES = ")
    if not isinstance(reports, list):
        return []
    candidates: list[dict[str, Any]] = []
    for report in reports:
        if not isinstance(report, dict):
            continue
        for item in report.get("cambios", []) or []:
            if not isinstance(item, dict):
                continue
            region = str(item.get("region") or "").strip()
            commune = str(item.get("comuna") or "").strip()
            tipo_ipt = str(item.get("tipo_ipt") or "").strip()
            fecha = str(item.get("fecha_publicacion") or "").strip()
            source = str(item.get("fuente") or "").strip()
            if not region or not commune or not tipo_ipt or not base.valid_date(fecha) or not source:
                continue
            title = " · ".join(value for value in [
                str(item.get("acto") or "").strip(),
                str(item.get("numero") or "").strip(),
                str(item.get("resumen") or "").strip(),
            ] if value)
            candidates.append({
                "id": "multifuente-" + _stable_id([region, commune, tipo_ipt, fecha, title, source]),
                "region": region,
                "comunas": [commune],
                "tipo_ipt": tipo_ipt,
                "fecha": fecha,
                "tipo_acto": str(item.get("acto") or "Actuación normativa"),
                "titulo": title or "Acto detectado por barrido multifuente",
                "estado": str(item.get("estado") or "Otro"),
                "source_url": source,
                "origen_seguimiento": "Barrido oficial multifuente",
                "codigos_origen": [],
            })
    return candidates


def _candidate_affects(candidate: dict[str, Any], principal: dict[str, Any]) -> bool:
    commune_set = {base.norm(value) for value in candidate.get("comunas", [])}
    if base.norm(principal.get("comuna")) not in commune_set:
        return False
    if base.norm(candidate.get("region")) != base.norm(principal.get("region")):
        return False
    principal_type = str(principal.get("tipo_ipt") or "").upper()
    candidate_type = str(candidate.get("tipo_ipt") or "").upper()
    if principal_type == "PRC" and candidate_type not in {"PRC", "SECCIONAL", "ENMIENDA"}:
        return False
    base_date = str(principal.get("fecha") or "")
    candidate_date = str(candidate.get("fecha") or "")
    return not (base.valid_date(base_date) and candidate_date <= base_date)


def _same_act(candidate: dict[str, Any], act: dict[str, Any]) -> bool:
    if str(candidate.get("fecha") or "") != str(act.get("fecha") or ""):
        return False
    if base.norm(candidate.get("region")) != base.norm(act.get("region")):
        return False
    left = {base.norm(value) for value in candidate.get("comunas", [])}
    right = {base.norm(value) for value in act.get("comunas", [])}
    return bool(left & right)


def _version(principal: dict[str, Any], acts: list[dict[str, Any]]) -> str:
    parts = [
        str(principal.get("tipo_ipt") or ""),
        str(principal.get("nombre") or ""),
        str(principal.get("fecha") or ""),
        *[str(act.get("official_id") or act.get("id") or "") for act in acts],
    ]
    return "norm-" + _stable_id(parts)


def _portal_cutoff() -> str:
    if not ACT_SYNC.exists():
        return ""
    try:
        payload = json.loads(ACT_SYNC.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return ""
    return str(payload.get("fecha_maxima_vigencia") or "")


def main() -> int:
    status = current.main()
    if status != 0:
        return status

    payload = _read_assignment(OUTPUT, "window.SEGUIMIENTO_NORMATIVO = ")
    if not isinstance(payload, dict):
        raise RuntimeError("No se pudo reabrir seguimiento_normativo.js.")

    instruments = base.load_vigentes(ROOT)
    acts, _portal_count, _verified_added = current.load_current_acts()
    candidates = _multisource_candidates()
    cutoff = _portal_cutoff()
    by_commune = {
        (base.norm(item.get("region")), base.norm(item.get("comuna"))): item
        for item in payload.get("comunas", [])
        if isinstance(item, dict)
    }

    detailed = 0
    pending_candidates = 0
    for (region_key, commune_key), row in by_commune.items():
        principal = current.latest_local_instrument(
            instruments, str(row.get("region") or ""), str(row.get("comuna") or "")
        )
        row["corte_base_portal_ipt"] = cutoff
        if principal is None:
            row["version_normativa_id"] = ""
            row["actos_posteriores_detalle"] = []
            row["candidatos_normativos_detalle"] = []
            row["estado_sincronizacion_normativa"] = "SIN_INSTRUMENTO_BASE_VERIFICADO"
            continue

        posterior = current.posterior_acts(principal, acts)
        act_detail = [_public_act(item) for item in posterior]
        candidate_detail = []
        for candidate in candidates:
            if not _candidate_affects(candidate, principal):
                continue
            if any(_same_act(candidate, act) for act in posterior):
                continue
            candidate_detail.append(_public_act(candidate))

        row["actos_posteriores_detalle"] = act_detail
        row["candidatos_normativos_detalle"] = candidate_detail
        row["actos_posteriores"] = len(act_detail)
        row["version_normativa_id"] = _version(principal, posterior)
        row["estado_sincronizacion_normativa"] = "REQUIERE_CERTIFICACION_TABLA_SIG"
        row["actos_pendientes_validacion_fuente"] = len(candidate_detail)
        detailed += len(act_detail)
        pending_candidates += len(candidate_detail)

        if candidate_detail:
            row.update({
                "estado_fuente": "Antecedente normativo nuevo pendiente de aplicación",
                "apto_para_visor": "REVISAR",
                "consumo_propieteq": "usar_con_revision",
                "estado_auditoria": "pendiente_revision",
                "motivo": (
                    "La revisión oficial multifuente detectó antecedentes posteriores aún no conciliados "
                    "con Portal IPT, tabla y SIG. Se bloquea la certificación hasta resolverlos."
                ),
            })

    summary = payload.setdefault("resumen", {})
    summary["corte_base_portal_ipt"] = cutoff
    summary["actos_posteriores_detallados"] = detailed
    summary["candidatos_normativos_pendientes"] = pending_candidates
    summary["regla_publicacion"] = (
        "ACTUALIZADA/NORMALIZADA exige coincidencia de version_normativa_id entre seguimiento, tabla y SIG."
    )
    _write_tracking(payload)
    print(
        f"Detalle normativo exportado: {detailed} actos posteriores · "
        f"{pending_candidates} candidatos pendientes."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
