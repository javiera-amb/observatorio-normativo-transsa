from __future__ import annotations

from datetime import date
from typing import Any

from core.ids import canonical_document_id
from core.ingest import build_events
from core.models import CanonicalEvent

from .client import OllamaClient
from .infer import infer_event_type
from .normalize import normalize_analysis
from .prompts import build_event_analysis_prompt
from automation.official_extractors import (
    build_environmental_intelligence,
    concrete_review_reason,
    extract_official_fields,
    normalize_region,
)


def analyze_document(
    client: OllamaClient,
    metadata: dict[str, Any],
    text: str,
) -> tuple[dict[str, Any], CanonicalEvent]:
    if not text or not text.strip():
        raise ValueError("El texto fuente está vacío.")

    title = str(metadata.get("title") or metadata.get("titulo") or "").strip()
    if not title:
        raise ValueError("Los metadatos deben incluir title o titulo.")

    event_date = str(
        metadata.get("event_date")
        or metadata.get("fecha_evento")
        or metadata.get("published_at")
        or metadata.get("fecha_publicacion")
        or date.today().isoformat()
    ).strip()
    published_at = str(
        metadata.get("published_at")
        or metadata.get("fecha_publicacion")
        or event_date
    ).strip()

    prompt = build_event_analysis_prompt(
        metadata=metadata,
        text=text,
        max_input_characters=client.config.max_input_characters,
    )
    raw_analysis = client.generate_json(prompt)
    analysis = normalize_analysis(raw_analysis)

    # Los campos jurídicos verificables se extraen también mediante reglas de alta
    # precisión. Las reglas prevalecen sobre la redacción libre del modelo.
    deterministic = extract_official_fields(text, title)
    official_act = dict(analysis.get("official_act") or {})
    for key, value in deterministic.items():
        if value not in (None, ""):
            official_act[key] = value
    analysis["official_act"] = official_act

    if deterministic.get("region"):
        analysis["territory"]["region"] = normalize_region(deterministic["region"])
    elif analysis["territory"].get("region"):
        analysis["territory"]["region"] = normalize_region(analysis["territory"]["region"])
    if deterministic.get("commune"):
        analysis["territory"]["commune"] = deterministic["commune"]
    if deterministic.get("province"):
        analysis["territory"]["province"] = deterministic["province"]
    if analysis["territory"].get("region") and analysis["territory"].get("commune"):
        analysis["territory"]["scale"] = "communal"

    concrete_reason = concrete_review_reason(official_act, analysis["territory"])
    analysis["requires_review_reason"] = concrete_reason
    analysis["review_status"] = "requires_review" if concrete_reason else "preliminary"

    # Corrección semántica del procedimiento ambiental. Cuando existen campos
    # explícitos suficientes, se construyen textos verificables y accionables.
    if official_act.get("procedure_stage"):
        issuer = official_act.get("official_issuer") or "El organismo competente"
        project_name = official_act.get("project_name") or title
        days = official_act.get("participation_days")
        holder = official_act.get("project_holder")
        summary = (
            f"{issuer} abrió"
            + (f" por {days} días hábiles" if days else "")
            + " un proceso de participación ciudadana dentro de la evaluación ambiental "
            + f"de la Declaración de Impacto Ambiental del proyecto “{project_name}”"
            + (f", cuyo titular o proponente es {holder}" if holder else "")
            + "."
        )
        analysis["summary"] = summary
        intelligence = build_environmental_intelligence(official_act, text)
        for key, value in intelligence.items():
            if value:
                analysis[key] = value
        analysis["recommended_action_code"] = "monitor"

    ai_event_type = analysis["event_type"]
    final_event_type, classification_reason = infer_event_type(
        ai_event_type, metadata, text
    )
    analysis["event_type"] = final_event_type
    analysis["classification_reason"] = classification_reason

    source = metadata.get("source") or metadata.get("fuente") or {}
    if isinstance(source, str):
        source = {"source_name": source}
    source = dict(source)
    source.setdefault("source_name", str(metadata.get("source_name") or "Fuente sin identificar"))
    # La identidad documental se calcula antes de reemplazar la fuente de
    # publicación por el organismo emisor. Así la mejora del análisis no cambia
    # el document_id de un PDF ya registrado.
    source.setdefault(
        "document_id",
        canonical_document_id(
            str(source.get("source_name") or "Fuente sin identificar"),
            published_at,
            title,
            str(source.get("external_id") or ""),
            str(source.get("url") or ""),
        ),
    )
    source.setdefault("source_type", str(metadata.get("source_type") or "other"))
    source.setdefault("reliability_level", str(metadata.get("reliability_level") or "unknown"))
    source.setdefault("collection_method", "ollama_preliminary")
    source.setdefault("url", str(metadata.get("url") or ""))
    if official_act.get("official_issuer"):
        source["source_name"] = official_act["official_issuer"]
    if official_act.get("act_type"):
        source["document_type"] = official_act["act_type"]
    if official_act.get("act_number"):
        source["document_number"] = official_act["act_number"]

    territory_hint = metadata.get("territory") or metadata.get("territorio") or {}
    territory = analysis["territory"]
    if isinstance(territory_hint, dict):
        for key in ("scale", "country", "region", "commune", "province", "locality", "codigo_ine", "codigo_sii"):
            hinted = territory_hint.get(key)
            if hinted not in (None, "") and territory.get(key) in (None, "", "undetermined"):
                territory[key] = hinted

    payload: dict[str, Any] = {
        "event_type": analysis["event_type"],
        "title": title,
        "event_date": event_date,
        "published_at": published_at,
        "summary": analysis["summary"] or title,
        "why_it_matters": analysis["why_it_matters"],
        "practical_implications": analysis["practical_implications"],
        "impacted_parties": analysis["impacted_parties"],
        "recommended_action": analysis["recommended_action"],
        "recommended_action_code": analysis["recommended_action_code"],
        "relevance_level": analysis["relevance_level"],
        "impact_level": analysis["impact_level"],
        "confidence": analysis["confidence"],
        "review_status": analysis["review_status"],
        "requires_review_reason": analysis["requires_review_reason"],
        "is_featured": analysis["relevance_level"] in {"high", "critical"},
        "category": analysis["category"],
        "topics": analysis["topics"],
        "market_segments": analysis["market_segments"],
        "actors": analysis["actors"],
        "projects": analysis["projects"],
        "tags": list(dict.fromkeys([*analysis["tags"], "ollama_preliminary", "hybrid_classification"])),
        "territory": territory,
        "source": source,
        "legacy_payload": {
            "ai_provider": "ollama",
            "ai_model": client.config.model,
            "es_relevante": analysis["es_relevante"],
            "classification_reason": analysis["classification_reason"],
            "ai_event_type_raw": ai_event_type,
            "official_act": official_act,
            "publication_source": official_act.get("publication_source") or "Diario Oficial de la República de Chile",
        },
    }

    event = build_events([payload], strict=True)[0]
    return analysis, event
