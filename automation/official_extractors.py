from __future__ import annotations

import re
import unicodedata
from datetime import datetime
from typing import Any

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5,
    "junio": 6, "julio": 7, "agosto": 8, "septiembre": 9,
    "octubre": 10, "noviembre": 11, "diciembre": 12,
}

REGION_ALIASES = {
    "metropolitana": "Región Metropolitana de Santiago",
    "region metropolitana": "Región Metropolitana de Santiago",
    "region metropolitana de santiago": "Región Metropolitana de Santiago",
    "biobio": "Región del Biobío",
    "region del biobio": "Región del Biobío",
    "región del biobío": "Región del Biobío",
}


def _compact(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _ascii_lower(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in normalized if not unicodedata.combining(c)).lower().strip()


def normalize_region(value: str) -> str:
    cleaned = _compact(value).strip(" ,.;")
    if not cleaned:
        return ""
    return REGION_ALIASES.get(_ascii_lower(cleaned), cleaned)


def _date_iso(day: str, month: str, year: str) -> str:
    month_number = MONTHS.get(_ascii_lower(month))
    if not month_number:
        return ""
    try:
        return datetime(int(year), month_number, int(day)).date().isoformat()
    except ValueError:
        return ""


def _first(patterns: list[str], text: str, flags: int = re.IGNORECASE) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, flags)
        if match:
            return _compact(match.group(1))
    return ""


def _clean_project_description(value: str) -> str:
    value = _compact(value).strip(" .")
    if not value:
        return ""
    # Evita que el bloque de descripción absorba encabezados posteriores.
    value = re.split(
        r"\b(?:Que, esta Dirección|En virtud de lo anterior|Para conocimiento de la comunidad|El texto íntegro)\b",
        value,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" .")
    return value + "." if value else ""


def _extract_legal_basis(source: str) -> str:
    items: list[str] = []
    if re.search(r"art[ií]culo\s+30\s+bis\s+de\s+la\s+ley\s+N[°º.]?\s*19\.300", source, re.I):
        items.append("Artículo 30 bis de la Ley N.º 19.300")

    has_94 = bool(re.search(r"art[ií]culos?\s+(?:30\s+bis[,;]?\s+y\s+)?94\b|art[ií]culos?\s+94\b", source, re.I))
    has_95 = bool(re.search(r"art[ií]culos?\s+(?:94\s+y\s+)?95\b|art[ií]culo\s+95\b", source, re.I))
    has_ds_40 = bool(re.search(r"DS\s+N[°º.]?\s*40/2012", source, re.I))
    if has_ds_40 and has_94 and has_95:
        items.append("Artículos 94 y 95 del DS N.º 40/2012 (Reglamento del SEIA)")
    elif has_ds_40 and has_94:
        items.append("Artículo 94 del DS N.º 40/2012 (Reglamento del SEIA)")
    elif has_ds_40 and has_95:
        items.append("Artículo 95 del DS N.º 40/2012 (Reglamento del SEIA)")

    return "; ".join(items)


def _extract_participation_start_rule(source: str) -> str:
    if re.search(
        r"contados?\s+(?:a partir\s+)?del\s+d[ií]a\s+h[aá]bil\s+siguiente\s+(?:de|a)\s+la\s+presente\s+publicaci[oó]n",
        source,
        re.I,
    ):
        return "Desde el día hábil siguiente a la publicación en el Diario Oficial"
    if re.search(r"contados?\s+desde\s+la\s+presente\s+publicaci[oó]n", source, re.I):
        return "Desde la fecha de publicación en el Diario Oficial"
    return ""


