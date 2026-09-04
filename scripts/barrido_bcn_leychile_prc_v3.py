from __future__ import annotations

"""Barrido BCN v3 con fallback a Datos Abiertos/SPARQL oficial.

La ruta principal sigue siendo la ficha comunal "Normas que la rigen". Si esa
interfaz falla para una comuna —ya sea al descargarla o al interpretarla— se
consulta el dataset estructurado oficial de normas de BCN. Una comuna sólo cuenta
como revisada si una de las dos rutas oficiales responde de forma verificable.
"""

import re
from urllib.parse import parse_qs, urlparse

import requests

import barrido_bcn_leychile_prc as core

core.BCN_QUERY_ALIASES.update(
    {
        "calera": "La Calera",
        "ranquil": "Ránquil",
        "los alamos": "Los Álamos",
        "los angeles": "Los Ángeles",
        "o higgins": "O'Higgins",
    }
)

SPARQL_URL = "https://datos.bcn.cl/sparql"
ORIGINAL_PARSE_REPORT = core.parse_report
ORIGINAL_GET_TEXT = core.get_text
FALLBACK_ROWS_BY_COMMUNE: dict[str, list[dict[str, str]]] = {}


def _binding_value(binding: dict, key: str) -> str:
    raw = binding.get(key)
    return str(raw.get("value") or "").strip() if isinstance(raw, dict) else ""


def _sparql(http: requests.Session, query: str) -> list[dict]:
    response = http.get(
        SPARQL_URL,
        params={
            "query": query,
            "format": "application/sparql-results+json",
        },
        headers={"Accept": "application/sparql-results+json"},
        timeout=45,
    )
    response.raise_for_status()
    payload = response.json()
    results = payload.get("results") if isinstance(payload, dict) else None
    bindings = results.get("bindings") if isinstance(results, dict) else None
    if not isinstance(bindings, list):
        raise RuntimeError("BCN SPARQL respondió sin results.bindings.")
    return [item for item in bindings if isinstance(item, dict)]


def _org_tokens(commune: str) -> str:
    words = [word for word in core.norm(commune).split() if word]
    if not words:
        raise RuntimeError("Nombre comunal vacío para fallback BCN SPARQL.")
    return ".*".join(re.escape(word.upper()) for word in words)


def _sparql_report(commune: str) -> list[dict[str, str]]:
    http = core.session()
    token_pattern = _org_tokens(commune)
    org_query = f'''
PREFIX bcnnorms: <http://datos.bcn.cl/ontologies/bcn-norms#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?org ?orgname
WHERE {{
  ?org rdf:type bcnnorms:GovernmentalOrganization .
  ?org bcnnorms:hasName ?orgname .
  FILTER regex(UCASE(STR(?orgname)), "MUNICIPALIDAD.*{token_pattern}")
}}
LIMIT 20
'''
    org_rows = _sparql(http, org_query)
    if not org_rows:
        org_query = f'''
PREFIX bcnnorms: <http://datos.bcn.cl/ontologies/bcn-norms#>
SELECT DISTINCT ?org ?orgname
WHERE {{
  ?org bcnnorms:hasName ?orgname .
  FILTER regex(UCASE(STR(?orgname)), "MUNICIPALIDAD.*{token_pattern}")
}}
LIMIT 20
'''
        org_rows = _sparql(http, org_query)
    if not org_rows:
        raise RuntimeError(
            f"BCN SPARQL no encontró organismo municipal para {commune!r}."
        )

    candidates = []
    commune_key = core.norm(commune)
    for item in org_rows:
        name = _binding_value(item, "orgname")
        uri = _binding_value(item, "org")
        if uri and name:
            score = 0
            name_key = core.norm(name)
            if name_key.endswith(commune_key):
                score += 10
            if name_key.startswith("municipalidad"):
                score += 5
            candidates.append((score, uri, name))
    if not candidates:
        raise RuntimeError(f"BCN SPARQL no devolvió URI municipal utilizable para {commune!r}.")
    _score, org_uri, _org_name = max(candidates, key=lambda row: row[0])

    norms_query = f'''
PREFIX bcnnorms: <http://datos.bcn.cl/ontologies/bcn-norms#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT DISTINCT ?norma ?title ?date ?tipoName ?doc ?identifier
WHERE {{
  ?norma bcnnorms:createdBy <{org_uri}> .
  ?norma dc:title ?title .
  ?norma bcnnorms:publishDate ?date .
  OPTIONAL {{ ?norma dc:identifier ?identifier . }}
  OPTIONAL {{
    ?norma bcnnorms:type ?tipo .
    ?tipo bcnnorms:hasName ?tipoName .
  }}
  OPTIONAL {{ ?norma bcnnorms:hasHtmlDocument ?doc . }}
}}
ORDER BY DESC(?date)
'''
    bindings = _sparql(http, norms_query)
    rows: list[dict[str, str]] = []
    for item in bindings:
        title = _binding_value(item, "title")
        raw_date = _binding_value(item, "date")
        parsed = core.parse_date(raw_date[:10])
        if not title or parsed is None:
            continue
        document = _binding_value(item, "doc")
        norma = _binding_value(item, "norma")
        identifier = _binding_value(item, "identifier")
        url = document or norma
        if identifier and identifier.isdigit():
            url = f"https://www.bcn.cl/leychile/navegar?idNorma={identifier}"
        if not url:
            continue
        rows.append(
            {
                "fecha": parsed.isoformat(),
                "titulo": title,
                "tipo_norma_bcn": _binding_value(item, "tipoName") or "Norma",
                "url": url,
            }
        )
    return rows


