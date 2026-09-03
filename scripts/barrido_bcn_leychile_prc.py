from __future__ import annotations

"""Barrido nacional BCN/LeyChile de actos municipales que pueden impactar PRC.

La Biblioteca del Congreso publica una ficha de "Normas que la rigen" por comuna.
Este proceso revisa las 346 comunas, identifica normas nuevas/relevantes y abre el
texto oficial de LeyChile para comprobar señales fuertes de modificación del PRC.

Los hallazgos son antecedentes oficiales verificados en fuente, pero NO se marcan
como incorporados en tabla/SIG. Se exportan a ``data/bcn_prc_candidatos.json`` y
el seguimiento nacional los usa para bloquear certificación hasta conciliarlos.

Estrategia:
- resuelve el nombre oficial acentuado de las 346 comunas desde el catálogo
  territorial MINVU. Ese catálogo se usa SOLO para nombres, no como fuente legal;
- primera ejecución: backfill de los últimos ``--bootstrap-days`` días, leyendo
  cuerpo sólo para títulos con señales urbanísticas o títulos genéricos de riesgo;
- ejecuciones siguientes: ventana solapada de ``--lookback-days`` días y lectura
  de TODAS las normas municipales recientes, para no depender del título;
- la corrida falla si no consigue revisar las 346 fichas comunales.
"""

import argparse
import hashlib
import json
import re
import time
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, urljoin, urlparse
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
TRACKING = ROOT / "data" / "seguimiento_normativo.js"
OUTPUT = ROOT / "data" / "bcn_prc_candidatos.json"
TIMEZONE = ZoneInfo("America/Santiago")
REPORT_URL = "https://www.bcn.cl/siit/reportescomunales/normas.html?com={comuna}"
COMMUNE_DOMAIN_URL = (
    "https://geoide.minvu.cl/server/rest/services/IPT/Limites_Urbanos/"
    "FeatureServer/2?f=pjson"
)
USER_AGENT = "Observatorio-Normativo-Transsa/1.0 (+GitHub Actions; fuente publica BCN)"

DIRECT_TITLE_SIGNALS = (
    "plan regulador comunal",
    "plan regulador",
    "enmienda",
    "plan seccional",
    "limite urbano",
    "ordenanza local del plan regulador",
    "modifica plan regulador",
)
GENERIC_RISK_TITLES = (
    "extracto",
    "complementa decreto",
    "rectifica",
    "deja sin efecto",
    "invalida decreto",
    "invalidacion de decreto",
    "decreto que indica",
    "modificacion que indica",
)
ACTION_PATTERNS = (
    r"aprueb\w*.{0,180}enmiend\w*.{0,260}plan regulador comunal",
    r"enmiend\w*.{0,260}plan regulador comunal",
    r"aprueb\w*.{0,180}modific\w*.{0,260}plan regulador comunal",
    r"modific\w*.{0,260}plan regulador comunal",
    r"rectific\w*.{0,260}plan regulador comunal",
    r"complement\w*.{0,260}(?:enmiend|modific)\w*.{0,260}plan regulador comunal",
    r"deja sin efecto.{0,320}(?:enmiend|modific|plan regulador comunal)",
    r"invalid\w*.{0,320}(?:enmiend|modific)\w*.{0,260}plan regulador comunal",
    r"promulg\w*.{0,220}plan regulador comunal",
    r"aprueb\w*.{0,220}plan regulador comunal",
    r"aprueb\w*.{0,220}plan seccional",
    r"modific\w*.{0,220}plan seccional",
    r"posterg\w*.{0,260}permiso\w*.{0,420}plan regulador comunal",
    r"plan regulador comunal.{0,420}posterg\w*.{0,260}permiso\w*",
    r"modific\w*.{0,260}limite urbano",
)


def norm(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "").casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def loose_name(value: object) -> str:
    """Clave tolerante a artículos omitidos en inventarios históricos."""
    words = norm(value).split()
    while words and words[0] in {"la", "el", "los", "las"}:
        words.pop(0)
    return " ".join(words)


