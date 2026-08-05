from __future__ import annotations

import re
import unicodedata
from typing import Any

from core.vocabulary import EVENT_TYPES


def _plain(value: Any) -> str:
    text = str(value or "").lower().strip()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text)


def _contains_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


ENVIRONMENTAL_PHRASES = (
    "servicio de evaluacion ambiental",
    "declaracion de impacto ambiental",
    "estudio de impacto ambiental",
    "calificacion ambiental",
    "resolucion de calificacion ambiental",
    "participacion ciudadana",
    "evaluacion ambiental",
)

NORMATIVE_PHRASES = (
    "plan regulador comunal",
    "plan regulador intercomunal",
    "plan regulador metropolitano",
    "plan seccional",
    "instrumento de planificacion territorial",
    "limite urbano",
    "zonificacion",
    "uso de suelo",
    "usos de suelo",
    "ordenanza general de urbanismo y construcciones",
    "ley general de urbanismo y construcciones",
    "permiso de edificacion",
    "recepcion definitiva",
    "subdivision predial",
    "urbanizacion",
    "enmienda al plan regulador",
    "modificacion al plan regulador",
    "modifica el plan regulador",
)

INDICATOR_PHRASES = (
    "indice de precios",
    "indice de costos",
    "permiso de edificacion otorgado",
    "superficie autorizada",
    "ventas de viviendas",
    "tasa de vacancia",
    "valor de arriendo",
    "precio de vivienda",
)

INFRASTRUCTURE_PHRASES = (
    "linea de metro",
    "estacion de metro",
    "carretera",
    "autopista",
    "aeropuerto",
    "puerto",
    "terminal intermodal",
    "hospital",
    "infraestructura urbana",
)

URBAN_PROJECT_PHRASES = (
    "proyecto inmobiliario",
    "desarrollo inmobiliario",
    "nuevo conjunto habitacional",
    "centro comercial",
    "parque industrial",
    "proyecto urbano",
    "loteo",
)

MARKET_SIGNAL_PHRASES = (
    "aumento de ventas",
    "caida de ventas",
    "vacancia",
    "absorcion",
    "plusvalia",
    "precio promedio",
    "valor de mercado",
    "demanda inmobiliaria",
    "oferta inmobiliaria",
)

REPORT_PHRASES = (
    "informe de mercado",
    "estudio de mercado",
    "reporte trimestral",
    "reporte anual",
    "balance inmobiliario",
)


def infer_event_type(
    ai_event_type: str,
    metadata: dict[str, Any],
    text: str,
) -> tuple[str, str]:
    """Combina la salida de Ollama con reglas determinísticas de alta precisión.

    Las reglas solo reemplazan la clasificación de la IA cuando existe una señal
    explícita y suficientemente fuerte. La función devuelve el tipo final y una
    breve razón técnica para trazabilidad.
    """

    title = _plain(metadata.get("title") or metadata.get("titulo"))
    source = metadata.get("source") or metadata.get("fuente") or {}
    if isinstance(source, str):
        source = {"source_name": source}
    source_name = _plain(source.get("source_name") or source.get("fuente"))
    source_type = _plain(source.get("source_type") or source.get("tipo_fuente"))
    document_type = _plain(source.get("document_type") or source.get("tipo_documento"))
    combined = " ".join(part for part in (title, source_name, document_type, _plain(text)) if part)

    if _contains_any(combined, ENVIRONMENTAL_PHRASES):
        return "environmental_assessment", "Regla de alta precisión: evaluación ambiental explícita."

    if _contains_any(combined, NORMATIVE_PHRASES):
        return "normative_update", "Regla de alta precisión: instrumento o acto urbanístico explícito."

    if _contains_any(combined, INDICATOR_PHRASES) and source_name in {
        "ine",
        "instituto nacional de estadisticas",
        "banco central de chile",
    }:
        return "indicator", "Regla de alta precisión: indicador oficial explícito."

    if _contains_any(combined, REPORT_PHRASES):
        return "report", "Regla de alta precisión: informe o estudio identificado."

    if _contains_any(combined, INFRASTRUCTURE_PHRASES):
        return "infrastructure", "Regla temática: infraestructura urbana o territorial explícita."

    if _contains_any(combined, URBAN_PROJECT_PHRASES):
        return "urban_project", "Regla temática: proyecto urbano o inmobiliario explícito."

    if _contains_any(combined, MARKET_SIGNAL_PHRASES):
        return "market_signal", "Regla temática: señal de mercado explícita."

    normalized_ai = ai_event_type if ai_event_type in EVENT_TYPES else "other"
    if normalized_ai != "other":
        return normalized_ai, "Clasificación preliminar propuesta por Ollama."

    if source_type == "news_media":
        return "news", "Regla de respaldo: fuente periodística sin tipo más específico."

    return "other", "No se encontró una señal suficiente para clasificar el evento."
