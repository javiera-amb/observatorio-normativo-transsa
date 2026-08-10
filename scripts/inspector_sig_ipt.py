from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import struct
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {".gpkg", ".shp", ".geojson", ".json", ".kml", ".gml", ".sqlite"}
ZONE_FIELD_HINTS = (
    "zona", "zone", "zonif", "cod_zona", "codigo_zona", "codigo", "cod", "subzona",
    "nombre_zona", "nom_zona", "zona_prc", "zona_pri", "zona_prm", "zona_ps",
)
GENERIC_NAME_WORDS = {
    "plan", "regulador", "comunal", "intercomunal", "metropolitano", "seccional", "vigente",
    "instrumento", "territorial", "urbano", "urbana", "zonificacion", "zona", "zonas", "limite",
    "region", "comuna", "de", "del", "la", "las", "los", "y", "el", "prc", "pri", "prm", "ps", "lu",
}
SHAPE_TYPES = {
    0: "Null Shape", 1: "Point", 3: "LineString", 5: "Polygon", 8: "MultiPoint",
    11: "PointZ", 13: "LineStringZ", 15: "PolygonZ", 18: "MultiPointZ",
    21: "PointM", 23: "LineStringM", 25: "PolygonM", 28: "MultiPointM", 31: "MultiPatch",
}


def deaccent(value: Any) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(character) != "Mn"
    )


