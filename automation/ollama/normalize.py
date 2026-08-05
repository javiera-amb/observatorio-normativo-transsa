from __future__ import annotations

import re
import unicodedata
from typing import Any

from core.vocabulary import (
    EVENT_TYPES,
    IMPACT_LEVELS,
    MARKET_SEGMENTS,
    RECOMMENDED_ACTIONS,
    RELEVANCE_LEVELS,
    TERRITORY_SCALES,
)


EVENT_ALIASES = {
    "regulacion_urbana": "normative_update",
    "cambio_normativo": "normative_update",
    "normativa": "normative_update",
    "noticia": "news",
    "senal_de_mercado": "market_signal",
    "proyecto_urbano": "urban_project",
    "evaluacion_ambiental": "environmental_assessment",
    "infraestructura_urbana": "infrastructure",
    "indicador": "indicator",
    "informe": "report",
    "fallo_judicial": "court_ruling",
    "politica_publica": "public_policy",
}

ACTION_ALIASES = {
    "sin_accion": "no_action",
    "no_requiere_accion": "no_action",
    "monitorear": "monitor",
    "revisar_fuente": "review_source",
    "actualizar_base": "update_database",
    "actualizar_cartografia": "update_cartography",
    "revisar_impacto_mercado": "review_market_impact",
    "asignar_tarea": "assign_task",
    "notificar_equipo": "notify_team",
    "publicar_en_propiteq": "publish_to_propiteq",
    "publicar_en_propitaq": "publish_to_propiteq",
}

SCALE_ALIASES = {
    "nacional": "national",
    "regional": "regional",
    "interregional": "interregional",
    "provincial": "provincial",
    "intercomunal": "intercommunal",
    "comunal": "communal",
    "local": "local",
    "multiple": "multiple",
    "sin_determinar": "undetermined",
}

LEVEL_ALIASES = {
    "bajo": "low",
    "baja": "low",
    "medio": "medium",
    "media": "medium",
    "alto": "high",
    "alta": "high",
    "critico": "critical",
    "critica": "critical",
    "desconocido": "unknown",
    "desconocida": "unknown",
}

SEGMENT_ALIASES = {
    "residential": "residencial",
    "office": "oficinas",
    "offices": "oficinas",
    "industrial_logistics": "logistica",
    "logistics": "logistica",
    "warehousing": "bodegaje",
    "hotel": "hotelero",
    "land": "suelo",
    "infrastructure": "infraestructura",
    "mixed": "mixto",
    "not_applicable": "no_aplica",
}


def slug(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        items = re.split(r"[,;\n]", value)
    elif isinstance(value, (list, tuple, set)):
        items = list(value)
    else:
        items = [value]
    result: list[str] = []
    for item in items:
        text = str(item or "").strip()
        if text and text not in result:
            result.append(text)
    return result


def controlled(value: Any, allowed: set[str], default: str, aliases: dict[str, str] | None = None) -> str:
    normalized = slug(value)
    aliases = aliases or {}
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in allowed else default


def boolean(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return slug(value) in {"true", "verdadero", "si", "yes", "1"}


def confidence(value: Any) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, parsed))