def _commune_from_report_url(url: str) -> str:
    parsed = urlparse(url)
    if "bcn.cl" not in parsed.netloc or "reportescomunales/normas.html" not in parsed.path:
        return ""
    query = parse_qs(parsed.query)
    return str((query.get("com") or [""])[0]).strip()


def get_text_with_fallback(
    http: requests.Session,
    url: str,
    *,
    attempts: int = 3,
) -> str:
    try:
        return ORIGINAL_GET_TEXT(http, url, attempts=attempts)
    except RuntimeError as primary_error:
        commune = _commune_from_report_url(url)
        if not commune:
            raise
        try:
            rows = _sparql_report(commune)
        except Exception as fallback_error:  # noqa: BLE001
            raise RuntimeError(
                f"Fallaron ficha SIIT y fallback SPARQL para {commune}: "
                f"SIIT={primary_error}; SPARQL={type(fallback_error).__name__}: {fallback_error}"
            ) from fallback_error
        FALLBACK_ROWS_BY_COMMUNE[core.norm(commune)] = rows
        print(
            f"BCN fallback SPARQL activado por error HTTP para {commune}: "
            f"{len(rows)} normas recuperadas."
        )
        return "<html><body>BCN SPARQL fallback</body></html>"


def parse_report_with_fallback(html: str, page_url: str) -> list[dict[str, str]]:
    commune = _commune_from_report_url(page_url)
    cached = FALLBACK_ROWS_BY_COMMUNE.get(core.norm(commune)) if commune else None
    if cached is not None:
        return cached

    try:
        return ORIGINAL_PARSE_REPORT(html, page_url)
    except RuntimeError as primary_error:
        if not commune:
            raise primary_error
        try:
            rows = _sparql_report(commune)
        except Exception as fallback_error:  # noqa: BLE001
            raise RuntimeError(
                f"Fallaron ficha SIIT y fallback SPARQL para {commune}: "
                f"SIIT={primary_error}; SPARQL={type(fallback_error).__name__}: {fallback_error}"
            ) from fallback_error
        FALLBACK_ROWS_BY_COMMUNE[core.norm(commune)] = rows
        print(f"BCN fallback SPARQL usado para {commune}: {len(rows)} normas recuperadas.")
        return rows


core.get_text = get_text_with_fallback
core.parse_report = parse_report_with_fallback


if __name__ == "__main__":
    raise SystemExit(core.main())
