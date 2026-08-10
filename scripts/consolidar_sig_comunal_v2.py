from __future__ import annotations

"""
Carga robusta de actos IPT + criterios auditados para el consolidado SIG comunal.

Principios de esta versión:
- NO usa los bloques GZIP/BASE64 dañados del repositorio.
- Usa una copia limpia generada desde el CSV original del Portal IPT.
- NO vuelve a recorrer la cartografía SIG.
- Un acto "En Desarrollo" es una alerta futura: no vuelve desactualizado el SIG vigente hoy.
- La fecha de modificación del archivo SIG NO demuestra incorporación normativa.
- "SIG no vinculado" no equivale a "SIG inexistente": si hay cartografía candidata de la
  comuna/tipo, el estado es REVISAR y no NO.
- Un SI automático significa "candidato apto"; la verificación espacial/documental final
  seguirá siendo una etapa separada.
"""

import json
import shutil
import sys
from collections import Counter
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402
import sincronizar_portal_ipt as portal  # noqa: E402

CACHE_NAME = "actos_ipt_nacionales_limpio.json"
SOURCE_COPY_NAME = "portal_ipt_fuente.csv"
MIN_EXPECTED_ROWS = 1700

KNOWN_TOTAL = 1784
KNOWN_STATES = {
    "Vigente": 955,
    "Derogado": 631,
    "En Desarrollo": 198,
}
KNOWN_TYPES = {
    "Enmienda": 158,
    "Rectificación": 38,
    "Modificación mediante seccional": 130,
}
KNOWN_LINKED = 275

_ALL_LAYERS: list[dict[str, Any]] = []
_ORIGINAL_LOAD_INSPECTOR_OUTPUTS = base.load_inspector_outputs


def _cache_path(repo: Path) -> Path:
    return repo / "_local" / "sig_ipt" / CACHE_NAME


def _source_copy_path(repo: Path) -> Path:
    return repo / "_local" / "sig_ipt" / SOURCE_COPY_NAME


def _validate_rows(rows: Any, label: str) -> list[list[Any]]:
    if not isinstance(rows, list):
        raise RuntimeError(f"{label}: el contenido no es una lista.")
    if len(rows) < MIN_EXPECTED_ROWS:
        raise RuntimeError(
            f"{label}: solo contiene {len(rows):,} modificaciones; "
            f"se esperaban al menos {MIN_EXPECTED_ROWS:,}."
        )

    for position, row in enumerate(rows):
        if not isinstance(row, list) or len(row) < 17:
            raise RuntimeError(f"{label}: fila {position} incompleta.")

    return rows


def _print_controls(rows: list[list[Any]], source: str) -> None:
    states = Counter(str(row[6] or "") for row in rows)
    types = Counter(str(row[11] or "") for row in rows)
    linked = sum(bool(row[10]) for row in rows)

    print("Base normativa IPT:")
    print(f"- Fuente utilizada    : {source}")
    print(f"- Actos verificados   : {len(rows):,}")
    print(f"- Vigentes            : {states.get('Vigente', 0):,}")
    print(f"- Derogados           : {states.get('Derogado', 0):,}")
    print(f"- En desarrollo       : {states.get('En Desarrollo', 0):,}")
    print(f"- Enmiendas           : {types.get('Enmienda', 0):,}")
    print(f"- Rectificaciones     : {types.get('Rectificación', 0):,}")
    print(f"- Modif. seccionales  : {types.get('Modificación mediante seccional', 0):,}")
    print(f"- Vinculados origen   : {linked:,}")

    if len(rows) == KNOWN_TOTAL:
        mismatches: list[str] = []
        for key, expected in KNOWN_STATES.items():
            if states.get(key, 0) != expected:
                mismatches.append(f"{key}={states.get(key, 0)} (esperado {expected})")
        for key, expected in KNOWN_TYPES.items():
            if types.get(key, 0) != expected:
                mismatches.append(f"{key}={types.get(key, 0)} (esperado {expected})")
        if linked != KNOWN_LINKED:
            mismatches.append(f"vinculados={linked} (esperado {KNOWN_LINKED})")

        if mismatches:
            raise RuntimeError(
                "El CSV tiene 1.784 actos, pero no coincide con el corte anual conocido: "
                + "; ".join(mismatches)
            )
        print("- Control corte 07-07 : OK")
    else:
        print("- Control corte 07-07 : nuevo corte; se acepta por provenir del CSV fuente")
    print()


