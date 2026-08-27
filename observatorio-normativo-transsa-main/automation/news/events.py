from __future__ import annotations

from core.models import CanonicalEvent

from .models import NewsItem, NewsSource
from .territory import detect_territory


def news_item_to_event(item: NewsItem, source: NewsSource) -> CanonicalEvent:
    territory = detect_territory(item.title, item.excerpt)
    relevance = item.relevance_level if item.relevance_level in {"low", "medium", "high", "critical"} else "low"
    confidence = None if not item.relevance_score else min(1.0, max(0.0, item.relevance_score / 25))

    payload = {
        "event_type": "news",
        "title": item.title,
        "event_date": item.published_at,
        "published_at": item.published_at,
        "summary": item.excerpt or item.title,
        "why_it_matters": "Señal potencialmente relevante para el análisis urbano e inmobiliario.",
        "practical_implications": "Pendiente de análisis y validación humana antes de publicarse.",
        "impacted_parties": "Actores urbanos, inmobiliarios y de infraestructura.",
        "recommended_action": "Revisar la fuente y evaluar su impacto.",
        "recommended_action_code": "review_source",
        "relevance_level": relevance,
        "impact_level": "unknown",
        "confidence": confidence,
        "review_status": "requires_review",
        "requires_review_reason": "Evento creado automáticamente desde una noticia.",
        "is_featured": relevance == "high",
        "category": item.categories[0] if item.categories else "mercado",
        "territory": {
            "scale": territory.scale,
            "region": territory.region,
            "commune": territory.commune,
            "is_primary": True,
        },
        "source": {
            "source_name": source.name,
            "source_type": source.source_type,
            "reliability_level": source.reliability_level,
            "title": item.title,
            "published_at": item.published_at,
            "url": item.canonical_url or item.url,
            "external_id": item.external_id,
            "collection_method": source.access_mode,
        },
        "topics": item.categories or ["mercado"],
        "tags": sorted(set(item.tags + item.relevance_reasons + territory.matched_terms)),
    }
    return CanonicalEvent.from_dict(payload)