def read_assignment(path: Path, prefix: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise RuntimeError(f"Formato inválido: {path.name}")
    return json.loads(raw[len(prefix):-1])


def commune_catalog() -> list[dict[str, str]]:
    payload = read_assignment(TRACKING, "window.SEGUIMIENTO_NORMATIVO = ")
    rows = payload.get("comunas", []) if isinstance(payload, dict) else []
    output: list[dict[str, str]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        commune = str(row.get("comuna") or "").strip()
        region = str(row.get("region") or "").strip()
        if commune and region:
            output.append({"comuna": commune, "region": region})
    unique = {(norm(item["region"]), norm(item["comuna"])) for item in output}
    if len(output) != 346 or len(unique) != 346:
        raise RuntimeError(f"Se esperaban 346 comunas únicas y se obtuvieron {len(unique)}.")
    return output


def session() -> requests.Session:
    http = requests.Session()
    http.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept-Language": "es-CL,es;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/json",
        }
    )
    return http


def get_response(http: requests.Session, url: str, *, attempts: int = 3) -> requests.Response:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = http.get(url, timeout=35, allow_redirects=True)
            response.raise_for_status()
            return response
        except Exception as error:  # noqa: BLE001 - reintentos de red intencionales
            last = error
            if attempt < attempts:
                time.sleep(0.7 * attempt)
    raise RuntimeError(f"No se pudo consultar {url}: {type(last).__name__}: {last}")


def get_text(http: requests.Session, url: str, *, attempts: int = 3) -> str:
    response = get_response(http, url, attempts=attempts)
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def get_json(http: requests.Session, url: str, *, attempts: int = 3) -> Any:
    response = get_response(http, url, attempts=attempts)
    try:
        return response.json()
    except ValueError as error:
        raise RuntimeError(f"Respuesta JSON inválida en {url}") from error


def official_name_index(http: requests.Session) -> tuple[dict[str, str], dict[str, str]]:
    """Obtiene los nombres oficiales (con tildes/artículos) del dominio COM MINVU."""
    payload = get_json(http, COMMUNE_DOMAIN_URL)
    fields = payload.get("fields", []) if isinstance(payload, dict) else []
    names: list[str] = []
    for field in fields:
        if not isinstance(field, dict) or str(field.get("name") or "").upper() != "COM":
            continue
        domain = field.get("domain") or {}
        values = domain.get("codedValues", []) if isinstance(domain, dict) else []
        names.extend(
            str(item.get("name") or "").strip()
            for item in values
            if isinstance(item, dict) and str(item.get("name") or "").strip()
        )
    names = sorted(set(names))
    if len(names) < 346:
        raise RuntimeError(
            f"El catálogo oficial de nombres comunales devolvió {len(names)} nombres; se esperaban 346."
        )

    exact = {norm(name): name for name in names}
    loose_groups: dict[str, list[str]] = {}
    for name in names:
        loose_groups.setdefault(loose_name(name), []).append(name)
    loose = {
        key: values[0]
        for key, values in loose_groups.items()
        if key and len(values) == 1
    }
    return exact, loose


def resolve_official_name(name: str, exact: dict[str, str], loose: dict[str, str]) -> str:
    return exact.get(norm(name)) or loose.get(loose_name(name)) or name


def parse_date(text: str) -> date | None:
    value = str(text or "").strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value[:10], fmt).date()
        except ValueError:
            continue
    return None


def extract_idnorma(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    for key in ("idNorma", "i"):
        value = (query.get(key) or [""])[0]
        digits = re.sub(r"\D", "", str(value))
        if digits:
            return digits
    match = re.search(r"(?:idNorma|[?&]i)=([0-9]+)", url, flags=re.IGNORECASE)
    return match.group(1) if match else ""


def canonical_url(url: str, idnorma: str) -> str:
    if idnorma:
        return f"https://www.bcn.cl/leychile/navegar?idNorma={idnorma}"
    return url.replace("http://", "https://")


def parse_report(html: str, page_url: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    page_text = norm(soup.get_text(" ", strip=True))
    if "normas que la rigen" not in page_text and "normas publicadas" not in page_text:
        raise RuntimeError("La respuesta BCN no contiene la ficha esperada de normas comunales.")

    rows: list[dict[str, str]] = []
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) < 4:
            continue
        published = parse_date(cells[2].get_text(" ", strip=True))
        link = cells[-1].find("a", href=True)
        if published is None or link is None:
            continue
        href = urljoin(page_url, str(link.get("href") or "").strip())
        title = link.get_text(" ", strip=True) or cells[-1].get_text(" ", strip=True)
        norm_type = cells[1].get_text(" ", strip=True)
        rows.append(
            {
                "fecha": published.isoformat(),
                "titulo": title,
                "tipo_norma_bcn": norm_type,
                "url": href,
            }
        )
    return rows


def title_worth_fetching(title: str) -> bool:
    value = norm(title)
    return any(norm(signal) in value for signal in (*DIRECT_TITLE_SIGNALS, *GENERIC_RISK_TITLES))


def body_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(" ", strip=True)).strip()


