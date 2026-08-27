from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from .ids import (
    canonical_document_id,
    canonical_event_id,
    document_id,
    legacy_event_id,
    source_id as make_source_id,
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass(slots=True)
class TerritoryReference:
    scale: str
    country: str = "Chile"
    region: str = ""
    commune: str = ""
    province: str = ""
    locality: str = ""
    codigo_ine: str = ""
    codigo_sii: str = ""
    relationship_type: str = "direct"
    is_primary: bool = False

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "TerritoryReference":
        data = data or {}
        return cls(
            scale=str(data.get("scale") or data.get("escala") or "undetermined").strip(),
            country=str(data.get("country") or data.get("pais") or "Chile").strip(),
            region=str(data.get("region") or "").strip(),
            commune=str(data.get("commune") or data.get("comuna") or "").strip(),
            province=str(data.get("province") or data.get("provincia") or "").strip(),
            locality=str(data.get("locality") or data.get("localidad") or "").strip(),
            codigo_ine=str(data.get("codigo_ine") or "").strip(),
            codigo_sii=str(data.get("codigo_sii") or "").strip(),
            relationship_type=str(data.get("relationship_type") or "direct").strip(),
            is_primary=bool(data.get("is_primary", False)),
        )


@dataclass(slots=True)
class SourceReference:
    document_id: str
    source_id: str
    source_name: str
    title: str
    published_at: str
    url: str = ""
    external_id: str = ""
    edition: str = ""
    document_type: str = ""
    document_number: str = ""
    source_type: str = "official"
    reliability_level: str = "primary"
    collection_method: str = "manual"
    base_url: str = ""
    local_path: str = ""
    mime_type: str = ""
    raw_text_path: str = ""
    captured_at: str = field(default_factory=utc_now_iso)

    @classmethod
    def from_dict(cls, data: dict[str, Any], fallback_title: str, fallback_date: str) -> "SourceReference":
        source_name = str(data.get("source_name") or data.get("fuente") or "Fuente sin identificar").strip()
        source_type = str(data.get("source_type") or data.get("tipo_fuente") or "other").strip()
        title = str(data.get("title") or data.get("titulo") or fallback_title).strip()
        published_at = str(data.get("published_at") or data.get("fecha_publicacion") or fallback_date).strip()
        url = str(data.get("url") or "").strip()
        external_id = str(data.get("external_id") or data.get("id_externo") or "").strip()
        sid = str(data.get("source_id") or "").strip() or make_source_id(source_name, source_type)
        did = str(data.get("document_id") or "").strip() or canonical_document_id(
            source_name, published_at, title, external_id, url
        )
        return cls(
            document_id=did,
            source_id=sid,
            source_name=source_name,
            title=title,
            published_at=published_at,
            url=url,
            external_id=external_id,
            edition=str(data.get("edition") or data.get("edicion") or "").strip(),
            document_type=str(data.get("document_type") or data.get("tipo_documento") or "").strip(),
            document_number=str(data.get("document_number") or data.get("numero_documento") or "").strip(),
            source_type=source_type,
            reliability_level=str(data.get("reliability_level") or "unknown").strip(),
            collection_method=str(data.get("collection_method") or "manual").strip(),
            base_url=str(data.get("base_url") or "").strip(),
            local_path=str(data.get("local_path") or "").strip(),
            mime_type=str(data.get("mime_type") or "").strip(),
            raw_text_path=str(data.get("raw_text_path") or "").strip(),
            captured_at=str(data.get("captured_at") or utc_now_iso()).strip(),
        )


@dataclass(slots=True)
class CanonicalEvent:
    event_id: str
    event_type: str
    title: str
    event_date: str
    published_at: str
    summary: str
    why_it_matters: str
    practical_implications: str
    impacted_parties: str
    recommended_action: str
    relevance_level: str
    impact_level: str
    confidence: float | None
    review_status: str
    is_featured: bool
    category: str
    territory: TerritoryReference
    source: SourceReference
    additional_territories: list[TerritoryReference] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    topic_families: dict[str, str] = field(default_factory=dict)
    market_segments: list[str] = field(default_factory=list)
    actors: list[str] = field(default_factory=list)
    projects: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    related_event_ids: list[str] = field(default_factory=list)
    recommended_action_code: str = "other"
    requires_review_reason: str = ""
    version: int = 1
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)
    validated_at: str | None = None
    validated_by: str | None = None
    legacy_payload: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "CanonicalEvent":
        event_type = str(payload.get("event_type") or payload.get("tipo_evento") or "other").strip()
        title = str(payload.get("title") or payload.get("titulo") or "").strip()
        event_date = str(payload.get("event_date") or payload.get("fecha_evento") or payload.get("fecha") or "").strip()
        published_at = str(payload.get("published_at") or payload.get("fecha_publicacion") or event_date).strip()
        source = SourceReference.from_dict(payload.get("source") or payload.get("fuente") or {}, title, published_at)
        eid = str(payload.get("event_id") or "").strip() or canonical_event_id(
            event_type, event_date, title, source.external_id, source.url
        )

        territory_payload = payload.get("territory") or payload.get("territorio") or {}
        primary = TerritoryReference.from_dict(territory_payload)
        primary.is_primary = True

        additional_raw = payload.get("additional_territories") or payload.get("territorios_adicionales") or []
        additional = [TerritoryReference.from_dict(item) for item in additional_raw if isinstance(item, dict)]

        topics = [str(item).strip() for item in (payload.get("topics") or payload.get("temas") or []) if str(item).strip()]
        category = str(payload.get("category") or payload.get("categoria") or (topics[0] if topics else "otros")).strip()
        if category and category not in topics:
            topics.insert(0, category)

        confidence_raw = payload.get("confidence", payload.get("confianza"))
        confidence = None if confidence_raw in (None, "") else float(confidence_raw)

        return cls(
            event_id=eid,
            event_type=event_type,
            title=title,
            event_date=event_date,
            published_at=published_at,
            summary=str(payload.get("summary") or payload.get("resumen") or "").strip(),
            why_it_matters=str(payload.get("why_it_matters") or payload.get("por_que_importa") or "").strip(),
            practical_implications=str(payload.get("practical_implications") or payload.get("implicancias_practicas") or "").strip(),
            impacted_parties=str(payload.get("impacted_parties") or payload.get("actores_impactados") or "").strip(),
            recommended_action=str(payload.get("recommended_action") or payload.get("accion_recomendada") or "").strip(),
            relevance_level=str(payload.get("relevance_level") or payload.get("relevancia") or "medium").strip(),
            impact_level=str(payload.get("impact_level") or payload.get("impacto") or "unknown").strip(),
            confidence=confidence,
            review_status=str(payload.get("review_status") or payload.get("estado_revision") or "preliminary").strip(),
            is_featured=bool(payload.get("is_featured", payload.get("destacado", False))),
            category=category,
            territory=primary,
            source=source,
            additional_territories=additional,
            topics=topics,
            topic_families={str(k): str(v) for k, v in (payload.get("topic_families") or {}).items()},
            market_segments=[str(item).strip() for item in (payload.get("market_segments") or payload.get("segmentos_mercado") or []) if str(item).strip()],
            actors=[str(item).strip() for item in (payload.get("actors") or payload.get("actores") or []) if str(item).strip()],
            projects=[str(item).strip() for item in (payload.get("projects") or payload.get("proyectos") or []) if str(item).strip()],
            tags=[str(item).strip() for item in (payload.get("tags") or payload.get("etiquetas") or []) if str(item).strip()],
            related_event_ids=[str(item).strip() for item in (payload.get("related_event_ids") or payload.get("eventos_relacionados") or []) if str(item).strip()],
            recommended_action_code=str(payload.get("recommended_action_code") or payload.get("codigo_accion") or "other").strip(),
            requires_review_reason=str(payload.get("requires_review_reason") or payload.get("motivo_revision") or "").strip(),
            version=int(payload.get("version") or 1),
            created_at=str(payload.get("created_at") or utc_now_iso()).strip(),
            updated_at=str(payload.get("updated_at") or utc_now_iso()).strip(),
            validated_at=payload.get("validated_at"),
            validated_by=payload.get("validated_by"),
            legacy_payload=dict(payload.get("legacy_payload") or {}),
        )

    @classmethod
    def from_legacy_report(cls, report: dict[str, Any]) -> "CanonicalEvent":
        status = str(report.get("estado") or "").strip()
        no_updates = status.lower() == "sin novedades"
        event_type = "daily_review" if no_updates else "normative_update"
        review_status = "validated"
        relevance = "low" if no_updates else ("high" if report.get("destacado") else "medium")
        impact = "low" if no_updates else "medium"

        source_name = str(report.get("organismo") or "Fuente heredada")
        source_id = "SRC-DIARIO-OFICIAL" if (
            report.get("cve") or "Diario Oficial" in source_name
        ) else "SRC-LEGACY"

        source = SourceReference(
            document_id=document_id(report),
            source_id=source_id,
            source_name=source_name,
            title=str(report.get("titulo") or ""),
            published_at=str(report.get("fecha") or ""),
            url=str(report.get("source_url") or ""),
            external_id=str(report.get("cve") or ""),
            edition=str(report.get("edicion") or ""),
            document_type=str(report.get("tipo_norma") or ""),
            document_number=str(report.get("numero") or ""),
            source_type="official",
            reliability_level="primary",
            collection_method="legacy_migration",
        )

        territory = TerritoryReference(
            scale=str(report.get("escala") or "undetermined"),
            region=str(report.get("region") or ""),
            commune=str(report.get("comuna") or ""),
            is_primary=True,
        )

        implication = str(report.get("implicancia") or "")
        category = str(report.get("categoria") or "Sin categoría")
        return cls(
            event_id=legacy_event_id(report),
            event_type=event_type,
            title=str(report.get("titulo") or ""),
            event_date=str(report.get("fecha") or ""),
            published_at=str(report.get("fecha") or ""),
            summary=str(report.get("resumen") or ""),
            why_it_matters=implication,
            practical_implications=implication,
            impacted_parties=str(report.get("impactados") or ""),
            recommended_action="Sin acción requerida" if no_updates else "Revisar impacto y seguimiento",
            relevance_level=relevance,
            impact_level=impact,
            confidence=None,
            review_status=review_status,
            is_featured=bool(report.get("destacado", False)),
            category=category,
            territory=territory,
            source=source,
            topics=[category],
            recommended_action_code="no_action" if no_updates else "review_source",
            legacy_payload=dict(report),
        )

    def all_territories(self) -> list[TerritoryReference]:
        result = [self.territory, *self.additional_territories]
        seen: set[tuple[str, str, str, str, str]] = set()
        unique: list[TerritoryReference] = []
        for item in result:
            key = (item.scale, item.country, item.region, item.commune, item.locality)
            if key not in seen:
                seen.add(key)
                unique.append(item)
        return unique

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
