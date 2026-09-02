from __future__ import annotations

"""Runner V5: V4 + diagnóstico espacial automático de migraciones normativas.

No crea filas ni CODIGO_PRC. Sólo lee el GPKG productivo y registra qué unidades
vigentes tienen vínculo espacial demostrado para que la reconstrucción posterior sea segura.
"""

import argparse
import json
from pathlib import Path
from typing import Any

from . import runner_v4
from . import spatial_mapping
from . import version_migration


def _key(value: Any) -> str:
    return version_migration._key(value)


def enrich_spatial_migrations(
    result: dict[str, Any],
    migration_dir: str | Path | None,
) -> dict[str, Any]:
    plans = version_migration.load_migration_plans(migration_dir)
    for key, plan in plans.items():
        item = (result.get("comunas") or {}).get(key)
        if not item:
            continue
        migration = item.setdefault("migracion_normativa", {})
        gpkg_text = str(item.get("gpkg") or "").strip()
        if not gpkg_text:
            migration["mapeo_espacial_prc"] = {
                "state": "MAPEO ESPACIAL PENDIENTE",
                "mapping_complete": False,
                "error": "No se encontró GPKG productivo para la comuna."
            }
            continue

        try:
            polygon_count, layer, pairs = spatial_mapping.read_prc_zone_code_pairs(gpkg_text)
            spatial = spatial_mapping.analyze_spatial_zone_mapping(plan, pairs)
            spatial["prc_layer"] = layer
            spatial["polygon_count"] = polygon_count
            migration["mapeo_espacial_prc"] = spatial
            item["zonas_vigentes_resueltas_espacialmente"] = sorted(
                spatial.get("codes_by_current_zone", {}).keys()
            )
            item["zonas_vigentes_faltantes_en_prc"] = list(
                spatial.get("current_zones_missing_in_prc", [])
            )
            item["codigos_por_zona_vigente"] = dict(
                spatial.get("codes_by_current_zone", {})
            )
            item["mapeo_espacial_completo"] = bool(spatial.get("mapping_complete"))
        except Exception as exc:
            migration["mapeo_espacial_prc"] = {
                "state": "MAPEO ESPACIAL PENDIENTE",
                "mapping_complete": False,
                "error": str(exc),
            }
            item["mapeo_espacial_completo"] = False

        # Aunque el GPKG ya contenga todas las zonas, V5 no crea ni publica filas nuevas.
        # El mapeo es evidencia para la siguiente etapa de reconstrucción normativa.
        if item.get("estado") == "MIGRACIÓN NORMATIVA REQUERIDA":
            item["publicable"] = False

    return result


def run(
    *,
    prc_root: str | Path,
    master_path: str | Path,
    output_dir: str | Path,
    exact_rules_path: str | Path | None = None,
    conditional_rules_path: str | Path | None = None,
    source_rules_path: str | Path | None = None,
    source_dir: str | Path | None = None,
    migration_dir: str | Path | None = None,
    review_resolutions_path: str | Path | None = None,
    aliases_path: str | Path | None = None,
    coverage_path: str | Path | None = None,
    structure_path: str | Path | None = None,
    state_path: str | Path | None = None,
) -> dict[str, Any]:
    result = runner_v4.run(
        prc_root=prc_root,
        master_path=master_path,
        output_dir=output_dir,
        exact_rules_path=exact_rules_path,
        conditional_rules_path=conditional_rules_path,
        source_rules_path=source_rules_path,
        source_dir=source_dir,
        migration_dir=migration_dir,
        review_resolutions_path=review_resolutions_path,
        aliases_path=aliases_path,
        coverage_path=coverage_path,
        structure_path=structure_path,
        state_path=state_path,
    )
    enrich_spatial_migrations(result, migration_dir)

    if state_path:
        state = Path(state_path)
        state.parent.mkdir(parents=True, exist_ok=True)
        state.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audita tablas y resuelve diagnóstico ZONA↔CODIGO_PRC de migraciones desde el GPKG."
    )
    parser.add_argument("--prc-root", required=True)
    parser.add_argument("--master", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--exact-rules", default="config/tablas_normativas_reglas.json")
    parser.add_argument("--conditional-rules", default="config/tablas_normativas_condicionales.json")
    parser.add_argument("--source-rules", default="config/tablas_normativas_fuente.json")
    parser.add_argument("--source-dir", default="config/tablas_normativas_fuentes")
    parser.add_argument("--migration-dir", default="config/tablas_normativas_migraciones")
    parser.add_argument("--review-resolutions", default="config/tablas_normativas_revisiones_resueltas.json")
    parser.add_argument("--aliases", default="config/tablas_normativas_codigo_aliases.json")
    parser.add_argument("--coverage", default="config/tablas_normativas_cobertura.json")
    parser.add_argument("--structure", default="config/tablas_normativas_estructura.json")
    parser.add_argument("--state")
    args = parser.parse_args()

    result = run(
        prc_root=args.prc_root,
        master_path=args.master,
        output_dir=args.output,
        exact_rules_path=args.exact_rules,
        conditional_rules_path=args.conditional_rules,
        source_rules_path=args.source_rules,
        source_dir=args.source_dir,
        migration_dir=args.migration_dir,
        review_resolutions_path=args.review_resolutions,
        aliases_path=args.aliases,
        coverage_path=args.coverage,
        structure_path=args.structure,
        state_path=args.state,
    )
    counts: dict[str, int] = {}
    for item in result.get("comunas", {}).values():
        counts[item.get("estado", "PENDIENTE")] = counts.get(item.get("estado", "PENDIENTE"), 0) + 1
    migration_summary = {
        key: {
            "comuna": item.get("comuna"),
            "mapeo_espacial_completo": item.get("mapeo_espacial_completo", False),
            "faltantes": item.get("zonas_vigentes_faltantes_en_prc", []),
        }
        for key, item in result.get("comunas", {}).items()
        if "migracion_normativa" in item
    }
    print(json.dumps({"estados": counts, "migraciones": migration_summary}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
