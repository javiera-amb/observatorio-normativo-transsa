"""Módulo de noticias y mercado de Transsa Urban Intelligence.

La versión 0.6 incorpora únicamente recolección, normalización,
deduplicación y prefiltro. El análisis con Ollama y la publicación
web se conectarán en una entrega posterior.
"""

from .models import NewsItem, NewsSource
from .relevance import RelevanceResult, score_relevance

__all__ = [
    "NewsItem",
    "NewsSource",
    "RelevanceResult",
    "score_relevance",
]
