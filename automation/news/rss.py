from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

import requests

from .models import NewsItem, NewsSource
from .normalization import build_content_key, canonicalize_url, normalize_title, strip_html

USER_AGENT = "TranssaUrbanIntelligence/0.6 (+public-news-monitor)"


class FeedError(RuntimeError):
    pass


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].casefold()


def _first_text(element: ElementTree.Element, names: set[str]) -> str:
    for child in element.iter():
        if _local_name(child.tag) in names and child.text:
            value = child.text.strip()
            if value:
                return value
    return ""


def _atom_link(element: ElementTree.Element) -> str:
    fallback = ""
    for child in element.iter():
        if _local_name(child.tag) != "link":
            continue
        href = (child.attrib.get("href") or "").strip()
        if not href:
            continue
        rel = (child.attrib.get("rel") or "alternate").casefold()
        if rel == "alternate":
            return href
        fallback = fallback or href
    return fallback


def _date_to_iso(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""

    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        pass

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).date().isoformat()
    except ValueError:
        return value[:10] if len(value) >= 10 else value


def parse_feed(content: bytes | str, source: NewsSource, *, captured_at: str = "") -> list[NewsItem]:
    try:
        root = ElementTree.fromstring(content)
    except ElementTree.ParseError as exc:
        raise FeedError(f"XML inválido para {source.name}: {exc}") from exc

    root_name = _local_name(root.tag)
    is_atom = root_name == "feed"
    entry_name = "entry" if is_atom else "item"
    entries = [node for node in root.iter() if _local_name(node.tag) == entry_name]

    items: list[NewsItem] = []
    for entry in entries:
        title = strip_html(_first_text(entry, {"title"}))
        if not title:
            continue

        url = _atom_link(entry) if is_atom else _first_text(entry, {"link"})
        external_id = _first_text(entry, {"guid", "id"})
        excerpt = strip_html(_first_text(entry, {"description", "summary", "content", "encoded"}))
        author = strip_html(_first_text(entry, {"author", "creator", "name"}))
        published_raw = _first_text(entry, {"pubdate", "published", "updated", "date"})
        published_at = _date_to_iso(published_raw)
        canonical_url = canonicalize_url(url)
        title_key = normalize_title(title)

        items.append(
            NewsItem(
                source_id=source.source_id,
                source_name=source.name,
                title=title,
                url=url,
                published_at=published_at,
                excerpt=excerpt,
                author=author,
                external_id=external_id,
                captured_at=captured_at,
                canonical_url=canonical_url,
                title_key=title_key,
                content_key=build_content_key(title, excerpt),
            )
        )

    return items


def fetch_feed(source: NewsSource, *, timeout: int = 30, session: requests.Session | None = None) -> list[NewsItem]:
    if source.access_mode not in {"rss", "atom"}:
        raise FeedError(f"{source.name} no está configurada como RSS/Atom.")
    if not source.feed_url:
        raise FeedError(f"{source.name} no tiene feed_url.")

    client = session or requests.Session()
    try:
        response = client.get(
            source.feed_url,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"},
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FeedError(f"No se pudo descargar {source.name}: {exc}") from exc

    content_type = response.headers.get("Content-Type", "").casefold()
    if "html" in content_type and not response.content.lstrip().startswith(b"<?xml"):
        raise FeedError(f"{source.name} respondió HTML en vez de un feed XML.")

    captured_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return parse_feed(response.content, source, captured_at=captured_at)
