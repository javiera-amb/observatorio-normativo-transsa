from __future__ import annotations

"""Runner V5: auditoría de tabla + gate obligatorio de vigencia normativa."""

import argparse
import json
from pathlib import Path
from typing import Any

from . import runner_v4
from . import vigencia_gate


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
    tracking_path: str | Path = "data/seguimiento_normativo.js",
    certificate_dir: str | Path = "config/tablas_normativas_vigencia",
    policy_path: str | Path = "config/tablas_normativas_vigencia_policy.json",
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
    vigencia_gate.apply_gate(
        result,
        tracking_path=tracking_path,
        certificate_dir=certificate_dir,
        policy_path=policy_path,
    )
    actual_state = Path(state_path) if state_path else runner_v4.runner_v3.base_runner._default_state_path()
    actual_state.parent.mkdir(parents=True, exist_ok=True)
    actual_state.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audita tablas y bloquea publicación si la vigencia normativa no está sincronizada."
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
    parser.add_argument("--tracking", default="data/seguimiento_normativo.js")
    parser.add_argument("--certificate-dir", default="config/tablas_normativas_vigencia")
    parser.add_argument("--policy", default="config/tablas_normativas_vigencia_policy.json")
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
        tracking_path=args.tracking,
        certificate_dir=args.certificate_dir,
        policy_path=args.policy,
        state_path=args.state,
    )
    counts: dict[str, int] = {}
    for item in (result.get("comunas") or {}).values():
        state = str(item.get("estado") or "SIN ESTADO")
        counts[state] = counts.get(state, 0) + 1
    print(json.dumps({
        "estados": counts,
        "certificados_vigencia": result.get("certificados_vigencia", 0),
        "regla": "fail_closed",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