def prc_relevant(title: str, body: str) -> bool:
    title_key = norm(title)
    body_key = norm(body[:60_000])
    combined = f"{title_key} {body_key}"

    if (
        ("plan regulador intercomunal" in combined or "plan regulador metropolitano" in combined)
        and "plan regulador comunal" not in combined
    ):
        return False

    if "plan regulador comunal" not in combined and "plan seccional" not in combined:
        return False
    if any(re.search(pattern, combined) for pattern in ACTION_PATTERNS):
        return True

    if any(norm(signal) in title_key for signal in DIRECT_TITLE_SIGNALS):
        return "plan regulador comunal" in combined or "plan seccional" in combined
    return False


def infer_act(title: str, body: str) -> tuple[str, str]:
    value = norm(f"{title} {body[:12_000]}")
    if "posterg" in value and "permiso" in value:
        return "PRC", "Postergación de permisos vinculada a PRC"
    if "plan seccional" in value:
        if "rectific" in value:
            return "SECCIONAL", "Rectificación de Plan Seccional"
        return "SECCIONAL", "Plan Seccional / modificación"
    if "complement" in value and "enmienda" in value:
        return "PRC", "Complemento de Enmienda"
    if "enmienda" in value:
        return "PRC", "Enmienda"
    if "rectific" in value:
        return "PRC", "Rectificación"
    if "deja sin efecto" in value or "invalid" in value:
        return "PRC", "Acto derogatorio / invalidación vinculada a PRC"
    if "limite urbano" in value:
        return "PRC", "Modificación de límite urbano"
    if "promulg" in value or "aprueba plan regulador comunal" in value:
        return "PRC", "Aprobación / promulgación PRC"
    return "PRC", "Modificación"


def extract_number(text: str) -> str:
    value = str(text or "")
    patterns = (
        r"\b(?:decreto|resoluci[oó]n)\s+(?:alcaldicio\s+)?(?:exent[oa]\s+)?n[°ºo.]*\s*([0-9][0-9.\-/]*)",
        r"\bn[úu]m\.?\s*([0-9][0-9.\-/]*)",
        r"\bn[°º]\s*([0-9][0-9.\-/]*)",
    )
    for pattern in patterns:
        match = re.search(pattern, value, flags=re.IGNORECASE)
        if match:
            return match.group(1)
    return ""


def stable_id(commune: str, published: str, title: str, source: str) -> str:
    raw = "|".join([norm(commune), published, norm(title), source]).encode("utf-8")
    return hashlib.sha1(raw).hexdigest()[:16]


