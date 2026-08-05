from __future__ import annotations

import io
import re
import unicodedata
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

INDEX_URL = "https://www.diariooficial.interior.gob.cl/edicionelectronica/index.php/bom.php"
USER_AGENT = (
    "Mozilla/5.0 (compatible; TranssaUrbanIntelligence/0.5; "
    "+https://www.diariooficial.interior.gob.cl/)"
)
REQUEST_TIMEOUT = 60
MAX_PDF_CHARS = 60_000

MONTHS = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}

HIGH_RELEVANCE = {
    "plan regulador": 8,
    "plan seccional": 8,
    "instrumento de planificacion territorial": 8,
    "limite urbano": 7,
    "ley general de urbanismo": 8,
    "ordenanza general de urbanismo": 8,
    "permiso de edificacion": 7,
    "recepcion definitiva": 7,
    "subdivision": 6,
    "urbanizacion": 6,
    "loteo": 5,
    "uso de suelo": 6,
    "zonificacion": 6,
    "constructibilidad": 6,
    "densidad": 4,
    "altura maxima": 5,
    "vivienda": 4,
    "patrimonio": 5,
    "monumento nacional": 6,
    "zona tipica": 6,
    "evaluacion ambiental": 5,
    "declaracion de impacto ambiental": 6,
    "estudio de impacto ambiental": 6,
    "participacion ciudadana": 4,
    "proyecto inmobiliario": 6,
    "infraestructura urbana": 5,
    "vialidad": 4,
    "expropiacion": 4,
    "arquitectura": 4,
    "construccion": 4,
}

MEDIUM_RELEVANCE = {
    "ministerio de vivienda y urbanismo": 3,
    "minvu": 3,
    "serviu": 3,
    "secretaria regional ministerial de vivienda": 3,
    "municipalidad": 2,
    "direccion de obras": 3,
    "servicio de evaluacion ambiental": 3,
    "desarrollo urbano": 4,
    "mercado de suelo": 4,
    "espacio publico": 3,
    "equipamiento": 2,
    "edificacion": 3,
    "habitacional": 2,
    "industrial": 2,
    "comercial": 2,
    "territorial": 2,
}

EXCLUSIONS = {
    "orden de subrogacion": -9,
    "designacion de cargo": -8,
    "acepta renuncia": -8,
    "nombra a": -5,
    "extracto de sociedad": -8,
    "marca comercial": -8,
    "concesion minera": -6,
    "tipo de cambio": -9,
    "tarifa aduanera": -8,
    "pesca extractiva": -8,
    "veda": -8,
}


class DiarioOficialError(RuntimeError):
    """Error controlado de lectura o extracción del Diario Oficial."""


@dataclass(frozen=True, slots=True)
class Edition:
    number: str
    publication_date: date
    index_url: str = INDEX_URL

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["publication_date"] = self.publication_date.isoformat()
        return payload


@dataclass(frozen=True, slots=True)
class Publication:
    index: int
    title: str
    context: str
    pdf_url: str
    cve: str
    relevance_score: int = 0
    matched_terms: tuple[str, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["matched_terms"] = list(self.matched_terms)
        return payload


def create_session() -> requests.Session:
    current = requests.Session()
    current.headers.update({"User-Agent": USER_AGENT})
    return current


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" |-\n\t")


def normalized(value: str) -> str:
    text = unicodedata.normalize("NFKD", clean_space(value).lower())
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text)


def fetch_text(http: requests.Session, url: str) -> str:
    response = http.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def fetch_bytes(http: requests.Session, url: str) -> bytes:
    response = http.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.content


