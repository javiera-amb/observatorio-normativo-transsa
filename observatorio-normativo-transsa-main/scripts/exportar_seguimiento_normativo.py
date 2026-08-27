from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "consolidados" / "vigencia" / "consolidado_sig_comunal.csv"
OUTPUT = ROOT / "data" / "seguimiento_normativo.js"


REGION_ORDER = [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana de Santiago",
    "Libertador General Bernardo O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén del General Carlos Ibáñez del Campo",
    "Magallanes y de la Antártica Chilena",
]


MISSING_COMMUNES = [
    ("Tarapacá", "Camiña"),
    ("Tarapacá", "Colchane"),
    ("Atacama", "Alto del Carmen"),
    ("Maule", "Pelarco"),
    ("Maule", "San Rafael"),
    ("Los Lagos", "Cochamó"),
    ("Los Lagos", "Curaco de Vélez"),
    ("Los Lagos", "Futaleufú"),
    ("Aysén del General Carlos Ibáñez del Campo", "Cochrane"),
    ("Aysén del General Carlos Ibáñez del Campo", "O'Higgins"),
    ("Magallanes y de la Antártica Chilena", "Antártica"),
    ("Magallanes y de la Antártica Chilena", "Primavera"),
    ("Magallanes y de la Antártica Chilena", "Río Verde"),
    ("Magallanes y de la Antártica Chilena", "Timaukel"),
    ("Metropolitana de Santiago", "Alhué"),
    ("Metropolitana de Santiago", "María Pinto"),
    ("Metropolitana de Santiago", "San Pedro"),
]


def consumo_propieteq(apto: str) -> str:
    return {
        "SI": "disponible",
        "REVISAR": "usar_con_revision",
        "NO": "no_disponible",
    }.get(apto, "no_disponible")


def estado_auditoria(apto: str) -> str:
    return {
        "SI": "control_preliminar",
        "REVISAR": "pendiente_revision",
        "NO": "sin_cartografia",
    }.get(apto, "sin_iniciar")


def normalize_row(row: dict[str, str]) -> dict[str, object]:
    apto = (row.get("apto_para_visor") or "NO").strip()
    return {
        "region": (row.get("region") or "").strip(),
        "comuna": (row.get("comuna") or "").strip(),
        "prc_nombre": (row.get("prc_nombre") or "").strip(),
        "prc_fecha": (row.get("prc_fecha") or "").strip(),
        "estado_fuente": (row.get("estado_principal_label") or "").strip(),
        "apto_para_visor": apto,
        "consumo_propieteq": consumo_propieteq(apto),
        "estado_auditoria": estado_auditoria(apto),
        "motivo": (row.get("motivo") or "").strip(),
        "actos_posteriores": int((row.get("actos_posteriores") or "0").strip() or 0),
        "ultimo_acto_posterior": (row.get("ultimo_acto_posterior") or "").strip(),
        "archivo_recomendado": (row.get("archivo_recomendado") or "").strip(),
        "capa_recomendada": (row.get("capa_recomendada") or "").strip(),
        "controles_pendientes": None,
        "controles_totales": None,
        "ultima_revision": "",
        "ficha_disponible": False,
    }


def missing_row(region: str, comuna: str) -> dict[str, object]:
    return {
        "region": region,
        "comuna": comuna,
        "prc_nombre": "",
        "prc_fecha": "",
        "estado_fuente": "Sin información comunal consolidada",
        "apto_para_visor": "NO",
        "consumo_propieteq": "no_disponible",
        "estado_auditoria": "sin_iniciar",
        "motivo": "La comuna no estaba incluida en el consolidado SIG/IPT de origen. Debe revisarse sin inferir que carece de normativa.",
        "actos_posteriores": 0,
        "ultimo_acto_posterior": "",
        "archivo_recomendado": "",
        "capa_recomendada": "",
        "controles_pendientes": None,
        "controles_totales": None,
        "ultima_revision": "",
        "ficha_disponible": False,
    }


def apply_known_overrides(rows: list[dict[str, object]]) -> None:
    for row in rows:
        if row["comuna"] != "Coquimbo":
            continue
        row.update(
            {
                "estado_fuente": "FeatureServer 2026 identificado · validación final pendiente",
                "apto_para_visor": "REVISAR",
                "consumo_propieteq": "usar_con_revision",
                "estado_auditoria": "auditoria_avanzada",
                "motivo": "La correspondencia con el PRC 2026 es alta, pero quedan cinco controles documentales, de catálogo, atributos o topología.",
                "archivo_recomendado": "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer",
                "capa_recomendada": "Capas 3, 30, 31 y 32",
                "controles_pendientes": 5,
                "controles_totales": 6,
                "ultima_revision": "2026-08-11",
                "ficha_disponible": True,
            }
        )


def main() -> None:
    with SOURCE.open(encoding="utf-8-sig", newline="") as source_file:
        rows = [normalize_row(row) for row in csv.DictReader(source_file, delimiter=";")]

    existing = {(str(row["region"]), str(row["comuna"])) for row in rows}
    for region, comuna in MISSING_COMMUNES:
        if (region, comuna) not in existing:
            rows.append(missing_row(region, comuna))

    apply_known_overrides(rows)
    order = {region: index for index, region in enumerate(REGION_ORDER)}
    rows.sort(key=lambda row: (order.get(str(row["region"]), 99), str(row["comuna"]).casefold()))

    if len(rows) != 346:
        raise RuntimeError(f"El seguimiento debe contener 346 comunas y contiene {len(rows)}")

    summary = {
        "total": len(rows),
        "disponibles": sum(row["consumo_propieteq"] == "disponible" for row in rows),
        "con_revision": sum(row["consumo_propieteq"] == "usar_con_revision" for row in rows),
        "no_disponibles": sum(row["consumo_propieteq"] == "no_disponible" for row in rows),
        "ultima_actualizacion": "2026-08-11",
        "alcance": "Todas las comunas de Chile",
    }
    payload = {"resumen": summary, "comunas": rows}
    OUTPUT.write_text(
        "window.SEGUIMIENTO_NORMATIVO = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Seguimiento exportado: {len(rows)} comunas -> {OUTPUT}")


if __name__ == "__main__":
    main()
