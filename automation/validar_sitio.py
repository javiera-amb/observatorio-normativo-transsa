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

HISTORIC_REQUIRED = {
    "periodo", "modulo", "fecha", "region", "comuna", "escala",
    "categoria", "tipo_norma", "numero", "organismo", "titulo",
    "resumen", "implicancia", "estado", "fuente",
}

IPT_CHANGE_REQUIRED = {
    "region", "comuna", "territorio", "tipo_ipt", "acto", "numero",
    "fecha_publicacion", "estado", "resumen", "vigencia", "fuente",
}

SEGUIMIENTO_COMMUNE_REQUIRED = {
    "region", "comuna", "prc_nombre", "prc_fecha", "estado_fuente",
    "apto_para_visor", "consumo_propieteq", "estado_auditoria", "motivo",
    "actos_posteriores", "ultimo_acto_posterior", "archivo_recomendado",
    "capa_recomendada", "ultima_revision_normativa", "corte_base_portal_ipt",
    "actos_posteriores_detalle", "candidatos_normativos_detalle",
    "version_normativa_id", "estado_sincronizacion_normativa",
}

SEGUIMIENTO_ACT_REQUIRED = {
    "id", "fecha", "tipo_acto", "titulo", "estado", "origen", "fuente",
    "verificado_fuente",
}


def load_js_array(path: Path, prefix: str) -> list:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError(f"Formato inválido: {path.name}")
    value = json.loads(raw[len(prefix):-1])
    if not isinstance(value, list):
        raise ValueError(f"La base no es una lista: {path.name}")
    return value


def load_js_object(path: Path, prefix: str) -> dict:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError(f"Formato inválido: {path.name}")
    value = json.loads(raw[len(prefix):-1])
    if not isinstance(value, dict):
        raise ValueError(f"La base no es un objeto: {path.name}")
    return value


def validate_file(path: Path, label: str) -> None:
    if not path.exists() or path.stat().st_size == 0:
        raise ValueError(f"{label} inexistente o vacío: {path}")


def load_vigencia_source_rows() -> list:
    """Carga la única fuente canónica de IPT/vigencia: Seguimiento Normativo."""
    source_path = ROOT / "data" / "seguimiento_normativo.js"
    data = load_js_object(source_path, "window.SEGUIMIENTO_NORMATIVO = ")
    summary = data.get("resumen")
    communes = data.get("comunas")

    if not isinstance(summary, dict):
        raise ValueError("Seguimiento Normativo no contiene resumen.")
    if not isinstance(communes, list):
        raise ValueError("Seguimiento Normativo no contiene una lista de comunas.")
    if not communes:
        raise ValueError("Seguimiento Normativo está vacío.")

    expected_total = summary.get("total")
    if isinstance(expected_total, int) and expected_total != len(communes):
        raise ValueError(
            f"Seguimiento Normativo declara {expected_total} comunas y contiene {len(communes)}."
        )

    seen = set()
    detailed_acts = 0
    for position, commune in enumerate(communes):
        if not isinstance(commune, dict):
            raise ValueError(f"Comuna de seguimiento {position} inválida.")
        missing = sorted(SEGUIMIENTO_COMMUNE_REQUIRED - set(commune))
        if missing:
            raise ValueError(
                f"Comuna de seguimiento {position} incompleta: {', '.join(missing)}"
            )

        key = (str(commune.get("region", "")).strip(), str(commune.get("comuna", "")).strip())
        if key in seen:
            raise ValueError(f"Comuna duplicada en Seguimiento Normativo: {key[0]} / {key[1]}")
        seen.add(key)

        acts = commune.get("actos_posteriores_detalle")
        candidates = commune.get("candidatos_normativos_detalle")
        if not isinstance(acts, list) or not isinstance(candidates, list):
            raise ValueError(f"Actos/candidatos inválidos para {key[1]}.")

        for act_position, act in enumerate(acts):
            if not isinstance(act, dict):
                raise ValueError(f"Acto {position}:{act_position} inválido.")
            act_missing = sorted(SEGUIMIENTO_ACT_REQUIRED - set(act))
            if act_missing:
                raise ValueError(
                    f"Acto {position}:{act_position} incompleto: {', '.join(act_missing)}"
                )
            if act.get("verificado_fuente") and not str(act.get("fuente", "")).strip():
                raise ValueError(f"Acto verificado sin fuente en {key[1]}: {act.get('id', '')}")
        detailed_acts += len(acts)

    declared_acts = summary.get("actos_posteriores_detallados")
    if isinstance(declared_acts, int) and declared_acts != detailed_acts:
        raise ValueError(
            f"Seguimiento Normativo declara {declared_acts} actos detallados y contiene {detailed_acts}."
        )

    return communes


def main() -> int:
    try:
        for filename in (
            "index.html", "styles.css", "app.js", "ux-refresh.js",
            "vigencia-seguimiento-unificado.js",
        ):
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
            if record.get("word_url"):
                validate_file(ROOT / record["word_url"], "word_url")

        ipt = load_js_array(
            ROOT / "data" / "ipt_reportes.js",
            "window.IPT_REPORTES = ",
        )
        for report_position, report in enumerate(ipt):
            for key in ("periodo", "titulo", "fecha_generacion", "cambios"):
                if key not in report:
                    raise ValueError(f"Reporte IPT {report_position} sin campo {key}")

            if not isinstance(report["cambios"], list):
                raise ValueError(f"cambios no es lista en reporte IPT {report_position}")

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

        historic = load_js_array(
            ROOT / "data" / "historicos.js",
            "window.HISTORICOS = ",
        )
        for report_position, report in enumerate(historic):
            for key in ("year", "titulo", "fecha_generacion", "items"):
                if key not in report:
                    raise ValueError(f"Reporte histórico {report_position} sin campo {key}")

            if not isinstance(report["items"], list):
                raise ValueError(f"items no es lista en histórico {report_position}")

            for item_position, item in enumerate(report["items"]):
                missing = sorted(HISTORIC_REQUIRED - set(item))
                if missing:
                    raise ValueError(
                        f"Histórico {report_position}:{item_position} "
                        f"incompleto: {', '.join(missing)}"
                    )

            for key in ("word_url", "csv_url"):
                if report.get(key):
                    validate_file(ROOT / report[key], key)

        vigencia_rows = load_vigencia_source_rows()
        detailed_acts = sum(len(row.get("actos_posteriores_detalle", [])) for row in vigencia_rows)

        print(
            f"Validación correcta. Diarios: {len(daily)} · "
            f"IPT: {len(ipt)} · Históricos: {len(historic)} · "
            f"Comunas seguimiento: {len(vigencia_rows)} · "
            f"Actos normativos detallados: {detailed_acts}"
        )
        return 0

    except Exception as exc:
        print(f"Error de validación: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
