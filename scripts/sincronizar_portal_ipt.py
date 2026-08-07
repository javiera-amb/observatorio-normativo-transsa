from __future__ import annotations

import argparse
import base64
import csv
import gzip
import hashlib
import json
import math
import re
import tempfile
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

PORTAL_URL = "https://portalipt.minvu.cl/instrumentos"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
GZIP_PARTS = 5

REQUIRED_COLUMNS = {
    "Región",
    "Comunas",
    "Nivel de planificación",
    "Tipo de planificación",
    "Clasificación",
    "Denominación",
    "Estado",
    "Fecha de inicio de vigencia",
    "Códigos de instrumentos de origen que afecta",
}


def deaccent(value: object) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(character) != "Mn"
    )


def normalize_region(value: object) -> str:
    text = str(value or "").strip().title()
    replacements = {
        "Metropolitana De Santiago": "Metropolitana de Santiago",
        "Libertador General Bernardo O'Higgins": "Libertador General Bernardo O'Higgins",
        "Aysén Del General Carlos Ibáñez Del Campo": "Aysén del General Carlos Ibáñez del Campo",
        "Magallanes Y De La Antártica Chilena": "Magallanes y de la Antártica Chilena",
        "Magallanes Y Antártica Chilena": "Magallanes y de la Antártica Chilena",
        "Arica Y Parinacota": "Arica y Parinacota",
        "La Araucanía": "La Araucanía",
        "Los Ríos": "Los Ríos",
        "Los Lagos": "Los Lagos",
        "Valparaíso": "Valparaíso",
        "Biobío": "Biobío",
        "Ñuble": "Ñuble",
    }
    return replacements.get(text, text)


def normalize_commune(value: object) -> str:
    text = str(value or "").strip().title()
    for particle in (" De ", " Del ", " La ", " Las ", " Los ", " Y "):
        text = text.replace(particle, particle.lower())
    return text


def split_communes(value: object) -> list[str]:
    return [
        normalize_commune(part)
        for part in re.split(r"\s*,\s*", str(value or "").strip())
        if part.strip()
    ]


def parse_codes(value: object) -> list[int]:
    return sorted({int(number) for number in re.findall(r"\d+", str(value or ""))})


def infer_type(title: object) -> str:
    text = deaccent(title).lower()
    if "enmienda" in text:
        return "Enmienda"
    if "rectific" in text:
        return "Rectificación"
    if "interpret" in text:
        return "Interpretación"
    if "plano de detalle" in text:
        return "Plano de detalle"
    if "seccional" in text and "modific" in text:
        return "Modificación mediante seccional"
    return "Modificación"


def download_report(destination: Path) -> Path:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Falta Playwright. Ejecuta: pip install playwright") from error

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(accept_downloads=True)
        page.goto(PORTAL_URL, wait_until="networkidle", timeout=120_000)
        page.wait_for_timeout(2_000)

        candidates = [
            page.get_by_role("button", name=re.compile(r"descargar listado seleccionado", re.I)),
            page.get_by_role("link", name=re.compile(r"descargar listado seleccionado", re.I)),
            page.get_by_text(re.compile(r"descargar listado seleccionado", re.I)),
        ]
        target = next((candidate for candidate in candidates if candidate.count()), None)
        if target is None:
            browser.close()
            raise RuntimeError("No se encontró el botón de descarga del Portal IPT.")

        with page.expect_download(timeout=120_000) as download_info:
            target.first.click()
        download_info.value.save_as(destination)
        browser.close()

    return destination


def detect_delimiter(path: Path) -> str:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        header = file.readline()
    if header.count(";") >= 5:
        return ";"
    if header.count("\t") >= 5:
        return "\t"
    return ","


def read_csv(path: Path) -> list[dict[str, str]]:
    delimiter = detect_delimiter(path)
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file, delimiter=delimiter)
        headers = set(reader.fieldnames or [])
        missing = sorted(REQUIRED_COLUMNS - headers)
        if missing:
            raise RuntimeError(
                "El CSV del Portal IPT no contiene las columnas esperadas: " + ", ".join(missing)
            )
        return list(reader)


def act_signature(row: dict[str, str]) -> str:
    keys = [
        "Región",
        "Comunas",
        "Nivel de planificación",
        "Tipo de planificación",
        "Clasificación",
        "Denominación",
        "Estado",
        "Fecha de inicio de vigencia",
        "Fecha de derogación",
        "Fecha de último hito cumplido",
        "Códigos de instrumentos de origen que afecta",
    ]
    return "|".join(str(row.get(key) or "").strip() for key in keys)


