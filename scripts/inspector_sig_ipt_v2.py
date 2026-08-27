from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

import inspector_sig_ipt as base

# Segunda lectura adaptada a la estructura real de Cartografía Transsa:
# IPT_Región / escala o tipo / comuna o localidad / archivo.
REGION_FOLDERS = {
    "ipt_antofagasta": "Antofagasta",
    "ipt_araucania": "La Araucanía",
    "ipt_aricayparinacota": "Arica y Parinacota",
    "ipt_atacama": "Atacama",
    "ipt_aysen": "Aysén del General Carlos Ibáñez del Campo",
    "ipt_biobio": "Biobío",
    "ipt_coquimbo": "Coquimbo",
    "ipt_loslagos": "Los Lagos",
    "ipt_losrios": "Los Ríos",
    "ipt_magallanes": "Magallanes y de la Antártica Chilena",
    "ipt_maule": "Maule",
    "ipt_metropolitana": "Metropolitana de Santiago",
    "ipt_nuble": "Ñuble",
    "ipt_o_higgins": "Libertador General Bernardo O'Higgins",
    "ipt_ohiggins": "Libertador General Bernardo O'Higgins",
    "ipt_tarapaca": "Tarapacá",
    "ipt_valparaiso": "Valparaíso",
}

COMMUNE_ALIASES = {
    "indepencia": "Independencia",
    "nunoa": "Ñuñoa",
    "paiguano": "Paihuano",
    "tal tal": "Taltal",
    "san juan costa": "San Juan de la Costa",
    "puerto natales": "Natales",
    "puerto williams": "Cabo de Hornos",
    "melinka": "Guaitecas",
    "la junta": "Cisnes",
    "puerto chacabuco": "Aysén",
    "punta delgada": "San Gregorio",
    "cerro castillo": "Torres del Paine",
    "rio serrano": "Torres del Paine",
}

REGIONAL_SCOPES = {"pri", "prm", "prms", "prdu", "lu"}


def _key(value: Any) -> str:
    return base.normalize(value).replace(" ", "_")


def canonical_region(folder: str) -> str:
    key = _key(folder)
    if key in REGION_FOLDERS:
        return REGION_FOLDERS[key]
    if key == "limites_urbanos_nacional":
        return "Nacional"
    cleaned = re.sub(r"^ipt[_\s-]*", "", str(folder or ""), flags=re.I)
    return base.clean_folder_label(cleaned)


def canonical_commune(value: str) -> str:
    cleaned = base.clean_folder_label(value)
    key = base.normalize(cleaned)
    return COMMUNE_ALIASES.get(key, cleaned)


def is_reference_data(relative: Path, layer_name: str = "") -> bool:
    text = base.normalize(f"{' '.join(relative.parts)} {layer_name}")
    filename = base.normalize(relative.stem)
    # RGC corresponde a predios / áreas homogéneas de referencia, no a normativa IPT.
    if " rgc " in f" {filename} " or filename.endswith(" rgc"):
        return True
    if "predios" in text or "predio" in text:
        return True
    if "areas homogeneas" in text or "area homogenea" in text:
        return True
    return False


def detect_zone_field_v2(fields: list[str]) -> str:
    normalized = {field: base.compact(field) for field in fields}
    strong_exact = {
        "zona", "zone", "zonificacion", "zonif", "cod_zona", "codigo_zona",
        "subzona", "nombre_zona", "nom_zona", "zona_prc", "zona_pri", "zona_prm", "zona_ps",
    }
    for field, value in normalized.items():
        if value in strong_exact:
            return field
    for field, value in normalized.items():
        if any(token in value for token in ("zona", "zonif", "subzona")):
            return field
    return ""


def detect_ipt_type_v2(relative_path: Path, layer_name: str) -> str:
    filename = base.normalize(relative_path.stem)
    layer = base.normalize(layer_name)
    primary = f" {filename} {layer} "
    folders = [base.normalize(part) for part in relative_path.parts[:-1]]
    folder_text = f" {' '.join(folders)} "

    # Seccional manda sobre la carpeta PRC: es un instrumento distinto y luego se integra al PRC consolidado.
    if any(token in primary for token in (" secc ", " seccional ", " pnsecc ", " pnosecc ")) or re.search(r"\bsecc\w*\b", primary):
        return "PS"
    if " plan seccional " in primary:
        return "PS"

    if re.search(r"\bprms?\b", primary) or " plan regulador metropolitano " in primary:
        return "PRM"
    if re.search(r"\bprmc\b", primary):
        return "PRM"
    if re.search(r"\bpri\b", primary) or " plan regulador intercomunal " in primary:
        return "PRI"
    if re.search(r"\bprdu\b", primary):
        return "PRDU"
    if re.search(r"\bprc\b", primary) or " plan regulador comunal " in primary:
        return "PRC"
    if " limite urbano " in primary or " lim urbano " in primary or re.search(r"\blu\b", primary):
        return "LU"

    # Si el nombre no lo dice, usamos la carpeta de escala.
    if any(part in {"prms", "prm"} for part in folders):
        return "PRM"
    if "pri" in folders:
        return "PRI"
    if "prdu" in folders:
        return "PRDU"
    if "prc" in folders or "prc wm" in folders:
        return "PRC"
    if "lu" in folders:
        return "LU"
    return ""