def _load_cache(repo: Path) -> list[list[Any]] | None:
    path = _cache_path(repo)
    if not path.exists():
        return None
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        rows = _validate_rows(rows, "copia JSON limpia")
    except Exception as error:
        print(f"AVISO. Se ignora la copia limpia existente: {error}")
        return None

    _print_controls(rows, "copia JSON limpia validada")
    return rows


def _candidate_csvs(repo: Path) -> list[Path]:
    home = Path.home()
    candidates: list[Path] = []

    candidates.extend([
        repo / "instrumentos.csv",
        repo / "instrumentos(1).csv",
        repo / "data" / "instrumentos.csv",
        repo / "data" / "instrumentos(1).csv",
        repo / "_local" / "sig_ipt" / SOURCE_COPY_NAME,
        repo / "_local" / "sig_ipt" / "instrumentos.csv",
        repo / "_local" / "sig_ipt" / "instrumentos(1).csv",
    ])

    search_dirs = [
        home / "Downloads",
        home / "Descargas",
        home / "Desktop",
        home / "Escritorio",
        home / "Documents",
        home / "Documentos",
        home / "OneDrive - Transsa" / "Documentos",
    ]

    for folder in search_dirs:
        if not folder.exists():
            continue
        try:
            candidates.extend(sorted(
                folder.glob("instrumentos*.csv"),
                key=lambda path: path.stat().st_mtime,
                reverse=True,
            ))
        except OSError:
            continue

    unique: list[Path] = []
    seen: set[str] = set()
    for path in candidates:
        try:
            key = str(path.resolve()).lower()
        except OSError:
            key = str(path).lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(path)
    return unique


def _rows_from_csv(path: Path) -> list[list[Any]]:
    records = portal.read_csv(path)
    rows = portal.build_rows(records)
    return _validate_rows(rows, f"CSV {path.name}")


def _find_valid_csv(repo: Path) -> tuple[Path, list[list[Any]]] | None:
    for path in _candidate_csvs(repo):
        if not path.exists() or not path.is_file():
            continue
        try:
            rows = _rows_from_csv(path)
        except Exception:
            continue
        return path, rows
    return None


def _ask_for_csv() -> Path | None:
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected = filedialog.askopenfilename(
            title="Selecciona el CSV descargado desde Portal IPT",
            filetypes=[("Archivos CSV", "*.csv"), ("Todos los archivos", "*.*")],
        )
        root.destroy()
        return Path(selected) if selected else None
    except Exception as error:
        print(f"AVISO. No se pudo abrir selector de archivo: {error}")
        return None


