from __future__ import annotations

import re
from dataclasses import dataclass, field

from .normalization import normalize_text


REGION_ALIASES: dict[str, str] = {
    "arica y parinacota": "Región de Arica y Parinacota",
    "tarapaca": "Región de Tarapacá",
    "antofagasta": "Región de Antofagasta",
    "atacama": "Región de Atacama",
    "coquimbo": "Región de Coquimbo",
    "valparaiso": "Región de Valparaíso",
    "metropolitana": "Región Metropolitana de Santiago",
    "ohiggins": "Región del Libertador General Bernardo O'Higgins",
    "maule": "Región del Maule",
    "nuble": "Región de Ñuble",
    "biobio": "Región del Biobío",
    "la araucania": "Región de La Araucanía",
    "los rios": "Región de Los Ríos",
    "los lagos": "Región de Los Lagos",
    "aysen": "Región de Aysén del General Carlos Ibáñez del Campo",
    "magallanes": "Región de Magallanes y de la Antártica Chilena",
}

COMMUNE_TO_REGION: dict[str, str] = {
    "arica": "Región de Arica y Parinacota",
    "iquique": "Región de Tarapacá",
    "alto hospicio": "Región de Tarapacá",
    "antofagasta": "Región de Antofagasta",
    "calama": "Región de Antofagasta",
    "copiapo": "Región de Atacama",
    "vallenar": "Región de Atacama",
    "la serena": "Región de Coquimbo",
    "coquimbo": "Región de Coquimbo",
    "ovalle": "Región de Coquimbo",
    "valparaiso": "Región de Valparaíso",
    "vina del mar": "Región de Valparaíso",
    "quilpue": "Región de Valparaíso",
    "villa alemana": "Región de Valparaíso",
    "san antonio": "Región de Valparaíso",
    "santiago": "Región Metropolitana de Santiago",
    "puente alto": "Región Metropolitana de Santiago",
    "maipu": "Región Metropolitana de Santiago",
    "las condes": "Región Metropolitana de Santiago",
    "providencia": "Región Metropolitana de Santiago",
    "rancagua": "Región del Libertador General Bernardo O'Higgins",
    "machali": "Región del Libertador General Bernardo O'Higgins",
    "curico": "Región del Maule",
    "talca": "Región del Maule",
    "linares": "Región del Maule",
    "chillan": "Región de Ñuble",
    "concepcion": "Región del Biobío",
    "talcahuano": "Región del Biobío",
    "los angeles": "Región del Biobío",
    "temuco": "Región de La Araucanía",
    "padre las casas": "Región de La Araucanía",
    "valdivia": "Región de Los Ríos",
    "osorno": "Región de Los Lagos",
    "puerto montt": "Región de Los Lagos",
    "puerto varas": "Región de Los Lagos",
    "castro": "Región de Los Lagos",
    "coyhaique": "Región de Aysén del General Carlos Ibáñez del Campo",
    "punta arenas": "Región de Magallanes y de la Antártica Chilena",
}


@dataclass(slots=True)
class TerritoryDetection:
    scale: str
    region: str = ""
    commune: str = ""
    matched_terms: list[str] = field(default_factory=list)
    confidence: float = 0.0


def _contains_term(text: str, term: str) -> bool:
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", text))


def detect_territory(title: str, excerpt: str = "") -> TerritoryDetection:
    text = normalize_text(f"{title} {excerpt}")

    matched_communes: list[str] = []
    for commune in sorted(COMMUNE_TO_REGION, key=len, reverse=True):
        if _contains_term(text, commune):
            matched_communes.append(commune)

    unique_communes = list(dict.fromkeys(matched_communes))
    if len(unique_communes) == 1:
        commune = unique_communes[0]
        return TerritoryDetection(
            scale="communal",
            region=COMMUNE_TO_REGION[commune],
            commune=commune.title(),
            matched_terms=[commune],
            confidence=0.9,
        )
    if len(unique_communes) > 1:
        regions = {COMMUNE_TO_REGION[item] for item in unique_communes}
        return TerritoryDetection(
            scale="multiple",
            region=next(iter(regions)) if len(regions) == 1 else "",
            matched_terms=unique_communes,
            confidence=0.75,
        )

    matched_regions: list[str] = []
    for alias, canonical in REGION_ALIASES.items():
        if _contains_term(text, alias):
            matched_regions.append(canonical)

    unique_regions = list(dict.fromkeys(matched_regions))
    if len(unique_regions) == 1:
        return TerritoryDetection(
            scale="regional",
            region=unique_regions[0],
            matched_terms=unique_regions,
            confidence=0.8,
        )
    if len(unique_regions) > 1:
        return TerritoryDetection(
            scale="interregional",
            matched_terms=unique_regions,
            confidence=0.7,
        )

    national_terms = ("chile", "nacional", "a nivel pais", "todo el pais")
    if any(_contains_term(text, normalize_text(term)) for term in national_terms):
        return TerritoryDetection(scale="national", matched_terms=["chile"], confidence=0.7)

    return TerritoryDetection(scale="undetermined", confidence=0.0)
