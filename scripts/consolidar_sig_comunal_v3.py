from __future__ import annotations

"""
Consolidado SIG comunal v3 - reglas auditadas para aptitud de visor.

Corrige tres problemas metodologicos de la version anterior:
1) actos "En Desarrollo" no afectan la aptitud actual del SIG;
2) la fecha de modificacion del archivo SIG NO se usa como prueba de incorporacion normativa;
3) si existe cartografia candidata en la misma comuna pero no quedo vinculada al registro Portal,
   el estado es REVISAR y no NO.

Reutiliza la carga limpia de actos del wrapper v2 y NO recorre nuevamente GPKG/SHP.
"""

import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402
import consolidar_sig_comunal_v2 as source_v2  # noqa: E402,F401

# v2 ya instala base.load_national_acts con la copia limpia/CSV del Portal.


def audited_current_act(act: dict[str, Any]) -> bool:
    """Solo actos vigentes afectan la aptitud cartografica actual."""
    state = base.norm(act.get("estado"))
    if "derog" in state:
        return False
    if act.get("fecha_derogacion") and base.valid_date(act.get("fecha_derogacion")):
        return False
    # En desarrollo se mantiene como antecedente futuro, pero no invalida el SIG vigente.
    return state == "vigente" or "vigente" in state


def audited_evidence_for_act(
    act: dict[str, Any], layers: list[dict[str, Any]]
) -> list[str]:
    """Evidencia preliminar solo por nombre; nunca por fecha de archivo."""
    act_tokens = {
        token
        for token in base.norm(f"{act.get('titulo', '')} {act.get('tipo_acto', '')}").split()
        if len(token) >= 4
        and token not in {
            "plan", "regulador", "comunal", "modificacion",
            "enmienda", "rectificacion", "vigente",
        }
    }
    evidence: list[str] = []
    for layer in layers:
        text = base.norm(f"{layer.get('archivo', '')} {layer.get('capa', '')}")
        matches = sum(token in text for token in act_tokens)
        if act_tokens and matches >= min(2, len(act_tokens)):
            evidence.append(
                f"Nombre SIG compatible: {layer.get('archivo', '')} · {layer.get('capa', '')}"
            )
    return sorted(set(evidence))


base.current_act = audited_current_act
base.evidence_for_act = audited_evidence_for_act

# Guardamos referencia a la clasificacion original, que ya usara las funciones auditadas de arriba.
_original_classify = base.classify_instrument

# Se carga una vez desde el inventario existente para distinguir "sin SIG" de "SIG sin vinculo".
_CANDIDATE_KEYS: set[tuple[str, str]] = set()


def _candidate_key(region: Any, comuna: Any) -> tuple[str, str]:
    return (base.norm(region), base.norm(comuna))


def _load_candidate_keys(repo: Path) -> None:
    global _CANDIDATE_KEYS
    path = repo / "_local" / "sig_ipt" / "capas_sig_ipt.json"
    if not path.exists():
        return
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return
    layers = base.extract_list(payload, "capas")
    keys: set[tuple[str, str]] = set()
    for layer in layers:
        region = str(layer.get("region") or "").strip()
        comuna = str(layer.get("comuna") or "").strip()
        if not region or not comuna:
            continue
        if comuna in {"Cobertura regional", "Cobertura nacional", "Sin comuna"}:
            continue
        keys.add(_candidate_key(region, comuna))
    _CANDIDATE_KEYS = keys


def audited_classify(
    instrument: dict[str, Any],
    linked_pairs: list[tuple[dict[str, Any], dict[str, Any]]],
    acts: list[dict[str, Any]],
) -> dict[str, Any]:
    result = _original_classify(instrument, linked_pairs, acts)

    # "Probablemente actualizado" no es aptitud suficiente para visor.
    if result.get("estado_sig") == "probablemente_actualizado":
        result["estado_sig"] = "requiere_revision_cambios"
        result["estado_sig_label"] = "Requiere verificar cambios posteriores"
        result["apto_para_visor"] = "REVISAR"
        result["motivo"] = (
            "Existe evidencia nominal compatible con actos posteriores, pero no se ha "
            "verificado espacialmente su incorporacion en geometria y atributos."
        )

    # Si no hubo match al registro, pero hay capas en la misma comuna, no corresponde afirmar ausencia SIG.
    if result.get("estado_sig") == "sin_sig":
        key = _candidate_key(instrument.get("region"), instrument.get("comuna"))
        if key in _CANDIDATE_KEYS:
            result["estado_sig"] = "sig_detectado_vinculo_pendiente"
            result["estado_sig_label"] = "SIG detectado · vínculo al IPT pendiente"
            result["apto_para_visor"] = "REVISAR"
            result["motivo"] = (
                "Se detecto cartografia SIG para la comuna, pero el vinculo automatico "
                "con este registro del Portal IPT no es suficientemente confiable."
            )

    # Un SI automatico es candidato apto, no una certificacion espacial definitiva.
    if result.get("estado_sig") == "vigente_sin_cambios_posteriores":
        result["estado_sig_label"] = "Candidato apto · sin cambios vigentes posteriores detectados"
        result["motivo"] = (
            "La cartografia esta vinculada al instrumento vigente y no se detectaron "
            "actos vigentes posteriores. Es candidato para visor; falta QA final de archivo y atributos."
        )
        result["verificacion"] = "candidato_apto_qa_pendiente"

    return result


base.classify_instrument = audited_classify


def _repo_from_argv() -> Path | None:
    try:
        idx = sys.argv.index("--repo")
        return Path(sys.argv[idx + 1]).expanduser().resolve()
    except Exception:
        return None


if __name__ == "__main__":
    repo = _repo_from_argv()
    if repo is not None:
        _load_candidate_keys(repo)
        print("Reglas de auditoria SIG v3 activas:")
        print("- En Desarrollo no afecta aptitud actual")
        print("- Fecha del archivo no prueba incorporacion normativa")
        print("- SIG comunal sin match exacto => REVISAR, no NO")
        print("- SI automatico => candidato apto, QA final pendiente")
        print()
    raise SystemExit(base.main())
