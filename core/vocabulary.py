from __future__ import annotations

"""Vocabulario controlado de Transsa Urban Intelligence.

Los valores se guardan en formato snake_case para mantener estabilidad técnica.
La interfaz puede traducirlos a etiquetas legibles en español.
"""

EVENT_TYPES = {
    "normative_update",
    "news",
    "market_signal",
    "urban_project",
    "environmental_assessment",
    "infrastructure",
    "indicator",
    "report",
    "court_ruling",
    "public_policy",
    "daily_review",
    "other",
}

REVIEW_STATUSES = {
    "detected",
    "extracted",
    "classified",
    "preliminary",
    "requires_review",
    "validated",
    "discarded",
    "error",
}

RELEVANCE_LEVELS = {"low", "medium", "high", "critical"}
IMPACT_LEVELS = {"low", "medium", "high", "critical", "unknown"}

TERRITORY_SCALES = {
    "national",
    "regional",
    "interregional",
    "provincial",
    "intercommunal",
    "communal",
    "local",
    "multiple",
    "undetermined",
}

SOURCE_TYPES = {
    "official",
    "news_media",
    "industry_association",
    "consultancy",
    "academic",
    "municipal",
    "regional_government",
    "company",
    "other",
}

RELIABILITY_LEVELS = {"primary", "high", "medium", "low", "unknown"}

TOPIC_FAMILIES = {
    "normativa",
    "mercado",
    "desarrollo_urbano",
    "infraestructura",
    "vivienda",
    "medio_ambiente",
    "patrimonio",
    "economia",
    "demografia",
    "gestion_interna",
    "otros",
}

MARKET_SEGMENTS = {
    "residencial",
    "oficinas",
    "retail",
    "industrial",
    "logistica",
    "bodegaje",
    "hotelero",
    "multifamily",
    "suelo",
    "equipamiento",
    "infraestructura",
    "mixto",
    "no_aplica",
}

RECOMMENDED_ACTIONS = {
    "no_action",
    "monitor",
    "review_source",
    "update_database",
    "update_cartography",
    "review_market_impact",
    "assign_task",
    "notify_team",
    "publish_to_propiteq",
    "publish_to_propitaq",  # compatibilidad con versiones anteriores
    "other",
}

SPANISH_LABELS = {
    "normative_update": "Cambio normativo",
    "news": "Noticia",
    "market_signal": "Señal de mercado",
    "urban_project": "Proyecto urbano",
    "environmental_assessment": "Evaluación ambiental",
    "infrastructure": "Infraestructura",
    "indicator": "Indicador",
    "report": "Informe",
    "court_ruling": "Fallo judicial",
    "public_policy": "Política pública",
    "daily_review": "Revisión diaria",
    "other": "Otro",
    "detected": "Detectado",
    "extracted": "Extraído",
    "classified": "Clasificado",
    "preliminary": "Preliminar",
    "requires_review": "Requiere revisión",
    "validated": "Validado",
    "discarded": "Descartado",
    "error": "Error",
    "national": "Nacional",
    "regional": "Regional",
    "interregional": "Interregional",
    "provincial": "Provincial",
    "intercommunal": "Intercomunal",
    "communal": "Comunal",
    "local": "Local",
    "multiple": "Múltiple",
    "undetermined": "Sin determinar",
}
