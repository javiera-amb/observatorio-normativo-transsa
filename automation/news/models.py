from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class NewsSource:
    source_id: str
    name: str
    base_url: str
    source_type: str
    reliability_level: str
    confidence_tier: str
    commercial_interest: bool
    access_mode: str
    feed_url: str = ""
    enabled: bool = False
    priority: int = 50
    coverage: list[str] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    verification_status: str = "pending"

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "NewsSource":
        return cls(
            source_id=str(data.get("id") or data.get("source_id") or "").strip(),
            name=str(data.get("name") or "").strip(),
            base_url=str(data.get("base_url") or "").strip(),
            source_type=str(data.get("source_type") or "other").strip(),
            reliability_level=str(data.get("reliability_level") or "unknown").strip(),
            confidence_tier=str(data.get("confidence_tier") or "D").strip().upper(),
            commercial_interest=bool(data.get("commercial_interest", False)),
            access_mode=str(data.get("access_mode") or "manual").strip(),
            feed_url=str(data.get("feed_url") or "").strip(),
            enabled=bool(data.get("enabled", False)),
            priority=int(data.get("priority") or 50),
            coverage=[str(item).strip() for item in data.get("coverage", []) if str(item).strip()],
            topics=[str(item).strip() for item in data.get("topics", []) if str(item).strip()],
            verification_status=str(data.get("verification_status") or "pending").strip(),
        )

    def validate(self) -> list[str]:
        issues: list[str] = []
        if not self.source_id:
            issues.append("id obligatorio")
        if not self.name:
            issues.append("name obligatorio")
        if not self.base_url.startswith(("https://", "http://")):
            issues.append("base_url inválida")
        if self.confidence_tier not in {"A", "B", "C", "D"}:
            issues.append("confidence_tier debe ser A, B, C o D")
        if self.access_mode not in {"rss", "atom", "html_index", "api", "manual"}:
            issues.append("access_mode no permitido")
        if self.enabled and self.access_mode in {"rss", "atom"} and not self.feed_url:
            issues.append("feed_url obligatorio para una fuente RSS/Atom habilitada")
        if not 0 <= self.priority <= 100:
            issues.append("priority debe estar entre 0 y 100")
        return issues


@dataclass(slots=True)
class NewsItem:
    source_id: str
    source_name: str
    title: str
    url: str
    published_at: str
    excerpt: str = ""
    author: str = ""
    external_id: str = ""
    captured_at: str = ""
    canonical_url: str = ""
    title_key: str = ""
    content_key: str = ""
    categories: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    relevance_score: int = 0
    relevance_level: str = "low"
    relevance_reasons: list[str] = field(default_factory=list)
    requires_review: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
