from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any


def _ascii_token(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    token = re.sub(r"[^A-Za-z0-9]+", "-", ascii_text).strip("-").upper()
    return token or "NA"


def stable_hash(*parts: Any, length: int = 10) -> str:
    raw = "\x1f".join("" if part is None else str(part).strip() for part in parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:length].upper()


def canonical_event_id(
    event_type: str,
    event_date: str,
    title: str,
    source_external_id: str = "",
    source_url: str = "",
) -> str:
    date_token = (event_date or "0000-00-00").replace("-", "")
    type_token = _ascii_token(event_type)[:12]
    digest = stable_hash(event_date, event_type, title, source_external_id, source_url)
    return f"EVT-{date_token}-{type_token}-{digest}"


def canonical_document_id(
    source_name: str,
    published_at: str,
    title: str,
    external_id: str = "",
    url: str = "",
) -> str:
    digest = stable_hash(published_at, title, source_name, external_id, url)
    return f"DOC-{_ascii_token(source_name)[:18]}-{digest}"


def source_id(source_name: str, source_type: str = "other") -> str:
    return f"SRC-{_ascii_token(source_type)[:10]}-{stable_hash(source_name, source_type, length=8)}"


def legacy_event_id(report: dict[str, Any]) -> str:
    date_token = str(report.get("fecha") or "0000-00-00").replace("-", "")
    source_token = "DO" if report.get("organismo") else "LEGACY"
    external = report.get("cve") or report.get("source_url") or report.get("numero")
    digest = stable_hash(
        report.get("fecha"),
        report.get("titulo"),
        report.get("organismo"),
        external,
    )
    return f"EVT-{date_token}-{source_token}-{digest}"


def document_id(report: dict[str, Any]) -> str:
    external = report.get("cve") or report.get("source_url") or report.get("numero")
    digest = stable_hash(
        report.get("fecha"),
        report.get("titulo"),
        report.get("organismo"),
        external,
    )
    return f"DOC-{_ascii_token(str(report.get('organismo') or 'LEGACY'))[:18]}-{digest}"


def territory_id(kind: str, name: str, parent: str = "") -> str:
    return f"TER-{_ascii_token(kind)}-{stable_hash(kind, name, parent, length=8)}"


def topic_id(name: str) -> str:
    return f"TOP-{_ascii_token(name)[:40]}"


def segment_id(name: str) -> str:
    return f"SEG-{_ascii_token(name)[:40]}"


def actor_id(name: str) -> str:
    return f"ACT-{stable_hash(name, length=10)}"


def project_id(name: str, territory: str = "") -> str:
    return f"PRJ-{stable_hash(name, territory, length=10)}"
