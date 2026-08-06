from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

DATE_HEADERS = {
    "Fecha de inicio de vigencia",
    "Fecha de derogación",
    "Fecha de último hito cumplido",
    "Fecha de desestimiento",
    "Fecha de inicio de EAE",
    "Fecha de término de EAE",
}

REGION_MAP = {
    "ARICA Y PARINACOTA": "Arica y Parinacota",
    "TARAPACÁ": "Tarapacá",
    "ANTOFAGASTA": "Antofagasta",
    "ATACAMA": "Atacama",
    "COQUIMBO": "Coquimbo",
    "VALPARAÍSO": "Valparaíso",
    "METROPOLITANA DE SANTIAGO": "Metropolitana de Santiago",
    "LIBERTADOR GENERAL BERNARDO O'HIGGINS": "O'Higgins",
    "MAULE": "Maule",
    "ÑUBLE": "Ñuble",
    "BIOBÍO": "Biobío",
    "LA ARAUCANÍA": "La Araucanía",
    "LOS RÍOS": "Los Ríos",
    "LOS LAGOS": "Los Lagos",
    "AYSÉN DEL GENERAL CARLOS IBÁÑEZ DEL CAMPO": "Aysén",
    "MAGALLANES Y ANTÁRTICA CHILENA": "Magallanes y de la Antártica Chilena",
    "MAGALLANES Y DE LA ANTÁRTICA CHILENA": "Magallanes y de la Antártica Chilena",
}


def column_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference.upper())
    if not letters:
        raise ValueError(f"Referencia de celda inválida: {reference}")
    value = 0
    for char in letters.group(0):
        value = value * 26 + ord(char) - 64
    return value - 1


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    path = "xl/sharedStrings.xml"
    if path not in archive.namelist():
        return []
    root = ET.fromstring(archive.read(path))
    values: list[str] = []
    for item in root.findall(f"{{{NS_MAIN}}}si"):
        text = "".join(node.text or "" for node in item.iter(f"{{{NS_MAIN}}}t"))
        values.append(text)
    return values


def worksheet_path(archive: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        relation.attrib["Id"]: relation.attrib["Target"]
        for relation in relationships.findall(f"{{{NS_PKG_REL}}}Relationship")
    }

    for sheet in workbook.findall(f".//{{{NS_MAIN}}}sheet"):
        if sheet.attrib.get("name") != sheet_name:
            continue
        relation_id = sheet.attrib.get(f"{{{NS_REL}}}id")
        target = targets.get(relation_id or "")
        if not target:
            break
        target = target.replace("\\", "/")
        if target.startswith("/"):
            return target.lstrip("/")
        if target.startswith("xl/"):
            return target
        return f"xl/{target}"

    raise ValueError(f"No se encontró la hoja '{sheet_name}'.")


def cell_value(cell: ET.Element, shared_strings: list[str]):
    cell_type = cell.attrib.get("t", "")
    value_node = cell.find(f"{{{NS_MAIN}}}v")

    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{NS_MAIN}}}t"))
    if value_node is None or value_node.text is None:
        return None

    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)]
    if cell_type == "b":
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw

    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw


def read_sheet_rows(xlsx_path: Path, sheet_name: str) -> list[list[object]]:
    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings = load_shared_strings(archive)
        path = worksheet_path(archive, sheet_name)
        root = ET.fromstring(archive.read(path))

    rows: list[list[object]] = []
    for row in root.findall(f".//{{{NS_MAIN}}}sheetData/{{{NS_MAIN}}}row"):
        values: dict[int, object] = {}
        for cell in row.findall(f"{{{NS_MAIN}}}c"):
            reference = cell.attrib.get("r", "")
            values[column_index(reference)] = cell_value(cell, shared_strings)
        if not values:
            rows.append([])
            continue
        width = max(values) + 1
        rows.append([values.get(index) for index in range(width)])
    return rows


def as_iso_date(value) -> str:
    if value in {None, ""}:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        date = datetime(1899, 12, 30) + timedelta(days=float(value))
        return date.strftime("%Y-%m-%d")
    text = str(value).strip()
    for pattern in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, pattern).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return text