def read_crs_from_prj_v2(path: Path) -> tuple[str, str]:
    prj = path.with_suffix(".prj")
    if not prj.exists():
        return "", ""
    try:
        wkt = prj.read_text(encoding="utf-8", errors="ignore").strip()
    except OSError:
        return "", ""

    # En un WKT proyectado puede aparecer primero EPSG:4326 como CRS geográfico interno.
    # Usamos el último AUTHORITY/ID EPSG, que normalmente corresponde al CRS exterior.
    matches = re.findall(
        r'(?:AUTHORITY\[\s*"EPSG"\s*,\s*"(\d+)"|ID\[\s*"EPSG"\s*,\s*(\d+))',
        wkt,
        flags=re.I,
    )
    codes = [next((group for group in match if group), "") for match in matches]
    codes = [code for code in codes if code]
    if codes:
        return f"EPSG:{codes[-1]}", wkt[:800]

    upper = wkt.upper()
    utm = re.search(r"UTM[^0-9]*(?:ZONE[_\s-]*)?(1[7-9]|20)[_\s-]*([NS])?", upper)
    if utm and ("WGS_1984" in upper or "WGS 84" in upper):
        zone = int(utm.group(1))
        hemisphere = (utm.group(2) or "S").upper()
        epsg = (32600 if hemisphere == "N" else 32700) + zone
        return f"EPSG:{epsg}", wkt[:800]

    # Solo declaramos 4326 cuando el WKT es realmente geográfico, no un PROJCS basado en WGS84.
    if (upper.startswith("GEOGCS") or upper.startswith("GEODCRS")) and ("WGS_1984" in upper or "WGS 84" in upper):
        return "EPSG:4326", wkt[:800]
    return "WKT sin EPSG", wkt[:800]


def parse_scope(relative: Path) -> tuple[str, str]:
    parts = relative.parts
    if not parts:
        return "Sin región", "Sin comuna"

    region = canonical_region(parts[0])
    if region == "Nacional":
        return region, "Cobertura nacional"

    if len(parts) < 2:
        return region, ""

    scale = base.normalize(parts[1]).replace(" ", "_")
    if scale in REGIONAL_SCOPES:
        return region, "Cobertura regional"

    # Estructura predominante: IPT_Región / PRC / comuna-o-localidad / archivo.
    if scale in {"prc", "prc_wm"} and len(parts) >= 4:
        return region, canonical_commune(parts[2])

    # Archivos directamente bajo la región se mantienen sin comuna hasta vincularlos por nombre.
    return region, ""


def inspect_file_v2(root: Path, path: Path) -> list[dict[str, Any]]:
    relative = path.relative_to(root)
    if is_reference_data(relative):
        return []

    region, commune = parse_scope(relative)
    suffix = path.suffix.lower()
    if suffix == ".gpkg":
        rows = base.inspect_geopackage(path, relative, region, commune)
    elif suffix == ".shp":
        rows = base.inspect_shapefile(path, relative, region, commune)
    elif suffix in {".geojson", ".json"}:
        rows = base.inspect_geojson(path, relative, region, commune)
    else:
        rows = base.inspect_generic(path, relative, region, commune)

    # Algunos GPKG de referencia solo se identifican al conocer el nombre interno de capa.
    return [row for row in rows if not is_reference_data(relative, str(row.get("capa") or ""))]


def locality_score_v2(layer: dict[str, Any], instrument: dict[str, Any]) -> float:
    region_score = base.text_similarity(layer.get("region", ""), instrument.get("region", ""))
    if region_score < 0.55:
        return 0.0

    commune = str(layer.get("comuna") or "").strip()
    detected_type = str(layer.get("tipo_ipt_detectado") or "").upper()

    # PRI/PRM/PRDU cubren varias comunas. La vinculación se apoya en región + tipo + nombre.
    if not commune or commune in {"Cobertura regional", "Cobertura nacional"}:
        if detected_type == "LU":
            # Un único archivo regional de límites puede contener muchas comunas: no lo forzamos a un registro.
            return 0.0
        return 0.36 * region_score

    commune_score = base.text_similarity(commune, instrument.get("comuna", ""))
    if commune_score < 0.72:
        return 0.0
    return 0.55 * commune_score + 0.20 * region_score


# Aplicamos las correcciones a las funciones que el inspector base usa internamente.
base.detect_zone_field = detect_zone_field_v2
base.detect_ipt_type = detect_ipt_type_v2
base.read_crs_from_prj = read_crs_from_prj_v2
base.inspect_file = inspect_file_v2
base.locality_score = locality_score_v2


if __name__ == "__main__":
    raise SystemExit(base.main())
