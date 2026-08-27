from __future__ import annotations

import json
from typing import Any

from core.vocabulary import (
    EVENT_TYPES,
    IMPACT_LEVELS,
    MARKET_SEGMENTS,
    RECOMMENDED_ACTIONS,
    RELEVANCE_LEVELS,
    TERRITORY_SCALES,
)


def _choices(values: set[str]) -> str:
    return ", ".join(sorted(values))


def build_event_analysis_prompt(
    metadata: dict[str, Any],
    text: str,
    max_input_characters: int,
) -> str:
    trimmed_text = text.strip()[:max_input_characters]
    metadata_json = json.dumps(metadata, ensure_ascii=False, indent=2)

    return f"""
Eres el motor de análisis PRELIMINAR de Transsa Urban Intelligence.
La plataforma apoya a analistas, tasadores, arquitectos, consultores y gerencia.
No replica el visor de Propiteq: detecta cambios, explica contexto y sugiere seguimiento.

Analiza exclusivamente la información entregada. No inventes comunas, regiones,
fechas, proyectos, cifras, actores ni consecuencias. Cuando un dato no esté explícito,
usa cadena vacía, lista vacía o "undetermined", y marca requires_review cuando sea
necesario verificarlo.

El contenido puede corresponder a normativa, noticias, mercado inmobiliario,
desarrollo urbano, vivienda, infraestructura, evaluación ambiental, indicadores,
proyectos o informes. La relevancia se evalúa para el trabajo de Transsa.

Valores controlados:
- event_type: {_choices(EVENT_TYPES)}
- relevance_level: {_choices(RELEVANCE_LEVELS)}
- impact_level: {_choices(IMPACT_LEVELS)}
- territory.scale: {_choices(TERRITORY_SCALES)}
- recommended_action_code: {_choices(RECOMMENDED_ACTIONS)}
- market_segments: {_choices(MARKET_SEGMENTS)}
- review_status: preliminary o requires_review

Responde SOLO con un objeto JSON válido con estas claves exactas:
{{
  "es_relevante": true,
  "event_type": "news",
  "summary": "",
  "why_it_matters": "",
  "practical_implications": "",
  "impacted_parties": "",
  "recommended_action": "",
  "recommended_action_code": "monitor",
  "relevance_level": "medium",
  "impact_level": "unknown",
  "confidence": 0.0,
  "review_status": "preliminary",
  "requires_review_reason": "",
  "category": "",
  "topics": [],
  "market_segments": [],
  "actors": [],
  "projects": [],
  "tags": [],
  "official_act": {{
    "official_issuer": "",
    "publication_source": "Diario Oficial de la República de Chile",
    "act_type": "",
    "act_number": "",
    "act_date": "",
    "procedure_stage": "",
    "participation_days": null,
    "participation_start_rule": "",
    "legal_basis": "",
    "project_name": "",
    "project_holder": "",
    "project_description": "",
    "location_detail": ""
  }},
  "territory": {{
    "scale": "undetermined",
    "country": "Chile",
    "region": "",
    "commune": "",
    "province": "",
    "locality": ""
  }}
}}

Criterios de redacción:
- summary: qué ocurrió, sin opinión.
- why_it_matters: por qué importa para comprender territorio, mercado o negocio.
- practical_implications: consecuencias procedimentales u operativas directamente sustentadas por el texto. Evita frases vagas como "afecta la percepción".
- recommended_action: acción concreta, prudente y verificable para el equipo.
- official_act: extrae literalmente el organismo que dicta el acto, tipo, número, fecha, etapa del procedimiento, plazo, regla de inicio del cómputo, base legal, proyecto, titular/proponente, descripción concreta de obras o capacidades y ubicación. No confundas el Diario Oficial (medio de publicación) con el organismo emisor.
- Si se abre participación ciudadana en una DIA, describe la etapa como apertura de participación ciudadana dentro de una evaluación ambiental ya en curso; nunca digas que recién comienza toda la evaluación.
- Usa tiempo verbal presente o pasado para actos ya publicados: "quedó abierto" o "abrió". No escribas "se abrirá".
- why_it_matters debe destacar antecedentes concretos del proyecto (capacidad, obras, infraestructura, vida útil, segmento) y evitar expresiones genéricas como "afecta la percepción".
- requires_review_reason: solo menciona campos concretos faltantes o contradictorios; no uses razones genéricas.
- confidence: número entre 0 y 1.
- Si la publicación no es relevante, conserva es_relevante=false, relevancia low y
  recomienda no_action; aun así resume brevemente el contenido.
- No marques un evento como validado. Ollama solo produce análisis preliminar.

METADATOS:
{metadata_json}

TEXTO FUENTE:
{trimmed_text}
""".strip()