def normalize_region(value) -> str:
    text = str(value or "").strip()
    return REGION_MAP.get(text.upper(), text.title())


def clean(value):
    return "" if value is None else value


def build_catalog(records: list[dict[str, object]]) -> tuple[list[dict], list[dict]]:
    catalog: list[dict] = []
    current: list[dict] = []

    for record in records:
        register = int(record["N° registro CSV"])
        region = normalize_region(record.get("Región"))
        communes = str(record.get("Comunas") or "").strip()
        ipt_type = str(record.get("Tipo de planificación") or "").strip()
        status = str(record.get("Estado") or "").strip()
        base_date = as_iso_date(record.get("Fecha de inicio de vigencia"))
        portal_source = str(record.get("Fuente Portal IPT") or "").strip()
        cartography_source = str(record.get("Fuente cartográfica IDE MINVU") or "").strip()

        item = {
            "id": f"portal-ipt-{register}",
            "registro_portal": register,
            "region": region,
            "comunas": communes,
            "nivel_planificacion": clean(record.get("Nivel de planificación")),
            "tipo_ipt": ipt_type,
            "clasificacion": clean(record.get("Clasificación")),
            "nombre": clean(record.get("Denominación")),
            "estado_portal": status,
            "fecha_inicio_vigencia": base_date,
            "fecha_derogacion": as_iso_date(record.get("Fecha de derogación")),
            "fecha_ultimo_hito": as_iso_date(record.get("Fecha de último hito cumplido")),
            "fecha_desistimiento": as_iso_date(record.get("Fecha de desestimiento")),
            "modificacion_limite_urbano": clean(record.get("Modificación de Límite Urbano")),
            "eae": clean(record.get("Evaluación Ambiental Estratégica (EAE)")),
            "consulta_indigena": clean(record.get("Consulta Indígena")),
            "codigos_origen_afectados": clean(record.get("Códigos de instrumentos de origen que afecta")),
            "incorporacion_shape_reportada": clean(record.get("Incorporación en plano/shape actual")),
            "fundamento_revision": clean(record.get("Fundamento")),
            "estado_revision": clean(record.get("Estado de revisión")),
            "fuente_portal_ipt": portal_source,
            "fuente_cartografica": cartography_source,
        }
        catalog.append(item)

        if status != "Vigente":
            continue

        current.append({
            "id": item["id"],
            "registro_portal": register,
            "region": region,
            "comuna": communes,
            "tipo_ipt": ipt_type,
            "nombre": item["nombre"],
            "estado_instrumento": status,
            "estado_alerta": "Revisión necesaria",
            "confianza": "baja",
            "fecha_instrumento_base": base_date,
            "fecha_version_cartografica": "",
            "actos_posteriores_pendientes": 0,
            "resumen_alerta": (
                "El instrumento figura vigente en el inventario de origen, pero aún no se dispone "
                "del histórico completo de modificaciones y enmiendas ni de una validación del archivo SIG vigente."
            ),
            "alertas": [
                {
                    "tipo": "Historial incompleto",
                    "nivel": "medio",
                    "mensaje": (
                        "La base disponible contiene instrumentos de origen, pero no los registros de modificaciones "
                        "o enmiendas necesarios para reconstruir la línea de tiempo completa."
                    ),
                },
                {
                    "tipo": "Cartografía pendiente",
                    "nivel": "medio",
                    "mensaje": (
                        "Debe vincularse el servicio o archivo SIG vigente y comparar su fecha, zonas y geometría "
                        "con los actos posteriores."
                    ),
                },
            ],
            "linea_tiempo": [
                {
                    "fecha": base_date or "Sin fecha",
                    "tipo": "Instrumento de origen",
                    "numero": f"Registro Portal IPT {register}",
                    "estado": status,
                    "titulo": item["nombre"],
                    "resumen": f"{ipt_type} registrado como instrumento de origen en el Portal IPT.",
                    "incorporacion": "base",
                    "fuente": portal_source,
                }
            ],
            "comparaciones_espaciales": [],
            "fuente_cartografia": cartography_source,
            "archivo_geojson": "",
            "campo_zona": "",
            "zonas_presentes": [],
            "mapa": {"base_geojson": "", "capas_modificaciones": []},
            "notas": (
                "Inventario inicial cargado desde la base nacional de instrumentos de origen. "
                "La clasificación definitiva requiere incorporar modificaciones, enmiendas y cartografía SIG."
            ),
        })

    return catalog, current


