from __future__ import annotations

"""Runner V5: auditoría + certificación + gate obligatorio de vigencia normativa.

La salida productiva se construye primero en staging temporal. Ningún XLSX llega a
NORMALIZADAS hasta que seguimiento, auditoría, evidencia y SIG aprueben la misma
version_normativa_id. Si una salida previamente publicada deja de ser válida, se
mueve a BLOQUEADAS_VIGENCIA en vez de quedar disponible como si siguiera vigente.
"""

import argparse
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any

from . import certification
from . import runner_v4
from . import vigencia_gate


def _normalized_name(comuna: str) -> str:
    safe = runner_v4.runner_v3.base_runner._safe(comuna)
    return f"PRC_{safe}_NORMALIZADO.xlsx"


def _publish_after_gate(
    result: dict[str, Any],
    *,
    staging_output: Path,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    quarantine = output_dir.parent / "BLOQUEADAS_VIGENCIA"

    for commune_key, item in (result.get("comunas") or {}).items():
        comuna = str(item.get("comuna") or commune_key)
        filename = _normalized_name(comuna)
        staged = staging_output / filename
        target = output_dir / filename
        assessment = item.get("vigencia_normativa") or {}
        certified = bool(assessment.get("vigencia_certificada"))
        publishable = item.get("publicable") is True

        if certified and publishable:
            if not staged.exists():
                raise RuntimeError(
                    f"{comuna}: el gate aprobó la comuna pero no existe salida staged {staged}."
                )
            shutil.copy2(staged, target)
            item["salida"] = str(target)
            item["publicada_tras_gate_vigencia"] = True
            continue

        item.pop("salida", None)
        item["publicada_tras_gate_vigencia"] = False
        if not target.exists():
            continue

        quarantine.mkdir(parents=True, exist_ok=True)
        blocked_target = quarantine / filename
        if blocked_target.exists():
            blocked_target.unlink()
        shutil.move(str(target), str(blocked_target))
        item["normalizada_retirada_por_vigencia"] = str(blocked_target)


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
    evidence_dir: str | Path = "config/tablas_normativas_vigencia_evidencia",
    policy_path: str | Path = "config/tablas_normativas_vigencia_policy.json",
    sig_path: str | Path = "consolidados/vigencia/consolidado_sig_comunal.csv",
) -> dict[str, Any]:
    actual_output = Path(output_dir)
    actual_state = (
        Path(state_path)
        if state_path
        else runner_v4.runner_v3.base_runner._default_state_path()
    )

    with tempfile.TemporaryDirectory(prefix="tui_tablas_v5_") as tmp:
        tmp_root = Path(tmp)
        staging_output = tmp_root / "NORMALIZADAS_STAGING"
        staging_state = tmp_root / "estado_v4_pre_gate.json"

        result = runner_v4.run(
            prc_root=prc_root,
            master_path=master_path,
            output_dir=staging_output,
            exact_rules_path=exact_rules_path,
            conditional_rules_path=conditional_rules_path,
            source_rules_path=source_rules_path,
            source_dir=source_dir,
            migration_dir=migration_dir,
            review_resolutions_path=review_resolutions_path,
            aliases_path=aliases_path,
            coverage_path=coverage_path,
            structure_path=structure_path,
            state_path=staging_state,
        )

        for item in (result.get("comunas") or {}).values():
            item["estado_tabla_pre_vigencia"] = str(item.get("estado") or "")

        certification.refresh_certificates(
            result,
            tracking_path=tracking_path,
            certificate_dir=certificate_dir,
            evidence_dir=evidence_dir,
            sig_path=sig_path,
        )

        vigencia_gate.apply_gate(
            result,
            tracking_path=tracking_path,
            certificate_dir=certificate_dir,
            policy_path=policy_path,
        )

        _publish_after_gate(
            result,
            staging_output=staging_output,
            output_dir=actual_output,
        )

    actual_state.parent.mkdir(parents=True, exist_ok=True)
    actual_state.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Audita tablas y sólo publica NORMALIZADAS cuando la vigencia normativa "
            "está certificada de extremo a extremo."
        )
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
    parser.add_argument("--evidence-dir", default="config/tablas_normativas_vigencia_evidencia")
    parser.add_argument("--policy", default="config/tablas_normativas_vigencia_policy.json")
    parser.add_argument("--sig", default="consolidados/vigencia/consolidado_sig_comunal.csv")
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
        evidence_dir=args.evidence_dir,
        policy_path=args.policy,
        sig_path=args.sig,
        state_path=args.state,
    )
    counts: dict[str, int] = {}
    for item in (result.get("comunas") or {}).values():
        state = str(item.get("estado") or "SIN ESTADO")
        counts[state] = counts.get(state, 0) + 1
    print(json.dumps({
        "estados": counts,
        "certificados_vigencia": result.get("certificados_vigencia", 0),
        "certificacion_automatica_generada": result.get("certificacion_automatica_generada", 0),
        "certificacion_automatica_bloqueada": result.get("certificacion_automatica_bloqueada", 0),
        "regla": "fail_closed_pre_publicacion",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