def normalize_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    relevant = boolean(payload.get("es_relevante", True))
    territory_raw = payload.get("territory") or payload.get("territorio") or {}
    if not isinstance(territory_raw, dict):
        territory_raw = {}

    territory = {
        "scale": controlled(
            territory_raw.get("scale") or territory_raw.get("escala"),
            TERRITORY_SCALES,
            "undetermined",
            SCALE_ALIASES,
        ),
        "country": str(territory_raw.get("country") or territory_raw.get("pais") or "Chile").strip(),
        "region": str(territory_raw.get("region") or "").strip(),
        "commune": str(territory_raw.get("commune") or territory_raw.get("comuna") or "").strip(),
        "province": str(territory_raw.get("province") or territory_raw.get("provincia") or "").strip(),
        "locality": str(territory_raw.get("locality") or territory_raw.get("localidad") or "").strip(),
    }

    status = controlled(
        payload.get("review_status") or payload.get("estado_revision"),
        {"preliminary", "requires_review"},
        "preliminary",
        {"preliminar": "preliminary", "requiere_revision": "requires_review"},
    )
    reason = str(payload.get("requires_review_reason") or payload.get("motivo_revision") or "").strip()

    if reason:
        status = "requires_review"

    if relevant and territory["scale"] == "undetermined":
        status = "requires_review"
        if not reason:
            reason = "El texto no permite determinar con certeza el territorio afectado."

    if relevant and territory["scale"] in {"communal", "local"} and not territory["commune"]:
        status = "requires_review"
        if not reason:
            reason = "La escala es comunal o local, pero la comuna afectada no está identificada."

    if relevant and territory["scale"] == "regional" and not territory["region"]:
        status = "requires_review"
        if not reason:
            reason = "La escala es regional, pero la región afectada no está identificada."

    if status == "requires_review" and not reason:
        reason = "El análisis automático contiene información que debe verificarse en la fuente."

    segments: list[str] = []
    for item in string_list(payload.get("market_segments") or payload.get("segmentos_mercado")):
        normalized = controlled(item, MARKET_SEGMENTS, "", SEGMENT_ALIASES)
        if normalized and normalized not in segments:
            segments.append(normalized)

    relevance = controlled(
        payload.get("relevance_level") or payload.get("relevancia"),
        RELEVANCE_LEVELS,
        "medium" if relevant else "low",
        LEVEL_ALIASES,
    )
    if not relevant:
        relevance = "low"

    action_code = controlled(
        payload.get("recommended_action_code") or payload.get("codigo_accion"),
        RECOMMENDED_ACTIONS,
        "monitor" if relevant else "no_action",
        ACTION_ALIASES,
    )

    official_raw = payload.get("official_act") or payload.get("acto_oficial") or {}
    if not isinstance(official_raw, dict):
        official_raw = {}
    participation_raw = official_raw.get("participation_days") or official_raw.get("dias_participacion")
    try:
        participation_days = int(participation_raw) if participation_raw not in (None, "") else None
    except (TypeError, ValueError):
        participation_days = None
    official_act = {
        "official_issuer": str(official_raw.get("official_issuer") or official_raw.get("organismo_emisor") or "").strip(),
        "publication_source": str(official_raw.get("publication_source") or official_raw.get("fuente_publicacion") or "Diario Oficial de la República de Chile").strip(),
        "act_type": str(official_raw.get("act_type") or official_raw.get("tipo_acto") or "").strip(),
        "act_number": str(official_raw.get("act_number") or official_raw.get("numero_acto") or "").strip(),
        "act_date": str(official_raw.get("act_date") or official_raw.get("fecha_acto") or "").strip(),
        "procedure_stage": str(official_raw.get("procedure_stage") or official_raw.get("etapa_procedimiento") or "").strip(),
        "participation_days": participation_days,
        "participation_start_rule": str(official_raw.get("participation_start_rule") or official_raw.get("inicio_computo_plazo") or "").strip(),
        "legal_basis": str(official_raw.get("legal_basis") or official_raw.get("base_legal") or "").strip(),
        "project_name": str(official_raw.get("project_name") or official_raw.get("nombre_proyecto") or "").strip(),
        "project_holder": str(official_raw.get("project_holder") or official_raw.get("titular_proyecto") or "").strip(),
        "project_description": str(official_raw.get("project_description") or official_raw.get("descripcion_proyecto") or "").strip(),
        "location_detail": str(official_raw.get("location_detail") or official_raw.get("detalle_ubicacion") or "").strip(),
    }
    if not relevant:
        action_code = "no_action"

    return {
        "es_relevante": relevant,
        "event_type": controlled(
            payload.get("event_type") or payload.get("tipo_evento"),
            EVENT_TYPES,
            "other",
            EVENT_ALIASES,
        ),
        "summary": str(payload.get("summary") or payload.get("resumen") or "").strip(),
        "why_it_matters": str(payload.get("why_it_matters") or payload.get("por_que_importa") or "").strip(),
        "practical_implications": str(
            payload.get("practical_implications") or payload.get("implicancias_practicas") or ""
        ).strip(),
        "impacted_parties": str(payload.get("impacted_parties") or payload.get("actores_impactados") or "").strip(),
        "recommended_action": str(payload.get("recommended_action") or payload.get("accion_sugerida") or payload.get("accion_recomendada") or "").strip(),
        "recommended_action_code": action_code,
        "relevance_level": relevance,
        "impact_level": controlled(
            payload.get("impact_level") or payload.get("impacto"),
            IMPACT_LEVELS,
            "unknown",
            LEVEL_ALIASES,
        ),
        "confidence": confidence(payload.get("confidence", payload.get("confianza"))),
        "review_status": status,
        "requires_review_reason": reason,
        "category": slug(payload.get("category") or payload.get("categoria") or "otros") or "otros",
        "topics": [slug(item) for item in string_list(payload.get("topics") or payload.get("temas")) if slug(item)],
        "market_segments": segments,
        "actors": string_list(payload.get("actors") or payload.get("actores")),
        "projects": string_list(payload.get("projects") or payload.get("proyectos")),
        "tags": [slug(item) for item in string_list(payload.get("tags") or payload.get("etiquetas")) if slug(item)],
        "territory": territory,
        "official_act": official_act,
    }