def parse_spanish_date(text: str) -> date:
    match = re.search(
        r"(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+de\s+(\d{4})",
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        raise DiarioOficialError("No fue posible reconocer la fecha de la edición.")

    month_name = normalized(match.group(2))
    month = MONTHS.get(month_name)
    if not month:
        raise DiarioOficialError(f"Mes no reconocido: {match.group(2)}")
    return date(int(match.group(3)), month, int(match.group(1)))


def extract_edition(html: str) -> Edition:
    soup = BeautifulSoup(html, "html.parser")
    page_text = clean_space(soup.get_text(" ", strip=True))
    match = re.search(
        r"Edici[oó]n\s+N[uú]m\.?\s*([0-9.]+)",
        page_text,
        flags=re.IGNORECASE,
    )
    if not match:
        raise DiarioOficialError("No fue posible reconocer el número de edición.")
    return Edition(number=match.group(1), publication_date=parse_spanish_date(page_text))


def nearby_context(link: Any) -> str:
    pieces: list[str] = []
    parent = link.parent
    if parent:
        value = clean_space(parent.get_text(" ", strip=True))
        if value:
            pieces.append(value)

    previous = link.find_previous(string=True)
    attempts = 0
    while previous and attempts < 7:
        value = clean_space(str(previous))
        if value and "ver pdf" not in value.lower():
            pieces.append(value)
        previous = previous.find_previous(string=True)
        attempts += 1

    combined = clean_space(" | ".join(dict.fromkeys(reversed(pieces))))
    combined = re.sub(r"\|\s*Ver PDF\s*\(CVE-[^)]+\)", "", combined, flags=re.IGNORECASE)
    return combined[-1600:]


def score_relevance(title: str, context: str) -> tuple[int, tuple[str, ...]]:
    title_text = normalized(title)
    context_text = normalized(context)
    score = 0
    matches: list[str] = []
    title_has_positive = False
    title_has_exclusion = False

    for term, weight in HIGH_RELEVANCE.items():
        if term in title_text:
            score += weight * 2
            title_has_positive = True
            matches.append(term)
        elif term in context_text:
            score += weight
            matches.append(term)

    for term, weight in MEDIUM_RELEVANCE.items():
        if term in title_text:
            score += weight * 2
            title_has_positive = True
            matches.append(term)
        elif term in context_text:
            score += weight
            matches.append(term)

    for term, weight in EXCLUSIONS.items():
        if term in title_text:
            score += weight * 2
            title_has_exclusion = True
            matches.append(f"EXCL:{term}")
        elif term in context_text:
            score += weight
            matches.append(f"EXCL:{term}")

    # Una exclusión explícita en el título domina coincidencias positivas que
    # pudieron filtrarse desde el contexto de la publicación anterior.
    if title_has_exclusion and not title_has_positive:
        score = min(score, -4)

    return score, tuple(dict.fromkeys(matches))


def extract_publications(html: str) -> list[Publication]:
    soup = BeautifulSoup(html, "html.parser")
    publications: list[Publication] = []
    seen_urls: set[str] = set()

    for link in soup.find_all("a", href=True):
        label = clean_space(link.get_text(" ", strip=True))
        href = str(link.get("href", "")).strip()
        if "ver pdf" not in label.lower() and ".pdf" not in href.lower():
            continue

        pdf_url = urljoin(INDEX_URL, href)
        if pdf_url in seen_urls:
            continue
        seen_urls.add(pdf_url)

        context = nearby_context(link)
        title = context
        if " | " in title:
            parts = [clean_space(part) for part in title.split(" | ") if clean_space(part)]
            if parts:
                title = parts[-1]
        title = re.sub(r"Ver PDF\s*\(CVE-[^)]+\)", "", title, flags=re.IGNORECASE)
        title = clean_space(title) or f"Publicación {label}"

        cve_match = re.search(r"CVE[-\s]?(\d+)", f"{label} {href}", flags=re.IGNORECASE)
        cve = cve_match.group(1) if cve_match else ""
        score, matches = score_relevance(title, context)
        publications.append(
            Publication(
                index=len(publications),
                title=title,
                context=context,
                pdf_url=pdf_url,
                cve=cve,
                relevance_score=score,
                matched_terms=matches,
            )
        )

    if not publications:
        raise DiarioOficialError("La edición fue encontrada, pero no se detectaron publicaciones PDF.")
    return publications


def select_candidates(publications: list[Publication], threshold: int = 4) -> list[Publication]:
    return [item for item in publications if item.relevance_score >= threshold]


def pdf_to_text(pdf_bytes: bytes, max_characters: int = MAX_PDF_CHARS) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if text:
            pages.append(text)
    return clean_space("\n".join(pages))[:max_characters]


def safe_file_stem(publication: Publication) -> str:
    cve = publication.cve or f"idx-{publication.index:03d}"
    return f"CVE-{cve}"


def save_publication_files(
    base_dir: Path,
    publication: Publication,
    pdf_bytes: bytes,
    text: str,
) -> tuple[Path, Path]:
    base_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_file_stem(publication)
    pdf_path = base_dir / f"{stem}.pdf"
    text_path = base_dir / f"{stem}.txt"
    if not pdf_path.exists():
        pdf_path.write_bytes(pdf_bytes)
    text_path.write_text(text, encoding="utf-8")
    return pdf_path, text_path
