from __future__ import annotations

"""Barrido oficial diario de actos que pueden impactar PRC.

Funciona íntegramente en GitHub Actions y no requiere OpenAI, Ollama ni archivos
locales. Lee la última edición disponible del Diario Oficial, identifica
publicaciones con señales normativas fuertes, verifica el texto del PDF y las
incorpora como antecedentes multifuente pendientes de conciliación.

No certifica por sí solo que la cartografía esté actualizada: el antecedente
queda en `ipt_reportes.js` y el refresco nacional lo transforma en candidato,
bloqueando la certificación hasta reconciliarlo con Portal IPT/tabla/SIG.
"""

import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.sources.diario_oficial import (  # noqa: E402
    create_session,
    extract_edition,
    extract_publications,
    fetch_bytes,
    fetch_text,
    pdf_to_text,
)
from automation.sources.diario_oficial import INDEX_URL  # noqa: E402

TRACKING = ROOT / "data" / "seguimiento_normativo.js"
REPORTS = ROOT / "data" / "ipt_reportes.js"
TIMEZONE = ZoneInfo("America/Santiago")

STRONG_SIGNALS = (
    "plan regulador comunal",
    "modifica plan regulador",
    "modificacion al plan regulador",
    "modificación al plan regulador",
    "enmienda al plan regulador",
    "enmienda del plan regulador",
    "plan seccional",
    "rectifica plan regulador",
    "rectificación plan regulador",
    "rectificacion plan regulador",
    "límite urbano",
    "limite urbano",
)


