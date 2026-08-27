#!/usr/bin/env python3
from __future__ import annotations

import base64
import gzip
import json
import re
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

VIGENCIA_INSTRUMENT_REQUIRED = {
    "id", "region", "comuna", "tipo_ipt", "nombre",
    "estado_alerta", "confianza", "resumen_alerta",
    "linea_tiempo", "alertas", "mapa",
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
    loader_path = ROOT / "data" / "vigencia_cartografica.js"
    raw = loader_path.read_text(encoding="utf-8").strip()

    direct_prefix = "window.VIGENCIA_CARTOGRAFICA = "
    if raw.startswith(direct_prefix):
        direct = load_js_object(loader_path, direct_prefix)
        instruments = direct.get("instrumentos")
        if not isinstance(instruments, list):
            raise ValueError("La base de vigencia no contiene una lista de instrumentos.")
        for position, instrument in enumerate(instruments):
            missing = sorted(VIGENCIA_INSTRUMENT_REQUIRED - set(instrument))
            if missing:
                raise ValueError(
                    f"Instrumento cartográfico {position} incompleto: {', '.join(missing)}"
                )
        return instruments

    if not raw.startswith("window.VIGENCIA_IPT_ROWS=[];"):
        raise ValueError("Formato inválido: vigencia_cartografica.js")

    references = [
        reference.split("?", 1)[0].split("#", 1)[0]
        for reference in re.findall(r'src="([^"]+)"', raw)
    ]
    required_references = {
        "data/vigencia_finalizar.js",
        "data/comparaciones_ipt.js",
        "data/actos_ipt.js",
    }
    missing_references = sorted(required_references - set(references))
    if missing_references:
        raise ValueError(
            "El cargador de vigencia no referencia: " + ", ".join(missing_references)
        )

    rows: list = []
    row_files = [reference for reference in references if "ipt_vigentes_" in reference]
    if not row_files:
        raise ValueError("El cargador de vigencia no contiene bloques de instrumentos.")

    prefix = "window.VIGENCIA_IPT_ROWS=(window.VIGENCIA_IPT_ROWS||[]).concat("
    for reference in row_files:
        path = ROOT / reference
        validate_file(path, reference)
        content = path.read_text(encoding="utf-8").strip()
        if not content.startswith(prefix) or not content.endswith(");"):
            raise ValueError(f"Formato inválido: {path.name}")
        block = json.loads(content[len(prefix):-2])
        if not isinstance(block, list):
            raise ValueError(f"Bloque IPT no es lista: {path.name}")
        rows.extend(block)

    for position, row in enumerate(rows):
        if not isinstance(row, list) or len(row) < 8:
            raise ValueError(f"Fila IPT fuente {position} inválida.")

    for reference in references:
        validate_file(ROOT / reference, reference)

    return rows


def load_national_ipt_acts() -> list:
    encoded_parts: list[str] = []
    for index in range(1, 11):
        path = ROOT / "data" / f"actos_ipt_nacional_{index:02d}.js"
        validate_file(path, path.name)
        raw = path.read_text(encoding="utf-8").strip()
        match = re.fullmatch(
            r'window\.ACTOS_IPT_GZ=\(window\.ACTOS_IPT_GZ\|\|""\)\+(".*");',
            raw,
        )
        if not match:
            raise ValueError(f"Formato inválido: {path.name}")
        encoded_parts.append(json.loads(match.group(1)))

    try:
        compressed = base64.b64decode("".join(encoded_parts), validate=True)
        acts = json.loads(gzip.decompress(compressed).decode("utf-8"))
    except Exception as error:
        raise ValueError(f"No se pudo abrir la base nacional IPT: {error}") from error

    if not isinstance(acts, list) or not acts:
        raise ValueError("La base nacional IPT está vacía o no es una lista.")
    if len(acts) != 1784:
        raise ValueError(f"Se esperaban 1.784 actos IPT y se obtuvieron {len(acts)}.")
    for position, row in enumerate(acts):
        if not isinstance(row, list) or len(row) < 17:
            raise ValueError(f"Acto IPT nacional {position} inválido.")

    for filename in (
        "actos_ipt_nacionales_finalizar.js",
        "../vigencia-pilotos.js",
        "../vigencia-nacional-ui.js",
    ):
        path = ROOT / "data" / filename if not filename.startswith("../") else ROOT / filename[3:]
        validate_file(path, filename)

    return acts


def main() -> int:
    try:
        for filename in ("index.html", "styles.css", "app.js", "ux-refresh.js"):
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
        national_acts = load_national_ipt_acts()

        print(
            f"Validación correcta. Diarios: {len(daily)} · "
            f"IPT: {len(ipt)} · Históricos: {len(historic)} · "
            f"Instrumentos fuente: {len(vigencia_rows)} · "
            f"Actos IPT nacionales: {len(national_acts)}"
        )
        return 0

    except Exception as exc:
        print(f"Error de validación: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
