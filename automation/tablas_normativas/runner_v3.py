from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from . import engine_v2
from . import engine_v3
from . import runner as base_runner


def _mark_confirmed_resolution(result: dict[str, Any]) -> dict[str, Any]:
    """Marca si cada ERROR CONFIRMADO quedó realmente resuelto en la fila final.

    Un error confirmado puede ser detectado con confianza alta pero no estar autorizado
    para autocorrección. En ese caso debe seguir bloqueando la publicación.
    """
    rows = result.get("rows", [])
    for finding in result.get("findings", []):
        if str(finding.get("status", "")).upper() != "ERROR CONFIRMADO":
            continue
        row_number = int(finding.get("row") or 0)
        field = str(finding.get("field") or "")
        if row_number < 2 or field not in engine_v3.FIELDS:
            finding["resolved"] = False
            continue
        index = row_number - 2
        if index >= len(rows):
            finding["resolved"] = False
            continue
        final_value = rows[index].get(field, "")
        finding["resolved"] = engine_v3._semantic_same(final_value, finding.get("proposed"))
    result["confirmed_unresolved"] = sum(
        str(item.get("status", "")).upper() == "ERROR CONFIRMADO"
        and item.get("resolved") is False
        for item in result.get("findings", [])
    )
    return result


def _blocking_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    blocked: list[dict[str, Any]] = []
    for finding in findings:
        status = str(finding.get("status", "")).upper()
        confidence = str(finding.get("confidence", "")).upper()
        if status in {"CONFLICTO NORMATIVO", "SIN FUENTE"}:
            blocked.append(finding)
        elif status == "POSIBLE ERROR" and confidence in {"ALTA", "MEDIA"}:
            blocked.append(finding)
        elif status == "ERROR CONFIRMADO" and finding.get("resolved") is False:
            blocked.append(finding)
    return blocked


def run(
    *,
    prc_root: str | Path,
    master_path: str | Path,
    output_dir: str | Path,
    exact_rules_path: str | Path | None = None,
    conditional_rules_path: str | Path | None = None,
    source_rules_path: str | Path | None = None,
    aliases_path: str | Path | None = None,
    coverage_path: str | Path | None = None,
    structure_path: str | Path | None = None,
    state_path: str | Path | None = None,
) -> dict[str, Any]:
    source_catalog = engine_v3.load_source_catalog(source_rules_path)
    source_path = Path(source_rules_path) if source_rules_path else None
    source_sha = (
        hashlib.sha256(source_path.read_bytes()).hexdigest()
        if source_path and source_path.exists()
        else "sin_catalogo_fuente"
    )

    original_engine = base_runner.engine_v2
    original_blocking = base_runner._blocking_findings
    original_structure_for = base_runner._structure_for

    class EngineProxy:
        @staticmethod
        def load_conditional_catalog(path: str | Path | None) -> dict[str, Any]:
            return engine_v2.load_conditional_catalog(path)

        @staticmethod
        def audit_table(
            headers: list[str],
            rows: list[dict[str, Any]],
            exact_catalog: dict[str, Any] | None = None,
            conditional_catalog: dict[str, Any] | None = None,
        ) -> dict[str, Any]:
            result = engine_v3.audit_table(
                headers,
                rows,
                exact_catalog,
                conditional_catalog,
                source_catalog,
            )
            return _mark_confirmed_resolution(result)

    def structure_with_source_hash(catalog: dict[str, Any], comuna: str) -> dict[str, Any]:
        structure = dict(original_structure_for(catalog, comuna))
        structure["_source_catalog_sha256"] = source_sha
        return structure

    base_runner.engine_v2 = EngineProxy
    base_runner._blocking_findings = _blocking_findings
    base_runner._structure_for = structure_with_source_hash
    try:
        result = base_runner.run(
            prc_root=prc_root,
            master_path=master_path,
            output_dir=output_dir,
            exact_rules_path=exact_rules_path,
            conditional_rules_path=conditional_rules_path,
            aliases_path=aliases_path,
            coverage_path=coverage_path,
            structure_path=structure_path,
            state_path=state_path,
        )
    finally:
        base_runner.engine_v2 = original_engine
        base_runner._blocking_findings = original_blocking
        base_runner._structure_for = original_structure_for
    result["source_catalog_sha256"] = source_sha
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Procesa automáticamente PRC + tabla con contraste de fuente oficial V3."
    )
    parser.add_argument("--prc-root", required=True)
    parser.add_argument("--master", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--exact-rules", default="config/tablas_normativas_reglas.json")
    parser.add_argument("--conditional-rules", default="config/tablas_normativas_condicionales.json")
    parser.add_argument("--source-rules", default="config/tablas_normativas_fuente.json")
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
        aliases_path=args.aliases,
        coverage_path=args.coverage,
        structure_path=args.structure,
        state_path=args.state,
    )
    counts: dict[str, int] = {}
    for item in result["comunas"].values():
        counts[item["estado"]] = counts.get(item["estado"], 0) + 1
    print(json.dumps(counts, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
