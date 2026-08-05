#!/usr/bin/env python3
"""Pipeline local del Diario Oficial para Transsa Urban Intelligence.

No usa OpenAI ni servicios pagados. Descarga la edición más reciente, aplica
un prefiltro por reglas, analiza candidatos con Ollama local, guarda documentos
originales, crea eventos canónicos en SQLite, exporta datos web y genera un Word
preliminar compatible con el portal heredado.
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import requests

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.ollama.analyzer import analyze_document
from automation.ollama.client import OllamaClient, OllamaError
from automation.ollama.config import load_ollama_config
from automation.reports.daily_report import (
    event_to_legacy_report,
    generate_daily_docx,
    no_news_legacy_report,
)
from automation.sources.diario_oficial import (
    INDEX_URL,
    DiarioOficialError,
    Publication,
    create_session,
    extract_edition,
    extract_publications,
    fetch_bytes,
    fetch_text,
    pdf_to_text,
    save_publication_files,
    select_candidates,
)
from core.database import connect, initialize_database, upsert_events
from core.events import write_event_json
from core.ingest import build_events
from core.legacy import read_legacy_reports, write_legacy_reports
from core.paths import ProjectPaths

TIMEZONE = ZoneInfo("America/Santiago")
PIPELINE_NAME = "diario_oficial_local"
RULES_VERSION = "do-prefilter-v2-official-fields"


class PipelineError(RuntimeError):
    """Error controlado del pipeline local."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocesa la edición aunque exista un manifiesto completado.",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=4,
        help="Puntaje mínimo del prefiltro por reglas. Valor recomendado: 4.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Descarga y analiza, pero no actualiza SQLite ni data/reportes.js.",
    )
    return parser.parse_args()


def relative(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def edition_inbox(paths: ProjectPaths, edition_date: date) -> Path:
    return paths.inbox_dir / "diario_oficial" / edition_date.isoformat()


def documents_dir(paths: ProjectPaths, edition_date: date) -> Path:
    return (
        paths.root
        / "documentos"
        / "diario_oficial"
        / f"{edition_date.year:04d}"
        / f"{edition_date.month:02d}"
        / edition_date.isoformat()
    )


def report_path(paths: ProjectPaths, report_date: date) -> Path:
    return (
        paths.root
        / "documentos"
        / "reportes"
        / f"{report_date.year:04d}"
        / f"{report_date.month:02d}"
        / f"Reporte_TUI_Diario_Oficial_{report_date.isoformat()}.docx"
    )


def manifest_path(paths: ProjectPaths, edition_date: date) -> Path:
    return edition_inbox(paths, edition_date) / "manifest.json"


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def append_unique_legacy(
    reports: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
) -> int:
    event_ids = {
        str(item.get("event_id") or "").strip()
        for item in reports
        if str(item.get("event_id") or "").strip()
    }
    date_titles = {
        (
            str(item.get("fecha", "")),
            str(item.get("titulo") or "").strip().lower(),
        )
        for item in reports
    }
    date_cves = {
        (str(item.get("fecha", "")), str(item.get("cve") or "").strip())
        for item in reports
        if str(item.get("cve") or "").strip()
    }
    no_news_dates = {
        str(item.get("fecha", ""))
        for item in reports
        if str(item.get("estado", "")).strip().lower() == "sin novedades"
    }

    added = 0
    for item in incoming:
        event_id = str(item.get("event_id") or "").strip()
        date_title = (
            str(item.get("fecha", "")),
            str(item.get("titulo") or "").strip().lower(),
        )
        cve = str(item.get("cve") or "").strip()
        date_cve = (str(item.get("fecha", "")), cve)
        is_no_news = str(item.get("estado", "")).strip().lower() == "sin novedades"

        if event_id and event_id in event_ids:
            continue
        if date_title in date_titles:
            continue
        if cve and date_cve in date_cves:
            continue
        if is_no_news and str(item.get("fecha", "")) in no_news_dates:
            continue

        reports.append(item)
        if event_id:
            event_ids.add(event_id)
        date_titles.add(date_title)
        if cve:
            date_cves.add(date_cve)
        if is_no_news:
            no_news_dates.add(str(item.get("fecha", "")))
        added += 1

    reports.sort(
        key=lambda item: (str(item.get("fecha", "")), str(item.get("titulo", ""))),
        reverse=True,
    )
    return added


def build_daily_review_event(
    review_date: date,
    edition_number: str,
    edition_date: date,
    reason: str,
):
    payload = {
        "event_type": "daily_review",
        "title": "Revisión diaria del Diario Oficial sin novedades relevantes",
        "event_date": review_date.isoformat(),
        "published_at": review_date.isoformat(),
        "summary": reason,
        "why_it_matters": "Mantiene trazabilidad de la revisión diaria de fuentes públicas.",
        "practical_implications": "No se genera una acción automática para el equipo.",
        "impacted_parties": "Equipo de Transsa Urban Intelligence.",
        "recommended_action": "Sin acción requerida.",
        "recommended_action_code": "no_action",
        "relevance_level": "low",
        "impact_level": "low",
        "confidence": 1.0,
        "review_status": "preliminary",
        "is_featured": False,
        "category": "revision_diaria",
        "topics": ["revision_diaria"],
        "market_segments": ["no_aplica"],
        "actors": [],
        "projects": [],
        "tags": ["diario_oficial", "sin_novedades", "local_pipeline"],
        "territory": {"scale": "national", "country": "Chile"},
        "source": {
            "source_name": "Diario Oficial de la República de Chile",
            "source_type": "official",
            "reliability_level": "primary",
            "collection_method": "local_pipeline",
            "url": INDEX_URL,
            "edition": edition_number,
            "published_at": edition_date.isoformat(),
            "document_type": "Revisión diaria",
        },
        "legacy_payload": {
            "edition_date": edition_date.isoformat(),
            "pipeline": PIPELINE_NAME,
        },
    }
    return build_events([payload], strict=True)[0]


def record_pipeline_run(
    paths: ProjectPaths,
    run_id: str,
    started_at: str,
    status: str,
    discovered: int,
    created: int,
    updated: int,
    errors: int,
    model_name: str,
    details: dict[str, Any],
) -> None:
    initialize_database(paths.database)
    with connect(paths.database) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO pipeline_runs(
              run_id, pipeline_name, started_at, finished_at, status,
              documents_discovered, events_created, events_updated,
              errors_count, rules_version, model_name, details_json
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                PIPELINE_NAME,
                started_at,
                datetime.now(TIMEZONE).isoformat(timespec="seconds"),
                status,
                discovered,
                created,
                updated,
                errors,
                RULES_VERSION,
                model_name,
                json.dumps(details, ensure_ascii=False),
            ),
        )


