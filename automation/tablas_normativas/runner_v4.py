from __future__ import annotations

"""Runner productivo V4: auditoría incremental con catálogos oficiales por comuna.

Reglas operacionales:
- una comuna con catálogo parcial se AUDITA y acumula QA/correcciones;
- sólo una comuna con cobertura oficial COMPLETA puede publicarse en NORMALIZADAS;
- una comuna con VERSION_MIGRATION queda SIEMPRE bloqueada hasta cerrar la migración;
- los productos de auditorías parciales/migraciones se escriben sólo en temporales;
- nunca se inventa CODIGO_PRC para resolver un cambio de zonificación.
"""

import argparse
import json
import tempfile
from pathlib import Path
from typing import Any

from . import runner_v3
from . import version_migration


_CATALOG_SECTIONS = ("source_checks", "review_rules", "coverage_checks")


def _empty_catalog() -> dict[str, Any]:
    return {section: [] for section in _CATALOG_SECTIONS}


def _key(value: Any) -> str:
    return runner_v3.base_runner._key(value)


def _read_catalog(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError(f"Catálogo normativo inválido: {path}")
    for section in _CATALOG_SECTIONS:
        payload.setdefault(section, [])
        if not isinstance(payload[section], list):
            raise RuntimeError(f"{section} debe ser una lista: {path}")
    return payload


def build_source_bundle(
    global_catalog_path: str | Path | None,
    commune_catalog_dir: str | Path | None,
) -> dict[str, Any]:
    bundle = _empty_catalog()
    files: list[Path] = []
    commune_catalogs: dict[str, dict[str, Any]] = {}

    if global_catalog_path:
        global_path = Path(global_catalog_path)
        if global_path.exists():
            files.append(global_path)

    commune_files: list[Path] = []
    if commune_catalog_dir:
        directory = Path(commune_catalog_dir)
        if directory.exists():
            commune_files = sorted(path for path in directory.glob("*.json") if path.is_file())
            files.extend(commune_files)

    seen_rule_ids: dict[str, Path] = {}
    for path in files:
        catalog = _read_catalog(path)
        if path in commune_files:
            comuna = str(catalog.get("comuna") or "").strip()
            if not comuna:
                raise RuntimeError(f"Catálogo comunal sin COMUNA: {path}")
            key = _key(comuna)
            path_text = str(path).replace("\\", "/")
            entry = commune_catalogs.setdefault(key, {
                "comuna": comuna,
                "archivo": path_text,
                "archivos": [],
                "estado_cobertura": "PARCIAL",
                "_estados_cobertura_explicitos": [],
            })
            entry["archivos"].append(path_text)
            explicit_state = str(catalog.get("estado_cobertura") or "").strip().upper()
            if explicit_state:
                entry["_estados_cobertura_explicitos"].append(explicit_state)
                entry["estado_cobertura"] = (
                    "COMPLETA"
                    if all(
                        state == "COMPLETA"
                        for state in entry["_estados_cobertura_explicitos"]
                    )
                    else "PARCIAL"
                )

        for section in _CATALOG_SECTIONS:
            for rule in catalog.get(section, []):
                if not isinstance(rule, dict):
                    raise RuntimeError(f"Regla inválida en {path}: {rule!r}")
                rule_id = str(rule.get("id") or "").strip()
                if not rule_id:
                    raise RuntimeError(f"Regla sin id en {path}")
                if rule_id in seen_rule_ids:
                    raise RuntimeError(
                        f"ID de regla duplicado '{rule_id}' en {path} y {seen_rule_ids[rule_id]}"
                    )
                seen_rule_ids[rule_id] = path
                bundle[section].append(rule)

    for meta in commune_catalogs.values():
        meta.pop("_estados_cobertura_explicitos", None)

    bundle["bundle_schema_version"] = 4
    bundle["catalog_files"] = [str(path).replace("\\", "/") for path in files]
    bundle["commune_catalogs"] = commune_catalogs
    bundle["source_checks_count"] = len(bundle["source_checks"])
    bundle["review_rules_count"] = len(bundle["review_rules"])
    bundle["coverage_checks_count"] = len(bundle["coverage_checks"])
    return bundle


def _load_coverage(path: str | Path | None) -> dict[str, Any]:
    if not path:
        return {"schema_version": 1, "por_comuna": {}}
    file_path = Path(path)
    if not file_path.exists():
        return {"schema_version": 1, "por_comuna": {}}
    payload = json.loads(file_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("Catálogo de cobertura inválido.")
    payload.setdefault("por_comuna", {})
    return payload


def _coverage_state(catalog: dict[str, Any], comuna: str) -> str:
    target = _key(comuna)
    for name, item in (catalog.get("por_comuna") or {}).items():
        if _key(name) != target:
            continue
        if isinstance(item, str):
            return item.upper()
        return str((item or {}).get("estado") or "PENDIENTE").upper()
    return "PENDIENTE"


def _set_coverage_state(catalog: dict[str, Any], comuna: str, state: str, marker: str) -> None:
    registry = catalog.setdefault("por_comuna", {})
    key = _key(comuna)
    found = next((name for name in registry if _key(name) == key), comuna)
    current = registry.get(found)
    item = dict(current) if isinstance(current, dict) else {"nota": str(current or "")}
    item["estado"] = state
    item[marker] = True
    registry[found] = item


def _promote_catalogued_communes_for_audit(
    coverage: dict[str, Any],
    commune_catalogs: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any], set[str]]:
    promoted = json.loads(json.dumps(coverage, ensure_ascii=False))
    partial_keys: set[str] = set()

    for key, meta in commune_catalogs.items():
        comuna = str(meta["comuna"])
        actual = _coverage_state(coverage, comuna)
        if actual == "COMPLETA":
            continue
        partial_keys.add(key)
        _set_coverage_state(promoted, comuna, "COMPLETA", "_promovida_solo_para_auditoria")

    return promoted, partial_keys


def _block_migration_communes(
    coverage: dict[str, Any],
    plans: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    blocked = json.loads(json.dumps(coverage, ensure_ascii=False))
    for plan in plans.values():
        _set_coverage_state(
            blocked,
            str(plan.get("comuna") or ""),
            "PARCIAL",
            "_bloqueada_por_migracion_version",
        )
    return blocked


def _merge_partial_audit(
    primary: dict[str, Any],
    audit_only: dict[str, Any],
    partial_keys: set[str],
    coverage: dict[str, Any],
) -> None:
    metric_fields = {
        "correcciones_confirmadas", "posibles", "normalizaciones_formato", "conflictos",
        "hallazgos_bloqueantes", "confirmed_unresolved", "coverage_missing",
        "poligonos", "filas_normativas", "codigos_prc", "codigos_tabla", "sin_normativa",
        "sin_geometria", "campos_estructurales_reparables", "hoja", "hojas_equivalentes",
        "fingerprint",
    }

    for key in partial_keys:
        audited = (audit_only.get("comunas") or {}).get(key)
        if not audited:
            continue
        current = (primary.get("comunas") or {}).setdefault(
            key, {"comuna": audited.get("comuna", key)}
        )

        if audited.get("estado") in {"ERROR ESTRUCTURAL", "ERROR VÍNCULO", "FALTA TABLA"}:
            current.update(audited)
            current["publicable"] = False
            current["auditoria_ejecutada"] = False
            continue

        for field in metric_fields:
            if field in audited:
                current[field] = audited[field]
        current["errores"] = list(audited.get("errores") or [])
        current["cobertura_fuentes"] = _coverage_state(
            coverage, str(current.get("comuna") or "")
        )
        current["auditoria_ejecutada"] = True
        current["publicable"] = False
        current.pop("salida", None)
        current.pop("sin_cambios", None)

        if audited.get("estado") == "CON OBSERVACIONES":
            current["estado"] = "CON OBSERVACIONES"
            current["motivo_no_publicacion"] = (
                "La auditoría encontró hallazgos bloqueantes y la cobertura oficial aún no está completa."
            )
        else:
            current["estado"] = "AUDITADA · FUENTES PARCIALES"
            current["motivo_no_publicacion"] = (
                "La tabla pasó los controles disponibles, pero no se publica hasta completar el catálogo oficial de la comuna."
            )


def _apply_version_migration_status(
    result: dict[str, Any],
    plans: dict[str, dict[str, Any]],
    master_path: str | Path,
) -> None:
    if not plans:
        return
    master_index = runner_v3.base_runner._master_index(Path(master_path))

    for key, plan in plans.items():
        item = (result.get("comunas") or {}).get(key)
        master_item = master_index.get(key)
        if not item or not master_item:
            continue
        _, rows = runner_v3.base_runner._read_master_sheet(
            Path(master_path), master_item["sheet"]
        )
        legacy_zones = sorted({
            str(row.get("ZONA") or "").strip()
            for row in rows
            if str(row.get("ZONA") or "").strip()
        })
        analysis = version_migration.analyze_zone_migration(plan, legacy_zones)
        item["migracion_normativa"] = analysis
        if not analysis["migration_required"]:
            continue

        item["estado"] = "MIGRACIÓN NORMATIVA REQUERIDA"
        item["publicable"] = False
        item["auditoria_ejecutada"] = bool(item.get("auditoria_ejecutada", False))
        item["motivo_no_publicacion"] = (
            "La zonificación vigente difiere de la versión representada por la tabla maestra. "
            "Debe reconstruirse la versión vigente con fuente oficial y CODIGO_PRC espacial demostrado."
        )
        item["zonas_legacy"] = analysis["legacy_zones"]
        item["zonas_vigentes_esperadas"] = analysis["current_zones"]
        item["zonas_legacy_sin_explicar"] = analysis["unexplained_legacy_zones"]
        item["zonas_vigentes_sin_explicar"] = analysis["unexplained_current_zones"]
        item["migracion_estructuralmente_explicada"] = analysis["structurally_explained"]
        item.pop("salida", None)
        item.pop("sin_cambios", None)


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
    bundle = build_source_bundle(source_rules_path, source_dir)
    migrations = version_migration.load_migration_plans(migration_dir)
    coverage = _load_coverage(coverage_path)
    execution_coverage = _block_migration_communes(coverage, migrations)
    promoted_coverage, partial_keys = _promote_catalogued_communes_for_audit(
        execution_coverage, bundle.get("commune_catalogs", {})
    )
    partial_keys.update(migrations.keys())
    actual_state_path = Path(state_path) if state_path else runner_v3.base_runner._default_state_path()

    with tempfile.TemporaryDirectory(prefix="tui_tablas_fuentes_") as tmp:
        tmp_root = Path(tmp)
        bundle_path = tmp_root / "tablas_normativas_fuentes_bundle.json"
        bundle_path.write_text(
            json.dumps(bundle, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
            encoding="utf-8",
        )
        execution_coverage_path = tmp_root / "cobertura_ejecucion.json"
        execution_coverage_path.write_text(
            json.dumps(execution_coverage, ensure_ascii=False, sort_keys=True), encoding="utf-8"
        )

        result = runner_v3.run(
            prc_root=prc_root,
            master_path=master_path,
            output_dir=output_dir,
            exact_rules_path=exact_rules_path,
            conditional_rules_path=conditional_rules_path,
            source_rules_path=bundle_path,
            review_resolutions_path=review_resolutions_path,
            aliases_path=aliases_path,
            coverage_path=execution_coverage_path,
            structure_path=structure_path,
            state_path=actual_state_path,
        )

        if partial_keys:
            promoted_path = tmp_root / "cobertura_solo_auditoria.json"
            promoted_path.write_text(
                json.dumps(promoted_coverage, ensure_ascii=False, sort_keys=True),
                encoding="utf-8",
            )
            audit_output = tmp_root / "salidas_no_publicables"
            audit_state = tmp_root / "estado_auditoria_parcial.json"
            audit_only = runner_v3.run(
                prc_root=prc_root,
                master_path=master_path,
                output_dir=audit_output,
                exact_rules_path=exact_rules_path,
                conditional_rules_path=conditional_rules_path,
                source_rules_path=bundle_path,
                review_resolutions_path=review_resolutions_path,
                aliases_path=aliases_path,
                coverage_path=promoted_path,
                structure_path=structure_path,
                state_path=audit_state,
            )
            _merge_partial_audit(result, audit_only, partial_keys, coverage)

    _apply_version_migration_status(result, migrations, master_path)

    result["source_catalog_files"] = bundle["catalog_files"]
    result["source_checks_count"] = bundle["source_checks_count"]
    result["review_rules_count"] = bundle["review_rules_count"]
    result["coverage_checks_count"] = bundle["coverage_checks_count"]
    result["commune_catalogs"] = bundle.get("commune_catalogs", {})
    result["partial_audit_communes"] = sorted(partial_keys)
    result["version_migration_communes"] = sorted(migrations.keys())

    actual_state_path.parent.mkdir(parents=True, exist_ok=True)
    actual_state_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audita tablas, soporta migraciones normativas y publica sólo versiones vigentes completas."
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
    for item in result["comunas"].values():
        counts[item["estado"]] = counts.get(item["estado"], 0) + 1
    print(json.dumps({
        "estados": counts,
        "catalogos_fuente": len(result.get("source_catalog_files", [])),
        "comunas_auditadas_con_fuentes_parciales": len(result.get("partial_audit_communes", [])),
        "comunas_en_migracion_normativa": len(result.get("version_migration_communes", [])),
        "source_checks": result.get("source_checks_count", 0),
        "review_rules": result.get("review_rules_count", 0),
        "coverage_checks": result.get("coverage_checks_count", 0),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())