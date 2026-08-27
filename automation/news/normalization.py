from __future__ import annotations

import hashlib
import html
import re
import unicodedata
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKING_PARAMETERS = {
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "ref",
    "ref_src",
    "source",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
}


def strip_html(value: str) -> str:
    text = html.unescape(value or "")
    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_text(value: str) -> str:
    text = strip_html(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold()
    text = re.sub(r"[^a-z0-9áéíóúüñ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_title(value: str) -> str:
    text = normalize_text(value)
    removable_prefixes = (
        "ultima hora ",
        "exclusivo ",
        "opinion ",
        "columna ",
        "comunicado ",
    )
    for prefix in removable_prefixes:
        if text.startswith(prefix):
            text = text[len(prefix) :].strip()
            break
    return text


def canonicalize_url(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""

    parts = urlsplit(value)
    scheme = (parts.scheme or "https").lower()
    netloc = parts.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]

    path = re.sub(r"/{2,}", "/", parts.path or "/")
    if path != "/":
        path = path.rstrip("/")

    query_pairs = [
        (key, val)
        for key, val in parse_qsl(parts.query, keep_blank_values=False)
        if key.casefold() not in TRACKING_PARAMETERS and not key.casefold().startswith("utm_")
    ]
    query_pairs.sort()
    query = urlencode(query_pairs, doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def stable_key(*parts: str, length: int = 24) -> str:
    joined = "|".join(normalize_text(part) for part in parts if part)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()[:length]


def build_content_key(title: str, excerpt: str = "") -> str:
    normalized_excerpt = normalize_text(excerpt)
    excerpt_tokens = " ".join(normalized_excerpt.split()[:50])
    return stable_key(normalize_title(title), excerpt_tokens)