def process_publication(
    paths: ProjectPaths,
    client: OllamaClient,
    edition_number: str,
    edition_date: date,
    publication: Publication,
    http: requests.Session,
) -> tuple[dict[str, Any], Any | None]:
    print(
        f"  - CVE {publication.cve or publication.index}: "
        f"puntaje {publication.relevance_score}"
    )
    pdf_bytes = fetch_bytes(http, publication.pdf_url)
    text = pdf_to_text(pdf_bytes)
    if not text:
        return (
            {
                "publication": publication.to_dict(),
                "status": "error",
                "error": "No fue posible extraer texto del PDF.",
            },
            None,
        )

    pdf_path, text_path = save_publication_files(
        documents_dir(paths, edition_date), publication, pdf_bytes, text
    )
    metadata = {
        "title": publication.title,
        "event_date": edition_date.isoformat(),
        "published_at": edition_date.isoformat(),
        "source": {
            "source_name": "Diario Oficial de la República de Chile",
            "source_type": "official",
            "reliability_level": "primary",
            "collection_method": "local_pipeline",
            "url": publication.pdf_url,
            "external_id": publication.cve,
            "edition": edition_number,
            "document_type": "Publicación oficial",
            "local_path": relative(pdf_path, paths.root),
            "raw_text_path": relative(text_path, paths.root),
            "mime_type": "application/pdf",
            "base_url": "https://www.diariooficial.interior.gob.cl/",
        },
        "prefilter": {
            "score": publication.relevance_score,
            "matched_terms": list(publication.matched_terms),
            "context": publication.context,
        },
    }

    analysis, event = analyze_document(client, metadata, text)
    result = {
        "publication": publication.to_dict(),
        "status": "relevant" if analysis["es_relevante"] else "discarded",
        "analysis": analysis,
        "event": event.to_dict(),
        "pdf_path": relative(pdf_path, paths.root),
        "text_path": relative(text_path, paths.root),
    }
    return result, event if analysis["es_relevante"] else None


def export_web_events(paths: ProjectPaths) -> int:
    from core.database import fetch_web_events

    events = fetch_web_events(paths.database)
    payload = "window.TUI_EVENTS = " + json.dumps(events, ensure_ascii=False, indent=2) + ";\n"
    paths.web_events_js.write_text(payload, encoding="utf-8")
    return len(events)


