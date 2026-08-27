from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.cargar_catalogo_ipt_desde_excel import as_iso_date, normalize_region, read_sheet_rows


HEADER_ALIASES = {
    "registro": ["N° registro CSV", "N° registro", "Registro", "ID"],
    "region": ["Región", "Region"],
    "comunas": ["Comunas", "Comuna"],
    "nivel": ["Nivel de planificación", "Nivel de planificacion"],
    "tipo_ipt": ["Tipo de planificación", "Tipo de planificacion", "Tipo IPT"],
    "clasificacion": ["Clasificación", "Clasificacion"],
    "denominacion": ["Denominación", "Denominacion", "Instrumento"],
    "estado": ["Estado"],
    "fecha_vigencia": ["Fecha de inicio de vigencia", "Fecha", "Fecha de vigencia"],
    "fecha_ultimo_hito": ["Fecha de último hito cumplido", "Fecha de ultimo hito cumplido"],
    "codigos_origen": [
        "Códigos de instrumentos de origen que afecta",
        "Codigos de instrumentos de origen que afecta",
        "Instrumentos de origen que afecta",
        "Códigos de origen",
    ],
    "incorporacion_sig": [
        "Incorporación en plano/shape actual",
        "Incorporacion en plano/shape actual",
        "Incorporación SIG",
        "Estado SIG",
    ],
    "fundamento": ["Fundamento", "Observación", "Observacion"],
    "estado_revision": ["Estado de revisión", "Estado de revision"],
    "fuente_portal": ["Fuente Portal IPT", "Fuente", "URL Portal IPT"],
    "fuente_cartografia": ["Fuente cartográfica IDE MINVU", "Fuente cartografica IDE MINVU"],
    "documento": ["Documento", "URL documento", "Enlace documento", "Acto administrativo"],
}


def first_value(record: dict[str, object], aliases: list[str]):
    for alias in aliases:
        value = record.get(alias)
        if value not in {None, ""}:
            return value
    return ""


def field(record: dict[str, object], key: str):
    return first_value(record, HEADER_ALIASES[key])


def split_communes(value: object) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []
    return [part.strip() for part in re.split(r"\s*[,;|]\s*", text) if part.strip()]


def parse_origin_codes(value: object) -> list[int]:
    return sorted({int(number) for number in re.findall(r"\d+", str(value or ""))})


def normalize_sig_status(value: object) -> str:
    text = str(value or "").strip().lower()
    text = text.replace("í", "i").replace("ó", "o").replace("á", "a").replace("é", "e").replace("ú", "u")
    if not text:
        return "pendiente_revision"
    if any(term in text for term in ("no incorpor", "desactual", "omitid")):
        return "no_incorporado"
    if any(term in text for term in ("parcial", "probable")):
        return "probablemente_incorporado"
    if any(term in text for term in ("incorporado", "actualizado", "si")):
        return "incorporado"
    if "no aplica" in text:
        return "no_aplica"
    return "pendiente_revision"


def infer_act_type(classification: object, title: object) -> str:
    text = f"{classification or ''} {title or ''}".lower()
    text = text.replace("í", "i").replace("ó", "o").replace("á", "a").replace("é", "e").replace("ú", "u")
    if "enmienda" in text:
        return "Enmienda"
    if "rectific" in text:
        return "Rectificación"
    if "interpret" in text:
        return "Interpretación"
    if "plano de detalle" in text or "plano detalle" in text:
        return "Plano de detalle"
    if "seccional" in text and "modific" in text:
        return "Modificación mediante seccional"
    return "Modificación"


def find_sheet(rows_by_sheet: list[tuple[str, list[list[object]]]], requested: str | None):
    if requested:
        for name, rows in rows_by_sheet:
            if name == requested:
                return name, rows
        raise ValueError(f"No se encontró la hoja '{requested}'.")

    for name, rows in rows_by_sheet:
        if not rows:
            continue
        headers = {str(value or "").strip() for value in rows[0]}
        has_classification = any(alias in headers for alias in HEADER_ALIASES["clasificacion"])
        has_origin = any(alias in headers for alias in HEADER_ALIASES["codigos_origen"])
        if has_classification and has_origin:
            return name, rows

    raise ValueError(
        "No se encontró una hoja con las columnas Clasificación y Códigos de instrumentos de origen que afecta."
    )


def workbook_sheet_names(xlsx_path: Path) -> list[str]:
    import zipfile
    from xml.etree import ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    with zipfile.ZipFile(xlsx_path) as archive:
        root = ET.fromstring(archive.read("xl/workbook.xml"))
    return [sheet.attrib.get("name", "") for sheet in root.findall(f".//{{{ns}}}sheet")]