def previous_payload() -> dict[str, Any]:
    if not OUTPUT.exists():
        return {}
    try:
        payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lookback-days", type=int, default=21)
    parser.add_argument("--bootstrap-days", type=int, default=1000)
    args = parser.parse_args()
    if args.lookback_days < 8:
        raise SystemExit("--lookback-days debe ser al menos 8 para asegurar solapamiento semanal.")
    if args.bootstrap_days < args.lookback_days:
        raise SystemExit("--bootstrap-days debe ser >= --lookback-days.")

    today = datetime.now(TIMEZONE).date()
    previous = previous_payload()
    previous_bootstrap_days = int(previous.get("bootstrap_days") or 0)
    bootstrap = (
        not bool(previous.get("bootstrap_complete"))
        or previous_bootstrap_days < args.bootstrap_days
    )
    window_days = args.bootstrap_days if bootstrap else args.lookback_days
    since = today - timedelta(days=window_days)
    catalog = commune_catalog()
    http = session()
    official_exact, official_loose = official_name_index(http)

    unresolved_names = [
        item["comuna"]
        for item in catalog
        if resolve_official_name(item["comuna"], official_exact, official_loose) == item["comuna"]
        and norm(item["comuna"]) not in official_exact
    ]
    if unresolved_names:
        raise RuntimeError(
            "No se pudieron resolver nombres oficiales para: " + ", ".join(unresolved_names[:20])
        )

    prior_acts = previous.get("actos", []) if isinstance(previous.get("actos"), list) else []
    by_id: dict[str, dict[str, Any]] = {
        str(item.get("id")): item for item in prior_acts
        if isinstance(item, dict) and item.get("id")
    }
    checked: list[str] = []
    failures: list[str] = []
    recent_rows = 0
    bodies_opened = 0
    relevant_now = 0

    for index, item in enumerate(catalog, start=1):
        commune = item["comuna"]
        official_commune = resolve_official_name(commune, official_exact, official_loose)
        page_url = REPORT_URL.format(comuna=quote(official_commune, safe=""))
        try:
            rows = parse_report(get_text(http, page_url), page_url)
        except Exception as error:  # noqa: BLE001 - acumulamos para fail-closed nacional
            failures.append(
                f"{commune} [{official_commune}]: {type(error).__name__}: {error}"
            )
            continue
        checked.append(commune)

        for row in rows:
            published = parse_date(row["fecha"])
            if published is None or published < since:
                continue
            recent_rows += 1
            if bootstrap and not title_worth_fetching(row["titulo"]):
                continue

            try:
                html = get_text(http, row["url"])
            except Exception as error:
                failures.append(
                    f"{commune} · {row['fecha']} · {row['titulo'][:80]}: "
                    f"{type(error).__name__}: {error}"
                )
                continue
            bodies_opened += 1
            body = body_text(html)
            if not prc_relevant(row["titulo"], body):
                continue

            idnorma = extract_idnorma(row["url"])
            source = canonical_url(row["url"], idnorma)
            tipo_ipt, tipo_acto = infer_act(row["titulo"], body)
            number = extract_number(f"{row['titulo']} {body[:8000]}")
            act_id = f"bcn-{idnorma}" if idnorma else "bcn-" + stable_id(
                commune, row["fecha"], row["titulo"], source
            )
            by_id[act_id] = {
                "id": act_id,
                "official_id": f"BCN-{idnorma}" if idnorma else "",
                "region": item["region"],
                "comunas": [commune],
                "comuna_bcn": official_commune,
                "nivel": "Comunal",
                "tipo_ipt": tipo_ipt,
                "titulo": row["titulo"],
                "estado": "Fuente oficial detectada · pendiente de conciliación",
                "fecha": row["fecha"],
                "fecha_derogacion": "",
                "codigos_origen": [],
                "tipo_acto": tipo_acto,
                "numero": number,
                "source_url": source,
                "origen_seguimiento": "BCN / LeyChile",
                "fuente": "Biblioteca del Congreso Nacional - LeyChile",
                "verificado": True,
                "requiere_conciliacion": True,
            }
            relevant_now += 1

        if index % 50 == 0:
            print(f"BCN: {index}/346 comunas revisadas...")

    if failures or len(checked) != 346:
        sample = " | ".join(failures[:12])
        raise RuntimeError(
            f"Barrido BCN incompleto: {len(checked)}/346 comunas revisadas; "
            f"{len(failures)} fallos. {sample}"
        )

    acts = sorted(
        by_id.values(),
        key=lambda act: (
            str(act.get("fecha") or ""),
            str(act.get("region") or ""),
            str((act.get("comunas") or [""])[0]),
            str(act.get("titulo") or ""),
        ),
    )
    payload = {
        "schema_version": 2,
        "fuente": "Biblioteca del Congreso Nacional - LeyChile / Normas que la rigen",
        "catalogo_nombres": "MINVU dominio COM (solo normalización territorial)",
        "ultima_revision": today.isoformat(),
        "ventana_desde": since.isoformat(),
        "bootstrap_complete": True,
        "bootstrap_days": args.bootstrap_days,
        "lookback_days": args.lookback_days,
        "comunas_esperadas": 346,
        "comunas_revisadas": len(checked),
        "normas_municipales_en_ventana": recent_rows,
        "textos_leychile_abiertos": bodies_opened,
        "hallazgos_relevantes_en_esta_revision": relevant_now,
        "actos_relevantes_acumulados": len(acts),
        "fallos": [],
        "criterio": (
            "Los actos BCN son fuente oficial verificada, pero quedan pendientes de conciliación "
            "con Portal IPT y de comprobar su incorporación en tabla/SIG antes de certificar vigencia."
        ),
        "actos": acts,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"BCN/LeyChile OK · 346 comunas · ventana desde {since.isoformat()} · "
        f"{recent_rows} normas municipales · {bodies_opened} textos abiertos · "
        f"{relevant_now} hallazgos relevantes · {len(acts)} acumulados."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