def main() -> int:
    args = parse_args()
    paths = ProjectPaths.discover(ROOT)
    paths.ensure_runtime_directories()
    config = load_ollama_config(paths.root / "config" / "ollama.json")
    client = OllamaClient(config)
    started_at = datetime.now(TIMEZONE).isoformat(timespec="seconds")
    run_id = "RUN-DO-" + datetime.now(TIMEZONE).strftime("%Y%m%d-%H%M%S")
    today = datetime.now(TIMEZONE).date()
    discovered = created = updated = errors = 0
    details: dict[str, Any] = {"dry_run": args.dry_run, "force": args.force}

    print("TRANS​SA URBAN INTELLIGENCE · DIARIO OFICIAL LOCAL")
    print(f"Fecha en Chile: {today.isoformat()}")
    print(f"Ollama: {config.model} · {config.base_url}")

    if not client.model_is_available():
        raise PipelineError(
            f"El modelo {config.model} no está disponible. Ejecuta: ollama pull {config.model}"
        )

    http = create_session()
    html = fetch_text(http, INDEX_URL)
    edition = extract_edition(html)
    print(f"Edición detectada: N.º {edition.number} · {edition.publication_date}")

    manifest_file = manifest_path(paths, edition.publication_date)
    old_manifest = load_manifest(manifest_file)
    if old_manifest.get("status") == "completed" and not args.force:
        print("La edición ya fue procesada correctamente. Usa --force para reprocesar.")
        return 0

    report_date = today if edition.publication_date < today else edition.publication_date
    events: list[Any] = []
    analysis_results: list[dict[str, Any]] = []
    no_news_reason = ""

    if edition.publication_date < today:
        no_news_reason = (
            "Al momento de la revisión no había una nueva edición publicada para hoy. "
            f"La edición más reciente correspondía al {edition.publication_date.isoformat()}."
        )
    elif edition.publication_date > today:
        raise PipelineError("La fecha publicada es posterior a la fecha actual en Chile.")
    else:
        publications = extract_publications(html)
        discovered = len(publications)
        candidates = select_candidates(publications, threshold=args.threshold)
        print(f"Publicaciones detectadas: {len(publications)}")
        print(f"Candidatas por reglas: {len(candidates)}")

        inbox = edition_inbox(paths, edition.publication_date)
        save_json(inbox / "publicaciones_detectadas.json", [item.to_dict() for item in publications])
        save_json(inbox / "publicaciones_candidatas.json", [item.to_dict() for item in candidates])

        for publication in candidates:
            try:
                result, event = process_publication(
                    paths, client, edition.number, edition.publication_date, publication, http
                )
                analysis_results.append(result)
                if event is not None:
                    events.append(event)
            except Exception as exc:  # Se preserva el resto de la edición.
                errors += 1
                analysis_results.append(
                    {
                        "publication": publication.to_dict(),
                        "status": "error",
                        "error": f"{type(exc).__name__}: {exc}",
                    }
                )
                print(f"    ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)

        save_json(inbox / "analisis_ollama.json", analysis_results)
        if not events:
            no_news_reason = (
                "Se revisó la edición más reciente del Diario Oficial y no se "
                "identificaron eventos relevantes después del prefiltro y el análisis local."
            )

    word = report_path(paths, report_date)
    generate_daily_docx(
        report_date=report_date,
        edition_number=edition.number,
        events=events,
        output_path=word,
        no_news_reason=no_news_reason,
    )

    legacy_incoming: list[dict[str, Any]] = []
    if events:
        legacy_incoming = [
            event_to_legacy_report(event, word_path=word, root=paths.root)
            for event in events
        ]
    else:
        legacy_incoming = [
            no_news_legacy_report(
                report_date=report_date,
                edition_number=edition.number,
                edition_date=edition.publication_date,
                reason=no_news_reason,
                word_path=word,
                root=paths.root,
            )
        ]

    if not args.dry_run:
        initialize_database(paths.database)
        db_events = events or [
            build_daily_review_event(
                review_date=report_date,
                edition_number=edition.number,
                edition_date=edition.publication_date,
                reason=no_news_reason,
            )
        ]
        created, updated = upsert_events(paths.database, db_events)
        for event in db_events:
            write_event_json(paths.events_dir, event)

        reports = read_legacy_reports(paths.legacy_reports_js)
        legacy_added = append_unique_legacy(reports, legacy_incoming)
        if legacy_added:
            write_legacy_reports(paths.legacy_reports_js, reports)
        web_count = export_web_events(paths)
    else:
        legacy_added = 0
        web_count = 0

    manifest = {
        "status": "completed" if errors == 0 else "completed_with_errors",
        "run_id": run_id,
        "processed_at": datetime.now(TIMEZONE).isoformat(timespec="seconds"),
        "edition": edition.to_dict(),
        "documents_discovered": discovered,
        "events_relevant": len(events),
        "events_created": created,
        "events_updated": updated,
        "errors": errors,
        "legacy_records_added": legacy_added,
        "web_events_exported": web_count,
        "word_path": relative(word, paths.root),
        "model": config.model,
        "rules_version": RULES_VERSION,
        "dry_run": args.dry_run,
    }
    save_json(manifest_file, manifest)

    if not args.dry_run:
        record_pipeline_run(
            paths,
            run_id,
            started_at,
            manifest["status"],
            discovered,
            created,
            updated,
            errors,
            config.model,
            manifest,
        )

    print("\nPROCESO COMPLETADO")
    print(f"- Eventos relevantes: {len(events)}")
    print(f"- Eventos creados: {created}")
    print(f"- Eventos actualizados: {updated}")
    print(f"- Errores parciales: {errors}")
    print(f"- Word: {relative(word, paths.root)}")
    print(f"- Manifiesto: {relative(manifest_file, paths.root)}")
    return 0 if errors == 0 else 4


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (requests.RequestException, DiarioOficialError, OllamaError, PipelineError) as exc:
        print(f"ERROR CONTROLADO: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except Exception as exc:
        print(f"ERROR INESPERADO: {type(exc).__name__}: {exc}", file=sys.stderr)
        traceback.print_exc()
        raise SystemExit(3)
