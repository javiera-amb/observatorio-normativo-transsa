from __future__ import annotations

"""Runner productivo V4: compone catálogos normativos por comuna y delega en V3.

V4 no cambia la lógica de auditoría. Su única responsabilidad es permitir que las
fuentes oficiales crezcan por comuna sin convertir `tablas_normativas_fuente.json`
en un archivo monolítico. El bundle generado es determinista y participa del hash
que V3 usa para decidir si una comuna debe reprocesarse.
"""

import argparse
import json
import tempfile
from pathlib import Path
from typing import Any

from . import runner_v3


def _empty_catalog() -> dict[str, Any]:
    return {"source_checks": [], "review_rules": []}


def _read_catalog(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError(f"Catálogo normativo inválido: {path}")
    payload.setdefault("source_checks", [])
    payload.setdefault("review_rules", [])
    if not isinstance(payload["source_checks"], list) or not isinstance(payload["review_rules"], list):
        raise RuntimeError(f"source_checks/review_rules deben ser listas: {path}")
    return payload


def build_source_bundle(
    global_catalog_path: str | Path | None,
    commune_catalog_dir: str | Path | None,
) -> dict[str, Any]:
    bundle = _empty_catalog()
    files: list[Path] = []

    if global_catalog_path:
        global_path = Path(global_catalog_path)
        if global_path.exists():
            files.append(global_path)

    if commune_catalog_dir:
        directory = Path(commune_catalog_dir)
        if directory.exists():
            files.extend(sorted(path for path in directory.glob("*.json") if path.is_file()))

    seen_rule_ids: dict[str, Path] = {}
    for path in files:
        catalog = _read_catalog(path)
        for section in ("source_checks", "review_rules"):
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

    bundle["bundle_schema_version"] = 1
    bundle["catalog_files"] = [str(path).replace("\\", "/") for path in files]
    bundle["source_checks_count"] = len(bundle["source_checks"])
    bundle["review_rules_count"] = len(bundle["review_rules"])
    return bundle


def run(
    *,
    prc_root: str | Path,
    master_path: str | Path,
    output_dir: str | Path,
    exact_rules_path: str | Path | None = None,
    conditional_rules_path: str | Path | None = None,
    source_rules_path: str | Path | None = None,
    source_dir: str | Path | None = None,
    review_resolutions_path: str | Path | None = None,
    aliases_path: str | Path | None = None,
    coverage_path: str | Path | None = None,
    structure_path: str | Path | None = None,
    state_path: str | Path | None = None,
) -> dict[str, Any]:
    bundle = build_source_bundle(source_rules_path, source_dir)

    with tempfile.TemporaryDirectory(prefix="tui_tablas_fuentes_") as tmp:
        bundle_path = Path(tmp) / "tablas_normativas_fuentes_bundle.json"
        bundle_path.write_text(
            json.dumps(bundle, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
            encoding="utf-8",
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
            coverage_path=coverage_path,
            structure_path=structure_path,
            state_path=state_path,
        )

    result["source_catalog_files"] = bundle["catalog_files"]
    result["source_checks_count"] = bundle["source_checks_count"]
    result["review_rules_count"] = bundle["review_rules_count"]
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Procesa PRC + tabla con catálogos oficiales globales y por comuna."
    )
    parser.add_argument("--prc-root", required=True)
    parser.add_argument("--master", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--exact-rules", default="config/tablas_normativas_reglas.json")
    parser.add_argument("--conditional-rules", default="config/tablas_normativas_condicionales.json")
    parser.add_argument("--source-rules", default="config/tablas_normativas_fuente.json")
    parser.add_argument("--source-dir", default="config/tablas_normativas_fuentes")
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
        "source_checks": result.get("source_checks_count", 0),
        "review_rules": result.get("review_rules_count", 0),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