def _extract_project_description(source: str) -> str:
    description = _first(
        [
            r"(?:este|el proyecto)\s+consiste\s+en\s+(.+?)(?=\s+y\s+se\s+encuentra\s+ubicado\s+en|\s+Que,\s+esta\s+Direcci[oó]n|\s+En\s+virtud\s+de\s+lo\s+anterior|\s+El\s+texto\s+[ií]ntegro|$)",
            r"El objetivo central del Proyecto es\s+(.+?)(?=\s+Para\s+conocimiento\s+de\s+la\s+comunidad|\s+El\s+texto\s+[ií]ntegro|$)",
        ],
        source,
    )
    return _clean_project_description(description)


def extract_official_fields(text: str, title: str = "") -> dict[str, Any]:
    """Extrae campos verificables de actos del Diario Oficial.

    La función es deliberadamente conservadora: solo completa valores presentes
    de forma explícita en el texto fuente.
    """
    source = _compact(text)
    result: dict[str, Any] = {
        "official_issuer": "",
        "publication_source": "Diario Oficial de la República de Chile",
        "act_type": "",
        "act_number": "",
        "act_date": "",
        "procedure_stage": "",
        "participation_days": None,
        "participation_start_rule": "",
        "legal_basis": "",
        "project_name": "",
        "project_holder": "",
        "project_description": "",
        "location_detail": "",
        "region": "",
        "commune": "",
        "province": "",
    }

    sea_region = _first(
        [r"Servicio de Evaluaci[oó]n Ambiental\s*/\s*([^\n]+?)\s+NOTIFICA"],
        text,
    )
    if sea_region:
        region = normalize_region(sea_region)
        result["region"] = region
        result["official_issuer"] = f"Servicio de Evaluación Ambiental de la {region}"
        result["act_type"] = "Resolución exenta"

    act_number = _first([
        r"resoluci[oó]n exenta\s+N[°º]\s*([0-9A-Za-z.-]+)",
        r"resoluci[oó]n exenta\s+n[uú]mero\s+([0-9A-Za-z.-]+)",
    ], source)
    result["act_number"] = act_number

    date_match = re.search(
        r"(?:del|de fecha)\s+(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(20\d{2})",
        source,
        re.IGNORECASE,
    )
    if date_match:
        result["act_date"] = _date_iso(*date_match.groups())

    if re.search(r"dar inicio a un proceso de participaci[oó]n ciudadana", source, re.I):
        result["procedure_stage"] = (
            "Apertura de participación ciudadana dentro de una evaluación ambiental en curso"
        )

    days = _first([r"plazo de\s+(\d+)\s+d[ií]as h[aá]biles"], source)
    result["participation_days"] = int(days) if days.isdigit() else None
    result["participation_start_rule"] = _extract_participation_start_rule(source)
    result["legal_basis"] = _extract_legal_basis(source)

    project = _first([
        r"proyecto denominado\s+[“\"]([^”\"]+)[”\"]",
        r"Declaraci[oó]n de Impacto Ambiental del Proyecto:\s*[“\"]([^”\"]+)[”\"]",
        r"DECLARACI[ÓO]N DE IMPACTO AMBIENTAL (?:DEL )?PROYECTO:\s*[“\"]([^”\"]+)[”\"]",
    ], source)
    if not project:
        project = _first([r"proyecto:\s*[“\"]([^”\"]+)[”\"]"], title or source)
    result["project_name"] = project

    holder = _first([
        r"cuyo Titular es\s+(.+?)(?:\.\s+Que,|\s+y se encuentra|\s+El Proyecto)",
        r"cuyo proponente es\s+(.+?)(?:\.\s+El Proyecto|\s+El Proyecto)",
    ], source)
    holder = holder.rstrip(" .")
    result["project_holder"] = holder
    result["project_description"] = _extract_project_description(source)

    commune = _first([r"comuna de\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+?)(?:,|\.| Región| provincia)"], source)
    province = _first([r"provincia de\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+?)(?:,|\.| Región)"], source)
    region = _first([r"Regi[oó]n (?:del|de la|de)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+?)(?:\.|,|$)"], source)
    if region and not result["region"]:
        prefix = "Región del " if _ascii_lower(region) == "biobio" else "Región de "
        result["region"] = normalize_region(prefix + region)
    result["commune"] = commune
    result["province"] = province

    location = _first([
        r"se encuentra ubicado en\s+(.+?)(?:\. Que,|\. En virtud|\.)",
        r"se pretende localizar en\s+(.+?)(?:\. Corresponde|\.)",
    ], source)
    result["location_detail"] = location

    return result


