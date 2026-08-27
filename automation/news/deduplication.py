from __future__ import annotations

from difflib import SequenceMatcher

from .models import NewsItem
from .normalization import canonicalize_url, normalize_title


def title_similarity(left: str, right: str) -> float:
    left_key = normalize_title(left)
    right_key = normalize_title(right)
    if not left_key or not right_key:
        return 0.0
    return SequenceMatcher(None, left_key, right_key).ratio()


def are_duplicates(left: NewsItem, right: NewsItem, *, threshold: float = 0.88) -> bool:
    left_url = left.canonical_url or canonicalize_url(left.url)
    right_url = right.canonical_url or canonicalize_url(right.url)
    if left_url and right_url and left_url == right_url:
        return True

    if left.external_id and right.external_id:
        if left.source_id == right.source_id and left.external_id == right.external_id:
            return True

    same_day = bool(left.published_at and right.published_at and left.published_at[:10] == right.published_at[:10])
    similarity = title_similarity(left.title, right.title)

    if similarity >= 0.96:
        return True
    if same_day and similarity >= threshold:
        return True
    return False


def _quality_score(item: NewsItem) -> tuple[int, int, int, int]:
    return (
        1 if item.url else 0,
        1 if item.excerpt else 0,
        len(item.excerpt),
        len(item.title),
    )


def deduplicate(items: list[NewsItem], *, threshold: float = 0.88) -> list[NewsItem]:
    """Conserva una sola representación de cada noticia.

    La deduplicación combina URL canónica, identificador externo y similitud
    del título. Entre duplicados conserva el registro con más metadatos.
    """

    result: list[NewsItem] = []
    for candidate in items:
        duplicate_index: int | None = None
        for index, existing in enumerate(result):
            if are_duplicates(existing, candidate, threshold=threshold):
                duplicate_index = index
                break

        if duplicate_index is None:
            result.append(candidate)
            continue

        existing = result[duplicate_index]
        if _quality_score(candidate) > _quality_score(existing):
            result[duplicate_index] = candidate

    return result
