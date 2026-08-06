"""Módulo de noticias y mercado de Transsa Urban Intelligence.

La versión 0.6 incorpora recolección, normalización, deduplicación,
prefiltro, detección territorial preliminar y conversión a eventos
canónicos pendientes de revisión humana.
"""

from .events import news_item_to_event
from .models import NewsItem, NewsSource
from .relevance import RelevanceResult, score_relevance
from .territory import TerritoryDetection, detect_territory

__all__ = [
    "NewsItem",
    "NewsSource",
    "RelevanceResult",
    "TerritoryDetection",
    "detect_territory",
    "news_item_to_event",
    "score_relevance",
]