def _save_clean_copy(repo: Path, source: Path, rows: list[list[Any]]) -> None:
    output_dir = repo / "_local" / "sig_ipt"
    output_dir.mkdir(parents=True, exist_ok=True)

    _cache_path(repo).write_text(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    source_copy = _source_copy_path(repo)
    try:
        if source.resolve() != source_copy.resolve():
            shutil.copy2(source, source_copy)
    except OSError:
        pass


def _load_rows_from_source(repo: Path) -> list[list[Any]]:
    cached = _load_cache(repo)
    if cached is not None:
        return cached

    found = _find_valid_csv(repo)
    if found is None:
        print("No encontre automaticamente un CSV valido del Portal IPT.")
        print("Se abrira una ventana para seleccionarlo.")
        print()
        selected = _ask_for_csv()
        if selected is None:
            raise RuntimeError(
                "No se selecciono un CSV del Portal IPT. "
                "Descarga el listado desde Portal IPT y vuelve a ejecutar este archivo."
            )
        try:
            rows = _rows_from_csv(selected)
        except Exception as error:
            raise RuntimeError(
                f"El archivo seleccionado no corresponde a un CSV valido del Portal IPT: {error}"
            ) from error
        source = selected
    else:
        source, rows = found

    _print_controls(rows, str(source))
    _save_clean_copy(repo, source, rows)
    print(f"- Copia limpia        : _local\\sig_ipt\\{CACHE_NAME}")
    print(f"- CSV fuente guardado : _local\\sig_ipt\\{SOURCE_COPY_NAME}")
    print()
    return rows


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    rows = _load_rows_from_source(repo)

    return [{
        "id": row[0],
        "region": row[1] or "",
        "comunas": row[2] if isinstance(row[2], list) else [],
        "nivel": row[3] or "",
        "tipo_ipt": row[4] or "",
        "titulo": row[5] or "",
        "estado": row[6] or "",
        "fecha": row[7] or "",
        "fecha_derogacion": row[8] or "",
        "codigos_origen": row[10] if isinstance(row[10], list) else [],
        "tipo_acto": row[11] or "Modificación",
    } for row in rows]


def _load_inspector_outputs_audited(output: Path):
    global _ALL_LAYERS
    layers, linkages = _ORIGINAL_LOAD_INSPECTOR_OUTPUTS(output)
    _ALL_LAYERS = layers
    return layers, linkages


def _candidate_layers(instrument: dict[str, Any]) -> list[dict[str, Any]]:
    region = base.norm(instrument.get("region"))
    commune = base.norm(instrument.get("comuna"))
    ipt_type = str(instrument.get("tipo_ipt") or "").upper()

    candidates: list[dict[str, Any]] = []
    for layer in _ALL_LAYERS:
        if base.norm(layer.get("region")) != region:
            continue
        if base.norm(layer.get("comuna")) != commune:
            continue
        detected = str(layer.get("tipo_ipt_detectado") or "").upper()
        if detected and ipt_type and detected != ipt_type:
            continue
        candidates.append(layer)
    return candidates


def _state(act: dict[str, Any]) -> str:
    return base.norm(act.get("estado"))


def _is_derogated(act: dict[str, Any]) -> bool:
    return "derog" in _state(act) or (
        bool(act.get("fecha_derogacion")) and base.valid_date(act.get("fecha_derogacion"))
    )


def _is_effective(act: dict[str, Any]) -> bool:
    state = _state(act)
    return not _is_derogated(act) and (state == "vigente" or "vigente" in state)


def _is_development(act: dict[str, Any]) -> bool:
    return "desarrollo" in _state(act)


def _act_copy(act: dict[str, Any], relation: str) -> dict[str, Any]:
    item = dict(act)
    item["tipo_vinculo_normativo"] = relation
    # Un nombre parecido puede servir para priorizar revisión, pero NO prueba incorporación.
    item["evidencia_sig"] = []
    return item


def classify_instrument_audited(
    instrument: dict[str, Any],
    linked_pairs: list[tuple[dict[str, Any], dict[str, Any]]],
    acts: list[dict[str, Any]],
) -> dict[str, Any]:
    strong = [pair for pair in linked_pairs if pair[1].get("estado") == "vinculado"]
    candidates = _candidate_layers(instrument)
    base_date = instrument.get("fecha") if base.valid_date(instrument.get("fecha")) else ""

    posterior: list[dict[str, Any]] = []
    undated: list[dict[str, Any]] = []
    development: list[dict[str, Any]] = []
    uncertain_state: list[dict[str, Any]] = []

    for act in acts:
        affects, relation = base.act_affects_instrument(act, instrument)
        if not affects:
            continue

        if _is_development(act):
            development.append(_act_copy(act, relation))
            continue
        if _is_derogated(act):
            continue
        if not _is_effective(act):
            if relation == "codigo_origen":
                uncertain_state.append(_act_copy(act, relation))
            continue

        act_date = str(act.get("fecha") or "")
        if base.valid_date(act_date):
            if base_date and act_date <= base_date:
                continue
            if not base_date:
                undated.append(_act_copy(act, relation))
                continue
            posterior.append(_act_copy(act, relation))
        elif relation == "codigo_origen":
            # Sin fecha no afirmamos que sea posterior, pero un vínculo explícito al origen
            # sí exige revisión antes de declarar el SIG apto.
            undated.append(_act_copy(act, relation))

    posterior.sort(key=lambda item: (item.get("fecha") or "9999-99-99", item.get("titulo") or ""))
    development.sort(key=lambda item: (item.get("fecha") or "9999-99-99", item.get("titulo") or ""))

    best_pair = None
    if strong:
        best_pair = max(strong, key=lambda pair: float(pair[1].get("score") or 0))
    elif linked_pairs:
        best_pair = max(linked_pairs, key=lambda pair: float(pair[1].get("score") or 0))

    if not linked_pairs and candidates:
        status = "sig_local_sin_vinculo"
        label = "SIG existente · vínculo con IPT pendiente"
        apt = "REVISAR"
        reason = (
            "Existe cartografía SIG de la comuna y del mismo tipo de instrumento, "
            "pero el vínculo automático con el registro vigente no es suficientemente seguro."
        )
    elif not linked_pairs:
        status = "sin_sig_local_detectado"
        label = "Sin cartografía SIG comunal detectada"
        apt = "NO"
        reason = "No se detectó una capa SIG comunal candidata para el instrumento vigente."
    elif not strong:
        status = "vinculo_sig_ambiguo"
        label = "SIG encontrado · vínculo ambiguo"
        apt = "REVISAR"
        reason = (
            "Existe cartografía candidata, pero todavía no se puede asegurar "
            "que corresponda al instrumento vigente correcto."
        )
    elif not base_date:
        status = "fecha_base_no_verificable"
        label = "SIG vinculado · fecha del instrumento pendiente"
        apt = "REVISAR"
        reason = (
            "El SIG está vinculado, pero falta una fecha válida del instrumento base "
            "para comprobar si existen cambios posteriores."
        )
    elif posterior or undated or uncertain_state:
        status = "requiere_revision_cambios"
        label = "Requiere verificar cambios posteriores"
        apt = "REVISAR"
        reason_parts = []
        if posterior:
            reason_parts.append(f"{len(posterior)} acto(s) vigente(s) posterior(es)")
        if undated:
            reason_parts.append(f"{len(undated)} acto(s) vinculado(s) sin fecha comparable")
        if uncertain_state:
            reason_parts.append(f"{len(uncertain_state)} acto(s) con estado no concluyente")
        reason = (
            "Se detectaron " + ", ".join(reason_parts) + ". "
            "Debe comprobarse su incorporación mediante geometría, atributos y/o documentación oficial."
        )
    else:
        status = "candidato_apto_sin_cambios"
        label = "Candidato apto · sin cambios posteriores vigentes detectados"
        apt = "SI"
        reason = (
            "La cartografía está vinculada al instrumento vigente y, al corte normativo usado, "
            "no se detectaron actos vigentes posteriores que deban incorporarse."
        )
        if development:
            reason += f" Hay {len(development)} proceso(s) en desarrollo como alerta futura; no afectan la vigencia actual."

    return {
        "registro": instrument.get("registro"),
        "tipo_ipt": instrument.get("tipo_ipt", ""),
        "nombre": instrument.get("nombre", ""),
        "fecha_instrumento": instrument.get("fecha", ""),
        "estado_sig": status,
        "estado_sig_label": label,
        "apto_para_visor": apt,
        "motivo": reason,
        "archivo_recomendado": best_pair[0].get("archivo", "") if best_pair else "",
        "capa_recomendada": best_pair[0].get("capa", "") if best_pair else "",
        "campo_zona": best_pair[0].get("campo_zona", "") if best_pair else "",
        "crs": best_pair[0].get("crs", "") if best_pair else "",
        "cartografia": [base.shape_summary(layer, link) for layer, link in linked_pairs],
        "cartografia_candidata_sin_vinculo": [
            {
                "sig_id": layer.get("sig_id", ""),
                "archivo": layer.get("archivo", ""),
                "capa": layer.get("capa", ""),
                "tipo_ipt_detectado": layer.get("tipo_ipt_detectado", ""),
                "campo_zona": layer.get("campo_zona", ""),
                "crs": layer.get("crs", ""),
            }
            for layer in candidates
            if not any(str(pair[0].get("sig_id")) == str(layer.get("sig_id")) for pair in linked_pairs)
        ],
        "actos_posteriores": posterior,
        "cantidad_actos_posteriores": len(posterior),
        "actos_vinculados_sin_fecha": undated,
        "cantidad_actos_sin_fecha": len(undated),
        "actos_estado_incierto": uncertain_state,
        "procesos_en_desarrollo": development,
        "cantidad_procesos_en_desarrollo": len(development),
        "ultimo_acto_posterior": max(
            (act.get("fecha", "") for act in posterior if base.valid_date(act.get("fecha"))),
            default="",
        ),
        "verificacion": "automatica_preliminar_auditada",
    }


base.load_national_acts = load_national_acts
base.load_inspector_outputs = _load_inspector_outputs_audited
base.classify_instrument = classify_instrument_audited


if __name__ == "__main__":
    raise SystemExit(base.main())