def norm(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "").casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def read_assignment(path: Path, prefix: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise RuntimeError(f"Formato inválido: {path.name}")
    return json.loads(raw[len(prefix):-1])


def write_reports(payload: list[dict[str, Any]]) -> None:
    payload.sort(key=lambda item: str(item.get("periodo") or ""), reverse=True)
    REPORTS.write_text(
        "window.IPT_REPORTES = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def commune_catalog() -> list[dict[str, str]]:
    payload = read_assignment(TRACKING, "window.SEGUIMIENTO_NORMATIVO = ")
    rows = payload.get("comunas", []) if isinstance(payload, dict) else []
    output = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        commune = str(row.get("comuna") or "").strip()
        region = str(row.get("region") or "").strip()
        if commune and region:
            output.append({"comuna": commune, "region": region, "key": norm(commune)})
    if len(output) != 346:
        raise RuntimeError(f"Se esperaban 346 comunas y se obtuvieron {len(output)}.")
    return output


def strong_candidate(text: str) -> bool:
    normalized = norm(text)
    return any(norm(signal) in normalized for signal in STRONG_SIGNALS)


def affected_communes(title: str, context: str, body: str, catalog: list[dict[str, str]]) -> list[dict[str, str]]:
    title_key = norm(title)
    context_key = norm(context)
    body_key = norm(body[:24_000])
    matches: list[dict[str, str]] = []

    for item in catalog:
        key = item["key"]
        strong_phrases = (
            f"comuna de {key}",
            f"municipalidad de {key}",
            f"plan regulador comunal de {key}",
            f"prc de {key}",
        )
        explicit = any(phrase in title_key or phrase in context_key for phrase in strong_phrases)
        title_match = key in title_key and strong_candidate(title_key)
        body_explicit = any(phrase in body_key for phrase in strong_phrases)
        if explicit or title_match or body_explicit:
            matches.append(item)

    # Los PDF pueden contener referencias a comunas vecinas, organismos o
    # direcciones. Si hay muchas coincidencias, conservamos solo las que aparecen
    # en título/contexto para no convertir menciones accesorias en afectaciones.
    if len(matches) > 3:
        narrowed = [
            item for item in matches
            if item["key"] in title_key
            or f"municipalidad de {item['key']}" in context_key
            or f"comuna de {item['key']}" in context_key
        ]
        if narrowed:
            matches = narrowed
    return matches


def infer_act(text: str) -> tuple[str, str, str]:
    value = norm(text)
    if "enmienda" in value:
        return "PRC", "Enmienda", "Vigente"
    if "plan seccional" in value:
        return "SECCIONAL", "Plan seccional / modificación", "Vigente"
    if "rectific" in value:
        return "PRC", "Rectificación", "Vigente"
    if "limite urbano" in value:
        return "PRC", "Modificación de límite urbano", "Vigente"
    return "PRC", "Modificación", "Vigente"


def extract_number(text: str) -> str:
    patterns = (
        r"\b(?:decreto|resolucion|resolución)\s+(?:alcaldicio\s+)?(?:exenta\s+)?n[°ºo\.]*\s*([0-9][0-9.\-/]*)",
        r"\bn[°º]\s*([0-9][0-9.\-/]*)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1)
    return ""


def deduplicate(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    seen: set[tuple[str, ...]] = set()
    for item in items:
        key = (
            norm(item.get("region")),
            norm(item.get("comuna")),
            norm(item.get("tipo_ipt")),
            norm(item.get("acto")),
            norm(item.get("numero")),
            str(item.get("fecha_publicacion") or ""),
            str(item.get("fuente") or ""),
        )
        if key in seen:
            continue
        seen.add(key)
        output.append(item)
    return sorted(output, key=lambda item: (
        str(item.get("region") or ""),
        str(item.get("comuna") or ""),
        str(item.get("fecha_publicacion") or ""),
        str(item.get("acto") or ""),
    ))


def main() -> int:
    now = datetime.now(TIMEZONE)
    http = create_session()
    html = fetch_text(http, INDEX_URL)
    edition = extract_edition(html)
    publications = extract_publications(html)
    catalog = commune_catalog()
    findings: list[dict[str, Any]] = []
    inspected = 0

    for publication in publications:
        header = f"{publication.title} {publication.context}"
        if not strong_candidate(header):
            continue
        inspected += 1
        try:
            body = pdf_to_text(fetch_bytes(http, publication.pdf_url))
        except Exception as error:
            print(
                f"Advertencia PDF CVE-{publication.cve or publication.index}: {type(error).__name__}: {error}",
                file=sys.stderr,
            )
            continue
        if not strong_candidate(f"{header} {body}"):
            continue

        communes = affected_communes(publication.title, publication.context, body, catalog)
        if not communes:
            print(
                f"Candidato sin comuna resuelta: CVE-{publication.cve or publication.index} · {publication.title[:140]}",
                file=sys.stderr,
            )
            continue

        tipo_ipt, act, status = infer_act(f"{publication.title} {body[:6000]}")
        number = extract_number(f"{publication.title} {body[:8000]}")
        summary = re.sub(r"\s+", " ", publication.title).strip()
        for commune in communes:
            findings.append({
                "region": commune["region"],
                "comuna": commune["comuna"],
                "territorio": commune["comuna"],
                "tipo_ipt": tipo_ipt,
                "acto": act,
                "numero": number,
                "fecha_publicacion": edition.publication_date.isoformat(),
                "estado": status,
                "resumen": summary,
                "vigencia": (
                    "Publicación oficial detectada en Diario Oficial. Debe conciliarse con Portal IPT, "
                    "el texto normativo aplicable y la cartografía antes de certificar incorporación."
                ),
                "fuente": publication.pdf_url,
                "cve": publication.cve,
                "origen_automatico": "Diario Oficial de la República de Chile",
            })

    reports = read_assignment(REPORTS, "window.IPT_REPORTES = ")
    if not isinstance(reports, list):
        reports = []
    period = edition.publication_date.strftime("%Y-%m")
    report = next((item for item in reports if item.get("periodo") == period), None)
    previous = list((report or {}).get("cambios", []) or [])
    changes = deduplicate([*previous, *findings])
    generated_at = now.strftime("%Y-%m-%d %H:%M")

    payload = {
        "periodo": period,
        "titulo": f"Actualizaciones IPT · {period}",
        "fecha_generacion": generated_at,
        "ultima_revision_semanal": generated_at,
        "ultima_edicion_diario_oficial": edition.publication_date.isoformat(),
        "edicion_diario_oficial": edition.number,
        "resumen_ejecutivo": (
            f"Barrido oficial de la edición {edition.number}: {inspected} publicaciones normativas "
            f"inspeccionadas y {len(findings)} vinculaciones comunales nuevas/detectadas."
        ),
        "cambios": changes,
        "word_url": "",
        "csv_url": "",
        "excel_url": "",
        "alcance": "Diario Oficial nacional + conciliación posterior con Portal IPT",
        "nota_cobertura": (
            "Este barrido no depende de IA ni de un computador local. Los registros son antecedentes "
            "oficiales y se mantienen como candidatos hasta comprobar su incorporación normativa y SIG."
        ),
    }
    if report is None:
        reports.append(payload)
    else:
        report.clear()
        report.update(payload)
    write_reports(reports)

    print(
        f"Diario Oficial {edition.publication_date.isoformat()} · edición {edition.number} · "
        f"publicaciones: {len(publications)} · candidatas inspeccionadas: {inspected} · "
        f"vinculaciones PRC: {len(findings)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