def _description_as_reason(description: str) -> str:
    value = _compact(description).strip(" .")
    if not value:
        return ""
    value = re.sub(r"^(?:El proyecto\s+)?(?:consiste en|contempla)\s+", "", value, flags=re.I)
    value = re.sub(r"^El objetivo central del proyecto es\s+", "", value, flags=re.I)
    if value:
        value = value[0].lower() + value[1:]
    return value


def build_environmental_intelligence(fields: dict[str, Any], text: str) -> dict[str, str]:
    """Genera redacción procedimental verificable para aperturas PAC de una DIA.

    Se usa como corrección de alta precisión sobre la redacción libre de Ollama.
    No introduce cifras ni obras que no estén presentes en el texto fuente.
    """
    if not fields.get("procedure_stage"):
        return {}

    source_ascii = _ascii_lower(text)
    description = _description_as_reason(str(fields.get("project_description") or ""))

    why = (
        "La publicación abre una etapa de participación ciudadana dentro de una "
        "evaluación ambiental que ya se encuentra en curso."
    )
    if description:
        why += f" El proyecto es relevante porque contempla {description}."

    days = fields.get("participation_days")
    start_rule = str(fields.get("participation_start_rule") or "").strip()
    practical = "El proceso de participación ciudadana quedó abierto"
    if days:
        practical += f" por {days} días hábiles"
    if start_rule:
        practical += f", computados {start_rule[0].lower() + start_rule[1:]}"
    practical += (
        ". Durante ese periodo, la comunidad y las personas interesadas podrán "
        "presentar observaciones ante el Servicio de Evaluación Ambiental."
    )

    if any(token in source_ascii for token in ("puerto", "dragado", "muelle", "contenedores", "centro logistico")):
        action = (
            "Monitorear la evaluación ambiental, los plazos del proyecto y las eventuales "
            "condiciones aplicables a los dragados y adecuaciones portuarias; seguir sus "
            "efectos sobre la actividad logística, el transporte y la demanda de infraestructura "
            "en el territorio afectado."
        )
    elif any(token in source_ascii for token in ("acero", "planta", "produccion", "aceria", "laminacion")):
        action = (
            "Monitorear las observaciones ciudadanas y la evolución de la evaluación ambiental; "
            "registrar eventuales medidas o condiciones que afecten la ampliación industrial, "
            "sus obras asociadas y su relación con los usos cercanos."
        )
    else:
        action = (
            "Monitorear las observaciones ciudadanas, la evolución de la evaluación ambiental "
            "y las eventuales medidas o condiciones que puedan incidir en la ejecución del proyecto."
        )

    return {
        "why_it_matters": why,
        "practical_implications": practical,
        "recommended_action": action,
    }


def concrete_review_reason(fields: dict[str, Any], territory: dict[str, Any]) -> str:
    missing: list[str] = []
    if fields.get("act_type") and not fields.get("act_number"):
        missing.append("número del acto")
    if fields.get("act_type") and not fields.get("act_date"):
        missing.append("fecha del acto")
    if fields.get("procedure_stage") and not fields.get("official_issuer"):
        missing.append("organismo emisor")
    if fields.get("procedure_stage") and not fields.get("participation_days"):
        missing.append("plazo de participación ciudadana")
    if territory.get("scale") in {"communal", "local"} and not territory.get("commune"):
        missing.append("comuna afectada")
    if territory.get("scale") == "regional" and not territory.get("region"):
        missing.append("región afectada")
    if not missing:
        return ""
    return "Falta confirmar en la fuente: " + ", ".join(missing) + "."