def write_js(path: Path, variable: str, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = f"window.{variable} = " + json.dumps(
        payload,
        ensure_ascii=False,
        separators=(",", ":"),
    ) + ";\n"
    path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Carga el catálogo nacional de IPT de origen y prepara la auditoría cartográfica."
    )
    parser.add_argument("excel", type=Path, help="Ruta al Excel Revision_Correcta_854_IPT_Origenes.xlsx")
    parser.add_argument(
        "--repo",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Carpeta raíz del repositorio.",
    )
    args = parser.parse_args()

    excel_path = args.excel.expanduser().resolve()
    repo_path = args.repo.expanduser().resolve()
    if not excel_path.exists():
        print(f"ERROR: no existe el archivo: {excel_path}", file=sys.stderr)
        return 1

    rows = read_sheet_rows(excel_path, "Base_854_Origenes")
    if len(rows) < 2:
        print("ERROR: la hoja Base_854_Origenes no contiene registros.", file=sys.stderr)
        return 1

    headers = [str(value or "").strip() for value in rows[0]]
    records: list[dict[str, object]] = []
    for row in rows[1:]:
        padded = row + [None] * (len(headers) - len(row))
        record = dict(zip(headers, padded[: len(headers)]))
        if record.get("N° registro CSV") in {None, ""}:
            continue
        for header in DATE_HEADERS:
            record[header] = as_iso_date(record.get(header))
        records.append(record)

    catalog, current = build_catalog(records)
    status_counts = Counter(item["estado_portal"] for item in catalog)

    write_js(
        repo_path / "data" / "catalogo_ipt_origenes.js",
        "CATALOGO_IPT_ORIGENES",
        {
            "fecha_carga": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "fuente": "Portal IPT MINVU - exportación de instrumentos de origen",
            "resumen": {
                "total": len(catalog),
                "vigentes": status_counts.get("Vigente", 0),
                "derogados": status_counts.get("Derogado", 0),
                "en_desarrollo": status_counts.get("En Desarrollo", 0),
                "desistidos": status_counts.get("Desistido", 0),
            },
            "instrumentos": catalog,
        },
    )

    write_js(
        repo_path / "data" / "vigencia_cartografica.js",
        "VIGENCIA_CARTOGRAFICA",
        {
            "fecha_generacion": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "resumen": {
                "instrumentos": len(current),
                "actualizados": 0,
                "probablemente_actualizados": 0,
                "revision_necesaria": len(current),
                "desactualizados": 0,
                "sin_cartografia": 0,
            },
            "instrumentos": current,
            "word_url": "",
            "csv_url": "",
            "nota_metodologica": (
                "Esta carga inicial identifica instrumentos vigentes de origen. No clasifica un SIG como actualizado "
                "hasta vincular modificaciones/enmiendas y ejecutar validación documental y espacial."
            ),
        },
    )

    print("Carga completada")
    print(f"- Instrumentos de origen: {len(catalog)}")
    print(f"- Vigentes enviados a auditoría: {len(current)}")
    print(f"- Derogados: {status_counts.get('Derogado', 0)}")
    print(f"- En desarrollo: {status_counts.get('En Desarrollo', 0)}")
    print(f"- Desistidos: {status_counts.get('Desistido', 0)}")
    print(f"- Salida: {repo_path / 'data' / 'catalogo_ipt_origenes.js'}")
    print(f"- Salida: {repo_path / 'data' / 'vigencia_cartografica.js'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
