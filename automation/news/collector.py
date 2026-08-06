from __future__ import annotations

from dataclasses import dataclass, field

from .deduplication import deduplicate
from .models import NewsItem, NewsSource
from .relevance import score_relevance
from .rss import FeedError, fetch_feed
from .scope import detect_geographic_scope
from .sources import load_sources


@dataclass(slots=True)
class CollectionResult:
    collected: list[NewsItem] = field(default_factory=list)
    candidates: list[NewsItem] = field(default_factory=list)
    chile_candidates: list[NewsItem] = field(default_factory=list)
    international_candidates: list[NewsItem] = field(default_factory=list)
    undetermined_candidates: list[NewsItem] = field(default_factory=list)
    discarded: list[NewsItem] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    source_counts: dict[str, int] = field(default_factory=dict)


def enrich_relevance(item: NewsItem, source: NewsSource) -> NewsItem:
    relevance = score_relevance(item.title, item.excerpt, source_priority=source.priority)
    item.relevance_score = relevance.score
    item.relevance_level = relevance.level
    item.relevance_reasons = relevance.matched_terms
    item.categories = relevance.categories
    item.requires_review = relevance.requires_review

    geography = detect_geographic_scope(item.title, item.excerpt, source)
    item.geographic_scope = geography.scope
    item.country = geography.country
    item.geographic_reasons = geography.reasons
    item.geographic_confidence = geography.confidence
    if geography.scope == "undetermined" and relevance.is_candidate:
        item.requires_review = True
    return item


def collect_enabled_feeds(*, source_ids: set[str] | None = None, timeout: int = 30) -> CollectionResult:
    sources = load_sources(enabled_only=True)
    if source_ids:
        sources = [source for source in sources if source.source_id in source_ids]

    result = CollectionResult()
    source_map = {source.source_id: source for source in sources}

    for source in sources:
        if source.access_mode not in {"rss", "atom"}:
            continue
        try:
            items = fetch_feed(source, timeout=timeout)
        except FeedError as exc:
            result.errors.append(str(exc))
            continue

        result.source_counts[source.source_id] = len(items)
        result.collected.extend(enrich_relevance(item, source) for item in items)

    result.collected = deduplicate(result.collected)
    for item in result.collected:
        source = source_map[item.source_id]
        relevance = score_relevance(item.title, item.excerpt, source_priority=source.priority)
        if not relevance.is_candidate:
            result.discarded.append(item)
            continue

        result.candidates.append(item)
        if item.geographic_scope == "chile":
            result.chile_candidates.append(item)
        elif item.geographic_scope == "international":
            result.international_candidates.append(item)
        else:
            result.undetermined_candidates.append(item)

    sort_key = lambda item: (-item.relevance_score, item.published_at, item.title.casefold())
    result.candidates.sort(key=sort_key)
    result.chile_candidates.sort(key=sort_key)
    result.international_candidates.sort(key=sort_key)
    result.undetermined_candidates.sort(key=sort_key)
    return result
