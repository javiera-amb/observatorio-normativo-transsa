from __future__ import annotations

from dataclasses import dataclass, field

from .models import NewsSource
from .normalization import normalize_text
from .territory import detect_territory


FOREIGN_ALIASES: dict[str, str] = {
    "argentina": "Argentina",
    "buenos aires": "Argentina",
    "brasil": "Brasil",
    "sao paulo": "Brasil",
    "rio de janeiro": "Brasil",
    "colombia": "Colombia",
    "bogota": "Colombia",
    "medellin": "Colombia",
    "mexico": "México",
    "mexico df": "México",
    "cdmx": "México",
    "monterrey": "México",
    "guadalajara": "México",
    "queretaro": "México",
    "mxn": "México",
    "peru": "Perú",
    "lima": "Perú",
    "uruguay": "Uruguay",
    "montevideo": "Uruguay",
    "estados unidos": "Estados Unidos",
    "united states": "Estados Unidos",
    "usa": "Estados Unidos",
    "miami": "Estados Unidos",
    "nueva york": "Estados Unidos",
    "new york": "Estados Unidos",
    "espana": "España",
    "madrid": "España",
    "barcelona": "España",
    "reino unido": "Reino Unido",
    "londres": "Reino Unido",
    "china": "China",
    "beijing": "China",
    "shanghai": "China",
}


@dataclass(slots=True)
class GeographicScope:
    scope: str
    country: str = ""
    reasons: list[str] = field(default_factory=list)
    confidence: float = 0.0


def detect_geographic_scope(title: str, excerpt: str, source: NewsSource) -> GeographicScope:
    """Clasifica una noticia como Chile, internacional o indeterminada.

    La clasificación territorial chilena tiene prioridad. Una fuente con cobertura
    regional o exclusivamente chilena se considera Chile salvo que exista una señal
    internacional explícita. Las fuentes latinoamericanas o internacionales no se
    fuerzan a Chile cuando el texto no entrega evidencia suficiente.
    """

    text = normalize_text(f"{title} {excerpt}")
    territory = detect_territory(title, excerpt)
    if territory.scale != "undetermined":
        return GeographicScope(
            scope="chile",
            country="Chile",
            reasons=territory.matched_terms or [territory.scale],
            confidence=max(0.75, territory.confidence),
        )

    foreign_matches: list[tuple[str, str]] = []
    padded = f" {text} "
    for alias, country in FOREIGN_ALIASES.items():
        normalized_alias = normalize_text(alias)
        if f" {normalized_alias} " in padded:
            foreign_matches.append((alias, country))

    if foreign_matches:
        countries = list(dict.fromkeys(country for _, country in foreign_matches))
        return GeographicScope(
            scope="international",
            country=countries[0] if len(countries) == 1 else "Internacional",
            reasons=[alias for alias, _ in foreign_matches],
            confidence=0.9 if len(countries) == 1 else 0.75,
        )

    coverage = {normalize_text(value) for value in source.coverage}
    if coverage and coverage <= {"chile", "regiones"}:
        return GeographicScope(
            scope="chile",
            country="Chile",
            reasons=["cobertura_fuente"],
            confidence=0.65,
        )
    if any(value.startswith("region de ") or value.startswith("region_") for value in coverage):
        return GeographicScope(
            scope="chile",
            country="Chile",
            reasons=["cobertura_regional_fuente"],
            confidence=0.75,
        )

    return GeographicScope(scope="undetermined", confidence=0.0)
