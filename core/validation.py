from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .models import CanonicalEvent
from .vocabulary import (
    EVENT_TYPES,
    IMPACT_LEVELS,
    MARKET_SEGMENTS,
    RELEVANCE_LEVELS,
    RELIABILITY_LEVELS,
    REVIEW_STATUSES,
    SOURCE_TYPES,
    TERRITORY_SCALES,
)


@dataclass(slots=True)
class ValidationIssue:
    field: str
    message: str
    severity: str = "error"


class EventValidationError(ValueError):
    def __init__(self, issues: list[ValidationIssue]):
        self.issues = issues
        detail = "; ".join(f"{item.field}: {item.message}" for item in issues)
        super().__init__(detail)


def _valid_iso_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
        return True
    except (TypeError, ValueError):
        return False


def validate_event(event: CanonicalEvent, *, strict: bool = True) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    if not event.title:
        issues.append(ValidationIssue("title", "El título es obligatorio."))
    if not event.summary:
        issues.append(ValidationIssue("summary", "El resumen es obligatorio."))
    if not _valid_iso_date(event.event_date):
        issues.append(ValidationIssue("event_date", "Debe usar formato YYYY-MM-DD."))
    if event.published_at and not _valid_iso_date(event.published_at):
        issues.append(ValidationIssue("published_at", "Debe usar formato YYYY-MM-DD."))

    if event.event_type not in EVENT_TYPES:
        issues.append(ValidationIssue("event_type", f"Valor no permitido: {event.event_type}"))
    if event.review_status not in REVIEW_STATUSES:
        issues.append(ValidationIssue("review_status", f"Valor no permitido: {event.review_status}"))
    if event.relevance_level not in RELEVANCE_LEVELS:
        issues.append(ValidationIssue("relevance_level", f"Valor no permitido: {event.relevance_level}"))
    if event.impact_level not in IMPACT_LEVELS:
        issues.append(ValidationIssue("impact_level", f"Valor no permitido: {event.impact_level}"))
    if event.territory.scale not in TERRITORY_SCALES:
        issues.append(ValidationIssue("territory.scale", f"Valor no permitido: {event.territory.scale}"))
    if event.source.source_type not in SOURCE_TYPES:
        issues.append(ValidationIssue("source.source_type", f"Valor no permitido: {event.source.source_type}"))
    if event.source.reliability_level not in RELIABILITY_LEVELS:
        issues.append(ValidationIssue("source.reliability_level", f"Valor no permitido: {event.source.reliability_level}"))
    if not event.source.source_name:
        issues.append(ValidationIssue("source.source_name", "La fuente es obligatoria."))

    if event.confidence is not None and not (0 <= event.confidence <= 1):
        issues.append(ValidationIssue("confidence", "Debe estar entre 0 y 1."))

    for segment in event.market_segments:
        if segment not in MARKET_SEGMENTS:
            issues.append(ValidationIssue("market_segments", f"Segmento no permitido: {segment}"))

    for index, territory in enumerate(event.additional_territories):
        if territory.scale not in TERRITORY_SCALES:
            issues.append(ValidationIssue(f"additional_territories[{index}].scale", f"Valor no permitido: {territory.scale}"))

    if event.review_status == "validated" and not event.validated_by and not event.legacy_payload:
        issues.append(
            ValidationIssue(
                "validated_by",
                "Un evento nuevo validado debe indicar quién lo validó.",
            )
        )

    if event.review_status == "requires_review" and not event.requires_review_reason:
        issues.append(
            ValidationIssue(
                "requires_review_reason",
                "Debe explicar por qué requiere revisión.",
            )
        )

    errors = [item for item in issues if item.severity == "error"]
    if strict and errors:
        raise EventValidationError(errors)
    return issues