def build_act(record: dict[str, object]) -> dict:
    register_raw = field(record, "registro")
    register_numbers = re.findall(r"\d+", str(register_raw or ""))
    register = int(register_numbers[0]) if register_numbers else 0
    title = str(field(record, "denominacion") or "").strip()
    classification = str(field(record, "clasificacion") or "").strip()
    act_type = infer_act_type(classification, title)
    base_date = as_iso_date(field(record, "fecha_vigencia"))
    milestone_date = as_iso_date(field(record, "fecha_ultimo_hito"))
    date = base_date or milestone_date
    origin_codes = parse_origin_codes(field(record, "codigos_origen"))
    communes = split_communes(field(record, "comunas"))
    source = str(field(record, "fuente_portal") or "").strip() or "https://portalipt.minvu.cl/instrumentos"
    document = str(field(record, "documento") or "").strip()
    sig_status = normalize_sig_status(field(record, "incorporacion_sig"))
    review_status = str(field(record, "estado_revision") or "").strip() or "Pendiente"

    return {
        "id": f"acto-ipt-{register or abs(hash((title, date))) % 100000000}",
        "registro_portal": register or None,
        "region": normalize_region(field(record, "region")),
        "comunas": communes,
        "nivel_planificacion": str(field(record, "nivel") or "").strip(),
        "tipo_ipt": str(field(record, "tipo_ipt") or "").strip(),
        "clasificacion_portal": classification,
        "tipo_acto": act_type,
        "titulo": title or f"{act_type} sin denominación",
        "estado": str(field(record, "estado") or "").strip(),
        "fecha": date,
        "codigos_origen_afectados": origin_codes,
        "vinculacion_origen": "vinculado" if origin_codes else "pendiente",
        "incorporacion_sig": sig_status,
        "estado_revision": review_status,
        "fundamento_revision": str(field(record, "fundamento") or "").strip(),
        "fuente_oficial": source,
        "fuente_cartografia": str(field(record, "fuente_cartografia") or "").strip(),
        "documentos": [document] if document else [],
        "zonas_afectadas": [],
        "archivo_geojson_cambio": "",
        "evidencia_sig": "",
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Carga modificaciones, enmiendas y otros actos posteriores del Portal IPT."
    )
    parser.add_argument("excel", type=Path, help="Excel exportado desde el Portal IPT con actos posteriores.")
    parser.add_argument("--sheet", help="Nombre de hoja. Si se omite, se detecta automáticamente.")
    parser.add_argument("--repo", type=Path, default=REPO_ROOT, help="Carpeta raíz del repositorio.")
    args = parser.parse_args()

    excel_path = args.excel.expanduser().resolve()
    repo_path = args.repo.expanduser().resolve()
    if not excel_path.exists():
        print(f"ERROR: no existe el archivo: {excel_path}", file=sys.stderr)
        return 1

    rows_by_sheet = []
    for sheet_name in workbook_sheet_names(excel_path):
        try:
            rows_by_sheet.append((sheet_name, read_sheet_rows(excel_path, sheet_name)))
        except Exception:
            continue

    try:
        sheet_name, rows = find_sheet(rows_by_sheet, args.sheet)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    if len(rows) < 2:
        print(f"ERROR: la hoja {sheet_name} no contiene registros.", file=sys.stderr)
        return 1

    headers = [str(value or "").strip() for value in rows[0]]
    acts: list[dict] = []
    for row in rows[1:]:
        padded = row + [None] * (len(headers) - len(row))
        record = dict(zip(headers, padded[: len(headers)]))
        classification = str(field(record, "clasificacion") or "").strip().lower()
        title = str(field(record, "denominacion") or "").strip().lower()
        if not classification and not title:
            continue
        if classification == "instrumento de origen":
            continue
        if not any(term in f"{classification} {title}" for term in (
            "modific", "enmienda", "rectific", "interpret", "plano de detalle", "seccional"
        )):
            continue
        acts.append(build_act(record))

    acts.sort(key=lambda item: (item["region"], ", ".join(item["comunas"]), item["fecha"], item["titulo"]))
    type_counts = Counter(item["tipo_acto"] for item in acts)
    linked = sum(1 for item in acts if item["codigos_origen_afectados"])
    pending_sig = sum(1 for item in acts if item["incorporacion_sig"] == "pendiente_revision")

    payload = {
        "fecha_carga": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "fuente": "Portal IPT MINVU - exportación de modificaciones y actos posteriores",
        "hoja_origen": sheet_name,
        "resumen": {
            "total": len(acts),
            "modificaciones": sum(count for name, count in type_counts.items() if name.startswith("Modificación")),
            "enmiendas": type_counts.get("Enmienda", 0),
            "rectificaciones": type_counts.get("Rectificación", 0),
            "interpretaciones": type_counts.get("Interpretación", 0),
            "planos_detalle": type_counts.get("Plano de detalle", 0),
            "vinculados_origen": linked,
            "pendientes_vinculacion": len(acts) - linked,
            "pendientes_revision_sig": pending_sig,
        },
        "actos": acts,
        "nota": (
            "Cada acto debe vincularse al instrumento de origen y revisarse contra la cartografía SIG. "
            "La ausencia de evidencia mantiene el estado pendiente_revision."
        ),
    }

    output_path = repo_path / "data" / "actos_ipt.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        "window.ACTOS_IPT = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    print("Carga de actos IPT completada")
    print(f"- Hoja: {sheet_name}")
    print(f"- Actos: {len(acts)}")
    print(f"- Enmiendas: {type_counts.get('Enmienda', 0)}")
    print(f"- Vinculados a instrumento de origen: {linked}")
    print(f"- Pendientes de revisión SIG: {pending_sig}")
    print(f"- Salida: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