def normalize(value: Any) -> str:
    text = deaccent(value).lower()
    text = re.sub(r"\b(region|comuna|provincia)\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def compact(value: Any) -> str:
    return normalize(value).replace(" ", "_")


def clean_folder_label(value: str) -> str:
    text = re.sub(r"^[\s_\-]*\d{1,2}[\s_\-.]+", "", str(value or "").strip())
    text = re.sub(r"^(region|región)[\s_\-]+(de|del)?[\s_\-]*", "", text, flags=re.I)
    return text.strip(" _-") or str(value or "").strip()


def text_similarity(left: Any, right: Any) -> float:
    a = normalize(left)
    b = normalize(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.92
    return SequenceMatcher(None, a, b).ratio()


def significant_tokens(value: Any) -> set[str]:
    return {
        token for token in normalize(value).split()
        if len(token) >= 3 and token not in GENERIC_NAME_WORDS and not token.isdigit()
    }


def token_similarity(left: Any, right: Any) -> float:
    a = significant_tokens(left)
    b = significant_tokens(right)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def years_in(value: Any) -> set[int]:
    return {int(year) for year in re.findall(r"\b(19\d{2}|20\d{2})\b", str(value or ""))}


def quote_sql_identifier(value: str) -> str:
    return '"' + str(value).replace('"', '""') + '"'


def detect_zone_field(fields: list[str]) -> str:
    normalized = {field: compact(field) for field in fields}
    for hint in ZONE_FIELD_HINTS:
        hint_norm = compact(hint)
        exact = [field for field, value in normalized.items() if value == hint_norm]
        if exact:
            return exact[0]
    for hint in ZONE_FIELD_HINTS:
        hint_norm = compact(hint)
        partial = [field for field, value in normalized.items() if hint_norm in value]
        if partial:
            return partial[0]
    return ""


def detect_role(path_text: str, layer_name: str, fields: list[str]) -> str:
    text = normalize(f"{layer_name} {Path(path_text).stem}")
    if "limite urbano" in text or "lim urbano" in text or re.search(r"\blu\b", text):
        return "limite_urbano"
    if any(word in text for word in ("riesgo", "inund", "remocion", "amenaza")):
        return "riesgo"
    if any(word in text for word in ("vial", "vialidad", "calle", "avenida", "utilidad publica")):
        return "vialidad"
    if any(word in text for word in ("patrimonio", "conservacion historica", "ich", "zch")):
        return "patrimonio"
    if any(word in text for word in ("area verde", "areas verdes", "parque", "plaza")):
        return "areas_verdes"
    if any(word in text for word in ("zonif", "zona", "subzona")) or detect_zone_field(fields):
        return "zonificacion"
    if any(word in text for word in ("equipamiento", "equipamientos")):
        return "equipamiento"
    return "normativa"


def detect_ipt_type(relative_path: Path, layer_name: str) -> str:
    folder_text = normalize(" ".join(relative_path.parts[:-1]))
    filename_text = normalize(relative_path.stem)
    layer_text = normalize(layer_name)
    combined = f" {folder_text} {filename_text} {layer_text} "

    patterns = [
        ("PRM", (r"\bprm\b", r"plan regulador metropolitano")),
        ("PRI", (r"\bpri\b", r"plan regulador intercomunal")),
        ("PRC", (r"\bprc\b", r"plan regulador comunal")),
        ("PS", (r"\bps\b", r"plan seccional", r"\bseccional\b")),
    ]
    for ipt_type, regexes in patterns:
        if any(re.search(regex, combined) for regex in regexes):
            return ipt_type

    if "limite urbano" in combined or "lim urbano" in combined or re.search(r"\blu\b", combined):
        return "LU"
    return ""


def read_crs_from_prj(path: Path) -> tuple[str, str]:
    prj = path.with_suffix(".prj")
    if not prj.exists():
        return "", ""
    try:
        wkt = prj.read_text(encoding="utf-8", errors="ignore").strip()
    except OSError:
        return "", ""
    epsg_match = re.search(r'(?:AUTHORITY\[\s*"EPSG"\s*,\s*"(\d+)"|ID\[\s*"EPSG"\s*,\s*(\d+))', wkt, re.I)
    epsg = next((group for group in epsg_match.groups() if group), "") if epsg_match else ""
    if not epsg and "WGS_1984" in wkt.upper():
        epsg = "4326"
    return (f"EPSG:{epsg}" if epsg else "WKT sin EPSG"), wkt[:800]


def inspect_dbf(dbf_path: Path) -> tuple[list[str], int | None, dict[str, list[str]]]:
    if not dbf_path.exists():
        return [], None, {}
    fields: list[dict[str, Any]] = []
    samples: dict[str, set[str]] = defaultdict(set)
    try:
        with dbf_path.open("rb") as handle:
            header = handle.read(32)
            if len(header) < 32:
                return [], None, {}
            record_count = struct.unpack("<I", header[4:8])[0]
            header_length = struct.unpack("<H", header[8:10])[0]
            record_length = struct.unpack("<H", header[10:12])[0]

            while handle.tell() < header_length:
                descriptor = handle.read(32)
                if not descriptor or descriptor[0] == 0x0D:
                    break
                name = descriptor[:11].split(b"\x00", 1)[0].decode("ascii", errors="ignore").strip()
                if not name:
                    continue
                fields.append({
                    "name": name,
                    "type": chr(descriptor[11]),
                    "length": int(descriptor[16]),
                    "decimal": int(descriptor[17]),
                })

            field_names = [field["name"] for field in fields]
            zone_field = detect_zone_field(field_names)
            if zone_field:
                cpg = dbf_path.with_suffix(".cpg")
                encoding = "cp1252"
                if cpg.exists():
                    try:
                        candidate = cpg.read_text(encoding="ascii", errors="ignore").strip()
                        if candidate:
                            encoding = candidate
                    except OSError:
                        pass
                handle.seek(header_length)
                offsets: dict[str, tuple[int, int]] = {}
                cursor = 1
                for field in fields:
                    offsets[field["name"]] = (cursor, field["length"])
                    cursor += field["length"]
                start, length = offsets[zone_field]
                for _ in range(min(record_count, 1000)):
                    record = handle.read(record_length)
                    if len(record) < record_length:
                        break
                    if record[:1] == b"*":
                        continue
                    raw = record[start:start + length]
                    try:
                        value = raw.decode(encoding, errors="ignore").strip()
                    except LookupError:
                        value = raw.decode("cp1252", errors="ignore").strip()
                    if value:
                        samples[zone_field].add(value)
                    if len(samples[zone_field]) >= 60:
                        break
            return field_names, record_count, {key: sorted(values) for key, values in samples.items()}
    except (OSError, struct.error):
        return [], None, {}


def inspect_shapefile(path: Path, relative_path: Path, region: str, commune: str) -> list[dict[str, Any]]:
    fields, feature_count, samples = inspect_dbf(path.with_suffix(".dbf"))
    geometry_type = ""
    bbox: list[float] | None = None
    try:
        with path.open("rb") as handle:
            header = handle.read(100)
        if len(header) >= 100:
            shape_type = struct.unpack("<i", header[32:36])[0]
            geometry_type = SHAPE_TYPES.get(shape_type, f"ShapeType {shape_type}")
            bbox = list(struct.unpack("<4d", header[36:68]))
    except (OSError, struct.error):
        pass
    crs, crs_wkt = read_crs_from_prj(path)
    zone_field = detect_zone_field(fields)
    layer_name = path.stem
    return [{
        "region": region,
        "comuna": commune,
        "archivo": relative_path.as_posix(),
        "formato": "SHP",
        "capa": layer_name,
        "tipo_ipt_detectado": detect_ipt_type(relative_path, layer_name),
        "rol_capa": detect_role(str(relative_path), layer_name, fields),
        "geometria": geometry_type,
        "crs": crs,
        "crs_wkt": crs_wkt,
        "feature_count": feature_count,
        "bbox": bbox,
        "campos": fields,
        "campo_zona": zone_field,
        "valores_zona_muestra": samples.get(zone_field, []) if zone_field else [],
        "fecha_capa": "",
        "inspeccion": "completa_stdlib",
    }]


def sqlite_readonly(path: Path) -> sqlite3.Connection:
    uri = f"file:{path.as_posix()}?mode=ro"
    return sqlite3.connect(uri, uri=True, timeout=10)


def table_exists(connection: sqlite3.Connection, table: str) -> bool:
    row = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1", (table,)
    ).fetchone()
    return bool(row)


def inspect_geopackage(path: Path, relative_path: Path, region: str, commune: str) -> list[dict[str, Any]]:
    layers: list[dict[str, Any]] = []
    connection = sqlite_readonly(path)
    connection.row_factory = sqlite3.Row
    try:
        contents = connection.execute(
            "SELECT table_name, data_type, identifier, last_change, min_x, min_y, max_x, max_y, srs_id "
            "FROM gpkg_contents ORDER BY table_name"
        ).fetchall()
        geometry_meta: dict[str, sqlite3.Row] = {}
        if table_exists(connection, "gpkg_geometry_columns"):
            for row in connection.execute(
                "SELECT table_name, column_name, geometry_type_name, srs_id, z, m FROM gpkg_geometry_columns"
            ).fetchall():
                geometry_meta[row["table_name"]] = row
        ogr_counts: dict[str, int] = {}
        if table_exists(connection, "gpkg_ogr_contents"):
            try:
                for row in connection.execute("SELECT table_name, feature_count FROM gpkg_ogr_contents").fetchall():
                    if row["feature_count"] is not None:
                        ogr_counts[row["table_name"]] = int(row["feature_count"])
            except sqlite3.DatabaseError:
                pass

        for row in contents:
            if row["data_type"] not in {"features", "attributes"}:
                continue
            table_name = str(row["table_name"])
            safe_table = quote_sql_identifier(table_name)
            fields_info = connection.execute(f"PRAGMA table_info({safe_table})").fetchall()
            geometry_column = geometry_meta.get(table_name)["column_name"] if table_name in geometry_meta else ""
            fields = [str(field["name"]) for field in fields_info if str(field["name"]) != geometry_column]
            zone_field = detect_zone_field(fields)
            zone_values: list[str] = []
            if zone_field:
                safe_field = quote_sql_identifier(zone_field)
                try:
                    values = connection.execute(
                        f"SELECT DISTINCT CAST({safe_field} AS TEXT) AS value FROM {safe_table} "
                        f"WHERE {safe_field} IS NOT NULL AND TRIM(CAST({safe_field} AS TEXT)) <> '' LIMIT 60"
                    ).fetchall()
                    zone_values = sorted({str(value["value"]).strip() for value in values if value["value"] is not None})
                except sqlite3.DatabaseError:
                    zone_values = []

            geometry = geometry_meta.get(table_name)
            srs_id = geometry["srs_id"] if geometry else row["srs_id"]
            bbox = None
            if all(row[key] is not None for key in ("min_x", "min_y", "max_x", "max_y")):
                bbox = [row["min_x"], row["min_y"], row["max_x"], row["max_y"]]
            layer_name = str(row["identifier"] or table_name)
            layers.append({
                "region": region,
                "comuna": commune,
                "archivo": relative_path.as_posix(),
                "formato": "GPKG",
                "capa": table_name,
                "identificador_capa": layer_name,
                "tipo_ipt_detectado": detect_ipt_type(relative_path, f"{table_name} {layer_name}"),
                "rol_capa": detect_role(str(relative_path), f"{table_name} {layer_name}", fields),
                "geometria": str(geometry["geometry_type_name"] if geometry else row["data_type"]),
                "crs": f"EPSG:{srs_id}" if srs_id is not None else "",
                "crs_wkt": "",
                "feature_count": ogr_counts.get(table_name),
                "bbox": bbox,
                "campos": fields,
                "campo_zona": zone_field,
                "valores_zona_muestra": zone_values,
                "fecha_capa": str(row["last_change"] or ""),
                "inspeccion": "completa_gpkg",
            })
    finally:
        connection.close()
    return layers


def inspect_geojson(path: Path, relative_path: Path, region: str, commune: str) -> list[dict[str, Any]]:
    size_mb = path.stat().st_size / (1024 * 1024)
    layer_name = path.stem
    if size_mb > 25:
        return [{
            "region": region, "comuna": commune, "archivo": relative_path.as_posix(), "formato": "GeoJSON",
            "capa": layer_name, "tipo_ipt_detectado": detect_ipt_type(relative_path, layer_name),
            "rol_capa": detect_role(str(relative_path), layer_name, []), "geometria": "", "crs": "EPSG:4326",
            "crs_wkt": "", "feature_count": None, "bbox": None, "campos": [], "campo_zona": "",
            "valores_zona_muestra": [], "fecha_capa": "", "inspeccion": "parcial_archivo_grande",
        }]
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        raise ValueError("GeoJSON/JSON no válido")
    features = payload.get("features", []) if isinstance(payload, dict) else []
    sample_features = features[:300] if isinstance(features, list) else []
    fields: set[str] = set()
    geometry_types: set[str] = set()
    for feature in sample_features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if isinstance(properties, dict):
            fields.update(str(key) for key in properties.keys())
        geometry = feature.get("geometry")
        if isinstance(geometry, dict) and geometry.get("type"):
            geometry_types.add(str(geometry["type"]))
    field_list = sorted(fields)
    zone_field = detect_zone_field(field_list)
    zone_values: set[str] = set()
    if zone_field:
        for feature in sample_features:
            properties = feature.get("properties") if isinstance(feature, dict) else None
            if isinstance(properties, dict) and properties.get(zone_field) not in (None, ""):
                zone_values.add(str(properties[zone_field]).strip())
                if len(zone_values) >= 60:
                    break
    return [{
        "region": region, "comuna": commune, "archivo": relative_path.as_posix(), "formato": "GeoJSON",
        "capa": layer_name, "tipo_ipt_detectado": detect_ipt_type(relative_path, layer_name),
        "rol_capa": detect_role(str(relative_path), layer_name, field_list),
        "geometria": ", ".join(sorted(geometry_types)), "crs": "EPSG:4326", "crs_wkt": "",
        "feature_count": len(features) if isinstance(features, list) else None,
        "bbox": payload.get("bbox") if isinstance(payload, dict) else None,
        "campos": field_list, "campo_zona": zone_field, "valores_zona_muestra": sorted(zone_values),
        "fecha_capa": "", "inspeccion": "completa_geojson",
    }]


def inspect_generic(path: Path, relative_path: Path, region: str, commune: str) -> list[dict[str, Any]]:
    layer_name = path.stem
    return [{
        "region": region, "comuna": commune, "archivo": relative_path.as_posix(),
        "formato": path.suffix.lstrip(".").upper(), "capa": layer_name,
        "tipo_ipt_detectado": detect_ipt_type(relative_path, layer_name),
        "rol_capa": detect_role(str(relative_path), layer_name, []), "geometria": "", "crs": "", "crs_wkt": "",
        "feature_count": None, "bbox": None, "campos": [], "campo_zona": "", "valores_zona_muestra": [],
        "fecha_capa": "", "inspeccion": "archivo_detectado_sin_lectura_profunda",
    }]


def inspect_file(root: Path, path: Path) -> list[dict[str, Any]]:
    relative = path.relative_to(root)
    parts = relative.parts
    region = clean_folder_label(parts[0]) if len(parts) >= 2 else "Sin región"
    commune = clean_folder_label(parts[1]) if len(parts) >= 2 else (clean_folder_label(parts[0]) if parts else "Sin comuna")
    suffix = path.suffix.lower()
    if suffix == ".gpkg":
        return inspect_geopackage(path, relative, region, commune)
    if suffix == ".shp":
        return inspect_shapefile(path, relative, region, commune)
    if suffix in {".geojson", ".json"}:
        return inspect_geojson(path, relative, region, commune)
    return inspect_generic(path, relative, region, commune)


def load_portal_instruments(repo: Path) -> list[dict[str, Any]]:
    data_dir = repo / "data"
    instruments: list[dict[str, Any]] = []
    prefix = "window.VIGENCIA_IPT_ROWS=(window.VIGENCIA_IPT_ROWS||[]).concat("
    for path in sorted(data_dir.glob("ipt_vigentes_*.js")):
        raw = path.read_text(encoding="utf-8").strip()
        if not raw.startswith(prefix) or not raw.endswith(");"):
            continue
        try:
            rows = json.loads(raw[len(prefix):-2])
        except json.JSONDecodeError:
            continue
        for row in rows:
            if not isinstance(row, list) or len(row) < 8:
                continue
            communes = row[3] if isinstance(row[3], list) else [part.strip() for part in str(row[2] or "").split(",") if part.strip()]
            for commune in communes:
                instruments.append({
                    "registro": row[0],
                    "region": row[1] or "",
                    "comuna": commune,
                    "tipo_ipt": row[4] or "",
                    "nivel": row[5] or "",
                    "nombre": row[6] or "",
                    "fecha": row[7] or "",
                })
    return instruments


def locality_score(layer: dict[str, Any], instrument: dict[str, Any]) -> float:
    commune_score = text_similarity(layer["comuna"], instrument["comuna"])
    region_score = text_similarity(layer["region"], instrument["region"])
    if commune_score < 0.72:
        return 0.0
    if region_score < 0.55:
        return 0.0
    return 0.55 * commune_score + 0.20 * region_score


def candidate_score(layer: dict[str, Any], instrument: dict[str, Any]) -> float:
    base = locality_score(layer, instrument)
    if base <= 0:
        return 0.0
    detected_type = str(layer.get("tipo_ipt_detectado") or "").upper()
    portal_type = str(instrument.get("tipo_ipt") or "").upper()
    if detected_type and portal_type == detected_type:
        base += 0.18
    elif detected_type and portal_type != detected_type:
        base -= 0.16

    sig_name = f"{Path(layer['archivo']).stem} {layer.get('capa', '')}"
    name_ratio = max(text_similarity(sig_name, instrument["nombre"]), token_similarity(sig_name, instrument["nombre"]))
    base += 0.17 * name_ratio

    sig_years = years_in(sig_name)
    portal_years = years_in(instrument.get("fecha"))
    if sig_years and portal_years:
        if sig_years & portal_years:
            base += 0.10
        else:
            base -= 0.08
    return max(0.0, min(1.0, base))


def link_layer(layer: dict[str, Any], instruments: list[dict[str, Any]]) -> dict[str, Any]:
    scored = []
    for instrument in instruments:
        score = candidate_score(layer, instrument)
        if score >= 0.45:
            scored.append((score, instrument))
    scored.sort(key=lambda item: (-item[0], str(item[1].get("fecha") or "9999-99-99"), str(item[1].get("nombre") or "")))
    top = scored[:5]
    if not top:
        return {
            "estado": "sin_vinculo", "confianza": "baja", "score": 0.0,
            "registro_portal": None, "instrumento_portal": "", "fecha_portal": "", "candidatos": [],
        }

    best_score, best = top[0]
    detected_type = str(layer.get("tipo_ipt_detectado") or "").upper()
    ambiguous = len(top) > 1 and abs(best_score - top[1][0]) < 0.07

    if detected_type == "PS":
        sig_name = f"{Path(layer['archivo']).stem} {layer.get('capa', '')}"
        ps_name_match = max(text_similarity(sig_name, best["nombre"]), token_similarity(sig_name, best["nombre"]))
        if ps_name_match < 0.32:
            ambiguous = True

    if ambiguous:
        status = "vinculo_ambiguo"
        confidence = "baja"
    elif best_score >= 0.82:
        status = "vinculado"
        confidence = "alta"
    elif best_score >= 0.68:
        status = "vinculado"
        confidence = "media"
    else:
        status = "vinculo_preliminar"
        confidence = "baja"

    return {
        "estado": status,
        "confianza": confidence,
        "score": round(best_score, 4),
        "registro_portal": best["registro"],
        "instrumento_portal": best["nombre"],
        "tipo_portal": best["tipo_ipt"],
        "fecha_portal": best["fecha"],
        "candidatos": [
            {
                "registro": candidate["registro"], "nombre": candidate["nombre"], "tipo": candidate["tipo_ipt"],
                "fecha": candidate["fecha"], "score": round(score, 4),
            }
            for score, candidate in top
        ],
    }


def make_alert(level: str, code: str, layer: dict[str, Any] | None, message: str, **extra: Any) -> dict[str, Any]:
    alert = {
        "nivel": level,
        "codigo": code,
        "region": layer.get("region", "") if layer else extra.pop("region", ""),
        "comuna": layer.get("comuna", "") if layer else extra.pop("comuna", ""),
        "archivo": layer.get("archivo", "") if layer else extra.pop("archivo", ""),
        "capa": layer.get("capa", "") if layer else extra.pop("capa", ""),
        "mensaje": message,
    }
    alert.update(extra)
    return alert


def build_alerts(layers: list[dict[str, Any]], linkages: list[dict[str, Any]], instruments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []
    linkage_by_id = {item["sig_id"]: item for item in linkages}
    linked_records: set[tuple[Any, str]] = set()

    for layer in layers:
        link = linkage_by_id[layer["sig_id"]]
        if layer.get("error"):
            alerts.append(make_alert("ERROR", "ARCHIVO_NO_LEIBLE", layer, layer["error"]))
            continue
        if not layer.get("crs"):
            alerts.append(make_alert("ADVERTENCIA", "CRS_NO_DETECTADO", layer, "No se pudo identificar el sistema de referencia de la capa."))
        if layer.get("rol_capa") == "zonificacion" and not layer.get("campo_zona"):
            alerts.append(make_alert("ADVERTENCIA", "CAMPO_ZONA_NO_DETECTADO", layer, "La capa parece corresponder a zonificación, pero no se detectó automáticamente el campo de zona."))
        if not layer.get("tipo_ipt_detectado"):
            alerts.append(make_alert("INFO", "TIPO_IPT_NO_DETECTADO", layer, "No se pudo inferir PRC, PRI, PRM, PS o LU desde el nombre o la estructura de carpetas."))
        if layer.get("inspeccion", "").startswith("archivo_detectado"):
            alerts.append(make_alert("INFO", "LECTURA_PARCIAL", layer, "El archivo fue inventariado, pero este formato no tiene lectura profunda en la primera versión del inspector."))
        if link["estado"] == "sin_vinculo":
            alerts.append(make_alert("ADVERTENCIA", "SIN_VINCULO_PORTAL", layer, "No se encontró un instrumento del Portal IPT con coincidencia suficiente de región, comuna, tipo y nombre."))
        elif link["estado"] == "vinculo_ambiguo":
            alerts.append(make_alert("ADVERTENCIA", "VINCULO_AMBIGUO", layer, "Existen dos o más instrumentos candidatos. Debe confirmarse manualmente cuál corresponde a esta cartografía."))
        elif link.get("registro_portal") is not None:
            linked_records.add((link["registro_portal"], compact(layer["comuna"])))

    # Revisa instrumentos vigentes del portal que no encontraron una cartografía vinculada en su comuna.
    for instrument in instruments:
        key = (instrument["registro"], compact(instrument["comuna"]))
        if key in linked_records:
            continue
        alerts.append(make_alert(
            "INFO", "IPT_PORTAL_SIN_SIG_VINCULADO", None,
            f"El instrumento Portal IPT '{instrument['nombre']}' ({instrument['tipo_ipt']}) no quedó vinculado automáticamente a una capa SIG.",
            region=instrument["region"], comuna=instrument["comuna"], registro_portal=instrument["registro"],
        ))
    return alerts


def csv_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        for row in rows:
            writer.writerow({field: csv_value(row.get(field, "")) for field in fieldnames})


def main() -> int:
    parser = argparse.ArgumentParser(description="Inventaría y vincula cartografía SIG de IPT de Chile.")
    parser.add_argument("--root", type=Path, required=True, help="Carpeta raíz Región/Comuna con archivos SIG.")
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1], help="Raíz del repositorio observatorio-normativo-transsa.")
    parser.add_argument("--output", type=Path, help="Carpeta de salida. Por defecto: <repo>/_local/sig_ipt")
    args = parser.parse_args()

    root = args.root.expanduser().resolve()
    repo = args.repo.expanduser().resolve()
    output = (args.output.expanduser().resolve() if args.output else repo / "_local" / "sig_ipt")

    if not root.exists() or not root.is_dir():
        print(f"ERROR: no existe la carpeta SIG: {root}", file=sys.stderr)
        return 2
    if not (repo / "data").exists():
        print(f"ERROR: no parece ser el repositorio correcto: {repo}", file=sys.stderr)
        return 2

    print("=" * 72)
    print("INSPECTOR SIG IPT - TRANSAA URBAN INTELLIGENCE")
    print("=" * 72)
    print(f"Carpeta SIG : {root}")
    print(f"Repositorio : {repo}")
    print(f"Salida      : {output}")
    print()

    source_files = sorted(
        path for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        and not (path.suffix.lower() == ".json" and path.name.lower().endswith(".style.json"))
    )
    if not source_files:
        print("ERROR: no se encontraron GPKG, SHP, GeoJSON, KML, GML o SQLite.", file=sys.stderr)
        return 3

    layers: list[dict[str, Any]] = []
    for index, path in enumerate(source_files, start=1):
        relative = path.relative_to(root)
        print(f"[{index:>4}/{len(source_files)}] {relative}")
        try:
            inspected = inspect_file(root, path)
            layers.extend(inspected)
        except Exception as error:  # el inventario debe continuar aunque un archivo falle
            parts = relative.parts
            region = clean_folder_label(parts[0]) if len(parts) >= 2 else "Sin región"
            commune = clean_folder_label(parts[1]) if len(parts) >= 2 else "Sin comuna"
            layers.append({
                "region": region, "comuna": commune, "archivo": relative.as_posix(),
                "formato": path.suffix.lstrip(".").upper(), "capa": path.stem,
                "tipo_ipt_detectado": detect_ipt_type(relative, path.stem), "rol_capa": "desconocido",
                "geometria": "", "crs": "", "crs_wkt": "", "feature_count": None, "bbox": None,
                "campos": [], "campo_zona": "", "valores_zona_muestra": [], "fecha_capa": "",
                "inspeccion": "error", "error": f"{type(error).__name__}: {error}",
            })

    for index, layer in enumerate(layers, start=1):
        layer["sig_id"] = f"sig-{index:06d}"

    instruments = load_portal_instruments(repo)
    linkages: list[dict[str, Any]] = []
    for layer in layers:
        link = link_layer(layer, instruments)
        linkages.append({
            "sig_id": layer["sig_id"], "region": layer["region"], "comuna": layer["comuna"],
            "archivo": layer["archivo"], "capa": layer["capa"],
            "tipo_ipt_detectado": layer.get("tipo_ipt_detectado", ""), "rol_capa": layer.get("rol_capa", ""),
            **link,
        })

    alerts = build_alerts(layers, linkages, instruments)
    output.mkdir(parents=True, exist_ok=True)

    inventory_fields = [
        "sig_id", "region", "comuna", "archivo", "formato", "capa", "identificador_capa",
        "tipo_ipt_detectado", "rol_capa", "geometria", "crs", "feature_count", "bbox",
        "campo_zona", "valores_zona_muestra", "campos", "fecha_capa", "inspeccion", "error",
    ]
    linkage_fields = [
        "sig_id", "region", "comuna", "archivo", "capa", "tipo_ipt_detectado", "rol_capa", "estado",
        "confianza", "score", "registro_portal", "instrumento_portal", "tipo_portal", "fecha_portal", "candidatos",
    ]
    alert_fields = ["nivel", "codigo", "region", "comuna", "archivo", "capa", "registro_portal", "mensaje"]

    write_csv(output / "inventario_sig_ipt.csv", layers, inventory_fields)
    write_csv(output / "vinculacion_sig_ipt.csv", linkages, linkage_fields)
    write_csv(output / "alertas_sig_ipt.csv", alerts, alert_fields)

    summary = {
        "fecha_generacion": datetime.now().isoformat(timespec="seconds"),
        "carpeta_sig": str(root),
        "archivos_sig": len(source_files),
        "capas_detectadas": len(layers),
        "regiones_detectadas": len({compact(layer["region"]) for layer in layers}),
        "comunas_detectadas": len({(compact(layer["region"]), compact(layer["comuna"])) for layer in layers}),
        "por_formato": dict(Counter(layer.get("formato", "") for layer in layers)),
        "por_tipo_ipt": dict(Counter(layer.get("tipo_ipt_detectado", "") or "No detectado" for layer in layers)),
        "por_rol_capa": dict(Counter(layer.get("rol_capa", "") or "No detectado" for layer in layers)),
        "vinculacion": dict(Counter(item["estado"] for item in linkages)),
        "alertas": dict(Counter(item["nivel"] for item in alerts)),
        "instrumentos_portal_cargados": len(instruments),
    }

    (output / "capas_sig_ipt.json").write_text(
        json.dumps({"resumen": summary, "capas": layers}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (output / "vinculacion_sig_ipt.json").write_text(
        json.dumps({"resumen": summary, "vinculaciones": linkages}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (output / "resumen_sig_ipt.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print()
    print("-" * 72)
    print("RESULTADO")
    print("-" * 72)
    print(f"Archivos encontrados : {len(source_files)}")
    print(f"Capas detectadas     : {len(layers)}")
    print(f"Comunas detectadas   : {summary['comunas_detectadas']}")
    print(f"Vínculos Portal IPT  : {sum(1 for item in linkages if item['estado'] == 'vinculado')}")
    print(f"Vínculos ambiguos    : {sum(1 for item in linkages if item['estado'] == 'vinculo_ambiguo')}")
    print(f"Sin vínculo          : {sum(1 for item in linkages if item['estado'] == 'sin_vinculo')}")
    print(f"Alertas              : {len(alerts)}")
    print()
    print("Archivos generados:")
    for filename in (
        "inventario_sig_ipt.csv", "capas_sig_ipt.json", "vinculacion_sig_ipt.csv",
        "vinculacion_sig_ipt.json", "alertas_sig_ipt.csv", "resumen_sig_ipt.json",
    ):
        print(f"  - {output / filename}")
    print()
    print("El inspector NO modifica los GPKG/SHP originales.")
    print("Los resultados quedan en _local/sig_ipt, carpeta excluida de GitHub.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