def build_rows(records: list[dict[str, str]]) -> list[list[object]]:
    modifications = [
        row
        for row in records
        if str(row.get("Clasificación") or "").strip().lower() == "modificación"
    ]

    prepared: list[tuple[str, list[object]]] = []
    for row in modifications:
        title = str(row.get("Denominación") or "").strip()
        values: list[object] = [
            normalize_region(row.get("Región")),
            split_communes(row.get("Comunas")),
            str(row.get("Nivel de planificación") or "").strip(),
            str(row.get("Tipo de planificación") or "").strip(),
            title,
            str(row.get("Estado") or "").strip(),
            str(row.get("Fecha de inicio de vigencia") or "").strip(),
            str(row.get("Fecha de derogación") or "").strip(),
            str(row.get("Fecha de último hito cumplido") or "").strip(),
            parse_codes(row.get("Códigos de instrumentos de origen que afecta")),
            infer_type(title),
            str(row.get("Modificación de Límite Urbano") or "").strip(),
            str(row.get("Evaluación Ambiental Estratégica (EAE)") or "").strip(),
            str(row.get("Fecha de inicio de EAE") or "").strip(),
            str(row.get("Fecha de término de EAE") or "").strip(),
            str(row.get("Consulta Indígena") or "").strip(),
        ]
        prepared.append((act_signature(row), values))

    prepared.sort(
        key=lambda item: (
            str(item[1][0]),
            ",".join(item[1][1]),
            str(item[1][6] or "9999-99-99"),
            str(item[1][4]),
            item[0],
        )
    )

    occurrences: Counter[str] = Counter()
    rows: list[list[object]] = []
    for signature, values in prepared:
        occurrences[signature] += 1
        occurrence = occurrences[signature]
        stable_source = signature if occurrence == 1 else f"{signature}|{occurrence}"
        stable_id = hashlib.sha1(stable_source.encode("utf-8")).hexdigest()[:16]
        rows.append([f"acto-ipt-{stable_id}", *values])

    return rows


def write_gzip_parts(rows: list[list[object]]) -> None:
    for stale in DATA_DIR.glob("actos_ipt_gz_*.js"):
        stale.unlink()

    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    encoded = base64.b64encode(gzip.compress(payload, compresslevel=9)).decode("ascii")
    part_size = max(1, math.ceil(len(encoded) / GZIP_PARTS))
    parts = [encoded[index:index + part_size] for index in range(0, len(encoded), part_size)]
    while len(parts) < GZIP_PARTS:
        parts.append("")
    parts = parts[:GZIP_PARTS]

    for index, part in enumerate(parts, start=1):
        content = f'window.ACTOS_IPT_GZ=(window.ACTOS_IPT_GZ||"")+{json.dumps(part)};\n'
        (DATA_DIR / f"actos_ipt_gz_{index:02d}.js").write_text(content, encoding="utf-8")


def write_outputs(rows: list[list[object]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    write_gzip_parts(rows)

    (DATA_DIR / "actos_ipt.js").write_text(
        "// Compatibilidad: la interfaz nacional carga actos_ipt_gz_01.js a actos_ipt_gz_05.js.\n",
        encoding="utf-8",
    )

    states = Counter(str(row[6]) for row in rows)
    types = Counter(str(row[11]) for row in rows)
    dates = sorted(
        str(row[7])
        for row in rows
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(row[7]))
    )
    metadata = {
        "fecha_sincronizacion_utc": datetime.now(timezone.utc).isoformat(),
        "fuente": PORTAL_URL,
        "total": len(rows),
        "vigentes": states.get("Vigente", 0),
        "derogados": states.get("Derogado", 0),
        "en_desarrollo": states.get("En Desarrollo", 0),
        "enmiendas_inferidas": types.get("Enmienda", 0),
        "rectificaciones_inferidas": types.get("Rectificación", 0),
        "modificaciones_seccionales_inferidas": types.get("Modificación mediante seccional", 0),
        "vinculados_por_codigo_origen": sum(bool(row[10]) for row in rows),
        "pendientes_vinculacion": sum(not row[10] for row in rows),
        "fecha_maxima_vigencia": dates[-1] if dates else "",
        "archivos_comprimidos": GZIP_PARTS,
        "formato_frontend": "gzip_base64",
    }
    (DATA_DIR / "actos_ipt_sync.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sincroniza las modificaciones del Portal IPT y genera la base nacional comprimida."
    )
    parser.add_argument("--input-csv", type=Path, help="CSV ya descargado. Omite la navegación web.")
    args = parser.parse_args()

    if args.input_csv:
        source = args.input_csv.expanduser().resolve()
    else:
        temporary = Path(tempfile.mkdtemp(prefix="portal_ipt_")) / "instrumentos.csv"
        source = download_report(temporary)

    rows = build_rows(read_csv(source))
    if not rows:
        raise RuntimeError("El reporte no contiene registros clasificados como Modificación.")

    write_outputs(rows)
    print(f"Sincronización completada: {len(rows)} modificaciones en {GZIP_PARTS} bloques.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
