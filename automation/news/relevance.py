from __future__ import annotations

import re
from dataclasses import dataclass, field

from .normalization import normalize_text


@dataclass(slots=True)
class RelevanceResult:
    score: int
    level: str
    is_candidate: bool
    categories: list[str] = field(default_factory=list)
    matched_terms: list[str] = field(default_factory=list)
    negative_terms: list[str] = field(default_factory=list)
    requires_review: bool = False


WEIGHTED_TERMS: dict[str, dict[str, int]] = {
    "mercado_inmobiliario": {
        "mercado inmobiliario": 8,
        "venta de viviendas": 7,
        "ventas de viviendas": 7,
        "arriendo": 4,
        "arriendos": 4,
        "precio de vivienda": 6,
        "precios de viviendas": 6,
        "valor de suelo": 7,
        "mercado de suelo": 8,
        "credito hipotecario": 7,
        "tasa hipotecaria": 7,
        "subsidio a la tasa": 6,
        "stock de viviendas": 7,
        "oferta inmobiliaria": 7,
        "demanda inmobiliaria": 7,
        "multifamily": 7,
    },
    "inversion_y_proyectos": {
        "proyecto inmobiliario": 9,
        "proyecto habitacional": 8,
        "nuevo proyecto": 4,
        "inversion inmobiliaria": 9,
        "inversion de": 3,
        "plan de inversion": 7,
        "centro comercial": 7,
        "parque industrial": 8,
        "centro logistico": 8,
        "bodega": 4,
        "bodegas": 4,
        "data center": 7,
        "hotel": 4,
        "oficinas clase a": 7,
        "permisos de edificacion": 9,
        "permiso de edificacion": 9,
    },
    "planificacion_y_normativa": {
        "plan regulador": 10,
        "planes reguladores": 10,
        "modificacion de plan regulador": 12,
        "modificacion de planes reguladores": 12,
        "instrumento de planificacion territorial": 10,
        "instrumentos de planificacion territorial": 10,
        "limite urbano": 9,
        "uso de suelo": 8,
        "zonificacion": 8,
        "normativa urbana": 9,
        "ordenanza local": 8,
        "plan seccional": 9,
    },
    "desarrollo_urbano": {
        "desarrollo urbano": 9,
        "renovacion urbana": 8,
        "regeneracion urbana": 8,
        "expansion urbana": 8,
        "densificacion": 7,
        "plan maestro": 5,
        "barrio": 3,
        "espacio publico": 6,
        "equipamiento urbano": 7,
        "urbanizacion": 7,
    },
    "infraestructura": {
        "infraestructura": 5,
        "metro": 5,
        "ferrocarril": 6,
        "tren": 4,
        "terminal portuario": 8,
        "puerto": 5,
        "aeropuerto": 6,
        "autopista": 6,
        "carretera": 5,
        "concesion": 4,
        "hospital": 4,
        "embalse": 5,
        "planta desaladora": 7,
        "desaladora": 6,
        "transporte publico": 6,
        "movilidad urbana": 8,
    },
    "vivienda_y_construccion": {
        "vivienda": 4,
        "deficit habitacional": 9,
        "vivienda social": 8,
        "subsidio habitacional": 8,
        "construccion": 4,
        "costos de construccion": 8,
        "materiales de construccion": 7,
        "industrializacion": 5,
        "prefabricacion": 5,
        "edificacion": 5,
        "recepcion definitiva": 8,
    },
    "economia_urbana": {
        "actividad de la construccion": 8,
        "inversion en construccion": 8,
        "empleo en construccion": 7,
        "vacancia": 6,
        "absorcion": 5,
        "rentabilidad": 5,
        "cap rate": 7,
        "plusvalia": 5,
        "uf por metro cuadrado": 8,
        "uf m2": 8,
    },
}

NEGATIVE_TERMS: dict[str, int] = {
    "futbol": -8,
    "campeonato": -5,
    "seleccion chilena": -7,
    "receta": -6,
    "horoscopo": -10,
    "farandula": -8,
    "espectaculos": -6,
    "celebridad": -5,
    "video viral": -6,
    "accidente de transito": -3,
    "policial": -4,
}

HIGH_SIGNAL_TERMS = {
    "plan regulador",
    "planes reguladores",
    "permiso de edificacion",
    "permisos de edificacion",
    "proyecto inmobiliario",
    "inversion inmobiliaria",
    "mercado inmobiliario",
    "deficit habitacional",
    "uso de suelo",
    "instrumento de planificacion territorial",
}


def contains_term(text: str, term: str) -> bool:
    """Busca términos completos y evita coincidencias internas.

    Ejemplos: ``metro`` no coincide con ``metropolitana`` y ``puerto``
    no coincide con ``aeropuerto``.
    """
    normalized_term = normalize_text(term)
    if not normalized_term:
        return False
    pattern = r"(?<![a-z0-9])" + r"\s+".join(
        re.escape(token) for token in normalized_term.split()
    ) + r"(?![a-z0-9])"
    return re.search(pattern, text) is not None


def _level(score: int) -> str:
    if score >= 18:
        return "high"
    if score >= 10:
        return "medium"
    if score >= 5:
        return "low"
    return "discard"


def score_relevance(title: str, excerpt: str = "", *, source_priority: int = 50) -> RelevanceResult:
    text = normalize_text(f"{title} {excerpt}")
    score = max(0, min(3, round((source_priority - 50) / 20)))
    categories: list[str] = []
    matched: list[str] = []

    for category, terms in WEIGHTED_TERMS.items():
        category_score = 0
        for term, weight in terms.items():
            if contains_term(text, term):
                category_score += weight
                matched.append(term)
        if category_score:
            categories.append(category)
            score += category_score

    negative: list[str] = []
    for term, penalty in NEGATIVE_TERMS.items():
        if contains_term(text, term):
            score += penalty
            negative.append(term)

    score = max(0, score)
    level = _level(score)
    high_signal = any(contains_term(text, term) for term in HIGH_SIGNAL_TERMS)
    is_candidate = score >= 8 or high_signal
    requires_review = is_candidate and level == "low"

    return RelevanceResult(
        score=score,
        level=level,
        is_candidate=is_candidate,
        categories=categories,
        matched_terms=sorted(set(matched)),
        negative_terms=negative,
        requires_review=requires_review,
    )
