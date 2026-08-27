from __future__ import annotations

import argparse
import base64
import csv
import gzip
import json
import re
import unicodedata
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


def deaccent(value: Any) -> str:
    return "".join(
        ch for ch in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(ch) != "Mn"
    )


def norm(value: Any) -> str:
    text = deaccent(value).lower()
    text = re.sub(r"\b(region|comuna|provincia)\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def valid_date(value: Any) -> bool:
    return bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(value or "")))


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def extract_list(payload: Any, key: str) -> list[dict[str, Any]]:
    """Acepta tanto una lista directa como el objeto contenedor del Inspector."""
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        value = payload.get(key, [])
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def extract_appended_payload(path: Path) -> str:
    raw = path.read_text(encoding="utf-8").strip()
    pattern = re.compile(
        r'window\.ACTOS_IPT_GZ=\(window\.ACTOS_IPT_GZ\|\|""\)\+("(?:[^"\\]|\\.)*");'
    )
    matches = pattern.findall(raw)
    if not matches:
        raise RuntimeError(f"No se pudo leer el bloque normativo {path.name}.")
    return "".join(json.loads(match) for match in matches)


def decode_act_files(files: list[Path]) -> list[list[Any]]:
    if not files or not all(path.exists() for path in files):
        return []
    encoded = "".join(extract_appended_payload(path) for path in files)
    compressed = base64.b64decode(encoded, validate=True)
    rows = json.loads(gzip.decompress(compressed).decode("utf-8"))
    return rows if isinstance(rows, list) else []


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    data = repo / "data"
    rows: list[list[Any]] = []
    errors: list[str] = []

    # Fuente original generada desde el CSV anual del Portal IPT.
    # Es la fuente prioritaria porque corresponde directamente a los 1.784 actos
    # utilizados en el análisis nacional.
    original_files = sorted(data.glob("actos_ipt_gz_*.js"))
    if original_files:
        try:
            rows = decode_act_files(original_files)
        except Exception as error:
            errors.append(f"bloques originales: {error}")

    # Compatibilidad con la segunda versión fragmentada de la base.
    if len(rows) != 1784:
        national_files = [
            data / f"actos_ipt_nacional_{index:02d}.js"
            for index in range(1, 11)
        ]
        try:
            fallback_rows = decode_act_files(national_files)
            if fallback_rows:
                rows = fallback_rows
        except Exception as error:
            errors.append(f"bloques nacionales: {error}")

    if len(rows) != 1784:
        detail = " | ".join(errors) if errors else "sin bloques decodificables"
        raise RuntimeError(
            "No se pudieron cargar los 1.784 actos normativos del Portal IPT. "
            f"Se obtuvieron {len(rows)}. Detalle: {detail}"
        )

    acts: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 17:
            continue
        acts.append({
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
        })

    if len(acts) != 1784:
        raise RuntimeError(
            "La base normativa se abrió, pero no se pudieron interpretar todos los actos. "
            f"Actos interpretados: {len(acts)} de 1.784."
        )
    return acts


def load_vigentes(repo: Path) -> list[dict[str, Any]]:
    instruments: list[dict[str, Any]] = []
    prefix = "window.VIGENCIA_IPT_ROWS=(window.VIGENCIA_IPT_ROWS||[]).concat("

    for path in sorted((repo / "data").glob("ipt_vigentes_*.js")):
        raw = path.read_text(encoding="utf-8").strip()
        if not raw.startswith(prefix) or not raw.endswith(");"):
            continue
        try:
            rows = json.loads(raw[len(prefix):-2])
        except Exception:
            continue

        for row in rows:
            if not isinstance(row, list) or len(row) < 8:
                continue
            communes = row[3] if isinstance(row[3], list) else [
                part.strip() for part in str(row[2] or "").split(",") if part.strip()
            ]
            for commune in communes:
                instruments.append({
                    "registro": row[0],
                    "region": row[1] or "",
                    "comuna": commune,
                    "tipo_ipt": row[4] or "",
                    "nivel": row[5] or "",
                    "nombre": row[6] or "",
                    "fecha": row[7] or "",
                })
    return instruments


def current_act(act: dict[str, Any]) -> bool:
    state = norm(act.get("estado"))
    if "derog" in state:
        return False
    if act.get("fecha_derogacion") and valid_date(act.get("fecha_derogacion")):
        return False
    return state in {"vigente", "en desarrollo", ""} or "vigente" in state


def act_affects_instrument(
    act: dict[str, Any], instrument: dict[str, Any]
) -> tuple[bool, str]:
    record = str(instrument.get("registro") or "")
    codes = {str(code) for code in act.get("codigos_origen", [])}
    if record and record in codes:
        return True, "codigo_origen"

    same_region = norm(act.get("region")) == norm(instrument.get("region"))
    same_commune = norm(instrument.get("comuna")) in {
        norm(value) for value in act.get("comunas", [])
    }
    same_type = norm(act.get("tipo_ipt")) == norm(instrument.get("tipo_ipt"))
    if same_region and same_commune and same_type:
        return True, "comuna_tipo"
    return False, ""


def layer_date(layer: dict[str, Any]) -> str:
    value = str(layer.get("fecha_capa") or "")[:10]
    return value if valid_date(value) else ""


def evidence_for_act(
    act: dict[str, Any], layers: list[dict[str, Any]]
) -> list[str]:
    act_tokens = {
        token
        for token in norm(f"{act.get('titulo', '')} {act.get('tipo_acto', '')}").split()
        if len(token) >= 4
        and token
        not in {
            "plan", "regulador", "comunal", "modificacion",
            "enmienda", "rectificacion",
        }
    }
    act_date = str(act.get("fecha") or "")
    evidence: list[str] = []

    for layer in layers:
        text = norm(f"{layer.get('archivo', '')} {layer.get('capa', '')}")
        matches = sum(token in text for token in act_tokens)
        if act_tokens and matches >= min(2, len(act_tokens)):
            evidence.append(
                f"Nombre SIG compatible: {layer.get('archivo', '')} · {layer.get('capa', '')}"
            )

        ldate = layer_date(layer)
        if valid_date(act_date) and ldate and ldate >= act_date:
            evidence.append(f"Fecha de capa {ldate} posterior al acto {act_date}")

    return sorted(set(evidence))


def shape_summary(
    layer: dict[str, Any], linkage: dict[str, Any]
) -> dict[str, Any]:
    return {
        "sig_id": layer.get("sig_id", ""),
        "archivo": layer.get("archivo", ""),
        "capa": layer.get("capa", ""),
        "formato": layer.get("formato", ""),
        "crs": layer.get("crs", ""),
        "geometria": layer.get("geometria", ""),
        "rol_capa": layer.get("rol_capa", ""),
        "campo_zona": layer.get("campo_zona", ""),
        "fecha_capa": layer_date(layer),
        "vinculo": linkage.get("estado", ""),
        "confianza_vinculo": linkage.get("confianza", ""),
        "score_vinculo": linkage.get("score", ""),
    }


def classify_instrument(
    instrument: dict[str, Any],
    linked_pairs: list[tuple[dict[str, Any], dict[str, Any]]],
    acts: list[dict[str, Any]],
) -> dict[str, Any]:
    layers = [pair[0] for pair in linked_pairs]
    strong = [
        pair for pair in linked_pairs
        if pair[1].get("estado") == "vinculado"
    ]
    base_date = instrument.get("fecha") if valid_date(instrument.get("fecha")) else ""

    posterior: list[dict[str, Any]] = []
    for act in acts:
        if not current_act(act):
            continue
        affects, relation = act_affects_instrument(act, instrument)
        if not affects:
            continue
        if base_date and valid_date(act.get("fecha")) and act["fecha"] <= base_date:
            continue

        item = dict(act)
        item["tipo_vinculo_normativo"] = relation
        item["evidencia_sig"] = evidence_for_act(item, layers)
        posterior.append(item)

    posterior.sort(
        key=lambda item: (
            item.get("fecha") or "9999-99-99",
            item.get("titulo") or "",
        )
    )

    # Estos dos grupos se llenarán después con una revisión espacial efectiva.
    # No inferimos que una modificación está incorporada solo por el nombre o fecha.
    verified_missing: list[dict[str, Any]] = []
    verified_included: list[dict[str, Any]] = []

    if not linked_pairs:
        status = "sin_sig"
        label = "Sin cartografía SIG vinculada"
        apt = "NO"
        reason = (
            "No se encontró una capa SIG vinculada con suficiente confianza "
            "al instrumento vigente."
        )
    elif not strong:
        status = "vinculo_sig_ambiguo"
        label = "SIG encontrado, vínculo ambiguo"
        apt = "REVISAR"
        reason = (
            "Existe cartografía candidata, pero todavía no se puede asegurar "
            "que corresponda al instrumento correcto."
        )
    elif verified_missing:
        status = "desactualizado_verificado"
        label = "Desactualizado verificado"
        apt = "NO"
        reason = (
            "Existe al menos un cambio normativo vigente cuya incorporación "
            "SIG fue verificada como ausente."
        )
    elif posterior and verified_included and len(verified_included) == len(posterior):
        status = "actualizado_verificado"
        label = "Actualizado verificado"
        apt = "SI"
        reason = (
            "Todos los cambios posteriores vigentes fueron verificados "
            "en la cartografía."
        )
    elif not posterior:
        status = "vigente_sin_cambios_posteriores"
        label = "Vigente · sin cambios posteriores detectados"
        apt = "SI"
        reason = (
            "La cartografía está vinculada al instrumento vigente y no se "
            "detectaron actos posteriores vigentes que requieran incorporación."
        )
    else:
        with_evidence = [act for act in posterior if act.get("evidencia_sig")]
        if with_evidence and len(with_evidence) == len(posterior):
            status = "probablemente_actualizado"
            label = "Probablemente actualizado · falta verificación espacial"
            apt = "REVISAR"
            reason = (
                "Hay evidencia SIG compatible con todos los actos posteriores, "
                "pero aún falta comprobar geometría y atributos."
            )
        else:
            status = "requiere_revision_cambios"
            label = "Requiere revisar cambios posteriores"
            apt = "REVISAR"
            reason = (
                "Existen actos normativos posteriores al instrumento base y "
                "no está verificado que todos estén incorporados en el SIG."
            )

    best_pair = None
    if strong:
        best_pair = max(
            strong,
            key=lambda pair: float(pair[1].get("score") or 0),
        )
    elif linked_pairs:
        best_pair = max(
            linked_pairs,
            key=lambda pair: float(pair[1].get("score") or 0),
        )

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
        "cartografia": [
            shape_summary(layer, link)
            for layer, link in linked_pairs
        ],
        "actos_posteriores": posterior,
        "cantidad_actos_posteriores": len(posterior),
        "ultimo_acto_posterior": max(
            (
                act.get("fecha", "")
                for act in posterior
                if valid_date(act.get("fecha"))
            ),
            default="",
        ),
        "verificacion": "automatica_preliminar",
    }


def load_inspector_outputs(output: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    layers_payload = read_json(output / "capas_sig_ipt.json", {})
    linkages_payload = read_json(output / "vinculacion_sig_ipt.json", {})

    layers = extract_list(layers_payload, "capas")
    linkages = extract_list(linkages_payload, "vinculaciones")

    if not layers:
        raise RuntimeError(
            "capas_sig_ipt.json existe, pero no contiene capas válidas. "
            "Vuelve a ejecutar el Inspector SIG IPT."
        )
    if not linkages:
        raise RuntimeError(
            "vinculacion_sig_ipt.json existe, pero no contiene vinculaciones válidas. "
            "Vuelve a ejecutar el Inspector SIG IPT."
        )

    return layers, linkages


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera un consolidado SIG por comuna y aptitud para visor."
    )
    parser.add_argument("--repo", required=True, type=Path)
    args = parser.parse_args()

    repo = args.repo.expanduser().resolve()
    output = repo / "_local" / "sig_ipt"

    layers, linkages = load_inspector_outputs(output)
    instruments = load_vigentes(repo)
    acts = load_national_acts(repo)

    if not instruments:
        raise RuntimeError(
            "No se pudieron cargar los instrumentos vigentes del Portal IPT desde data/ipt_vigentes_*.js."
        )

    layer_by_id = {
        str(layer.get("sig_id")): layer
        for layer in layers
        if layer.get("sig_id")
    }

    pairs_by_record: dict[
        str,
        list[tuple[dict[str, Any], dict[str, Any]]],
    ] = defaultdict(list)

    for linkage in linkages:
        record = linkage.get("registro_portal")
        layer = layer_by_id.get(str(linkage.get("sig_id")))
        if record is None or not layer:
            continue
        pairs_by_record[str(record)].append((layer, linkage))

    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for instrument in instruments:
        grouped[
            (norm(instrument.get("region")), norm(instrument.get("comuna")))
        ].append(instrument)

    consolidated: list[dict[str, Any]] = []

    for (_region_key, _commune_key), commune_instruments in grouped.items():
        sample = commune_instruments[0]
        evaluated: list[dict[str, Any]] = []

        for instrument in commune_instruments:
            record = str(instrument.get("registro") or "")
            evaluated.append(
                classify_instrument(
                    instrument,
                    pairs_by_record.get(record, []),
                    acts,
                )
            )

        prc = sorted(
            [
                item for item in evaluated
                if str(item.get("tipo_ipt")).upper() == "PRC"
            ],
            key=lambda item: item.get("fecha_instrumento") or "",
            reverse=True,
        )
        lu = sorted(
            [
                item for item in evaluated
                if str(item.get("tipo_ipt")).upper() == "LU"
            ],
            key=lambda item: item.get("fecha_instrumento") or "",
            reverse=True,
        )
        inter = [
            item for item in evaluated
            if str(item.get("tipo_ipt")).upper() in {"PRI", "PRM", "PRDU"}
        ]
        ps = [
            item for item in evaluated
            if str(item.get("tipo_ipt")).upper() == "PS"
        ]

        principal = prc[0] if prc else (lu[0] if lu else None)

        consolidated.append({
            "id": (
                f"{norm(sample.get('region')).replace(' ', '-')}-"
                f"{norm(sample.get('comuna')).replace(' ', '-')}"
            ),
            "region": sample.get("region", ""),
            "comuna": sample.get("comuna", ""),
            "estado_principal": (
                principal.get("estado_sig")
                if principal else "sin_instrumento_comunal"
            ),
            "estado_principal_label": (
                principal.get("estado_sig_label")
                if principal else "Sin PRC/LU vigente identificado"
            ),
            "apto_para_visor": (
                principal.get("apto_para_visor")
                if principal else "REVISAR"
            ),
            "archivo_recomendado": (
                principal.get("archivo_recomendado") if principal else ""
            ),
            "capa_recomendada": (
                principal.get("capa_recomendada") if principal else ""
            ),
            "motivo": (
                principal.get("motivo")
                if principal
                else "No se identificó un PRC o límite urbano comunal principal."
            ),
            "prc": prc,
            "limites_urbanos": lu,
            "seccionales": ps,
            "intercomunales": inter,
            "instrumentos": evaluated,
            "fecha_revision": datetime.now().isoformat(timespec="seconds"),
        })

    consolidated.sort(
        key=lambda item: (norm(item["region"]), norm(item["comuna"]))
    )

    summary = {
        "fecha_generacion": datetime.now().isoformat(timespec="seconds"),
        "capas_sig_leidas": len(layers),
        "vinculaciones_sig_leidas": len(linkages),
        "instrumentos_portal": len(instruments),
        "actos_normativos": len(acts),
        "comunas": len(consolidated),
        "aptos_si": sum(
            item["apto_para_visor"] == "SI" for item in consolidated
        ),
        "aptos_revisar": sum(
            item["apto_para_visor"] == "REVISAR" for item in consolidated
        ),
        "aptos_no": sum(
            item["apto_para_visor"] == "NO" for item in consolidated
        ),
        "estados": {},
    }

    for item in consolidated:
        key = item["estado_principal"]
        summary["estados"][key] = summary["estados"].get(key, 0) + 1

    payload = {
        "resumen": summary,
        "comunas": consolidated,
    }

    output.mkdir(parents=True, exist_ok=True)

    (output / "consolidado_sig_comunal.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output / "consolidado_sig_comunal.js").write_text(
        "window.CONSOLIDADO_SIG_COMUNAL = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )

    csv_fields = [
        "region",
        "comuna",
        "estado_principal_label",
        "apto_para_visor",
        "archivo_recomendado",
        "capa_recomendada",
        "motivo",
        "prc_fecha",
        "prc_nombre",
        "actos_posteriores",
        "ultimo_acto_posterior",
    ]

    with (output / "consolidado_sig_comunal.csv").open(
        "w", encoding="utf-8-sig", newline=""
    ) as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=csv_fields,
            delimiter=";",
        )
        writer.writeheader()

        for item in consolidated:
            main_prc = item["prc"][0] if item["prc"] else None
            writer.writerow({
                "region": item["region"],
                "comuna": item["comuna"],
                "estado_principal_label": item["estado_principal_label"],
                "apto_para_visor": item["apto_para_visor"],
                "archivo_recomendado": item["archivo_recomendado"],
                "capa_recomendada": item["capa_recomendada"],
                "motivo": item["motivo"],
                "prc_fecha": (
                    main_prc.get("fecha_instrumento", "") if main_prc else ""
                ),
                "prc_nombre": (
                    main_prc.get("nombre", "") if main_prc else ""
                ),
                "actos_posteriores": (
                    main_prc.get("cantidad_actos_posteriores", 0)
                    if main_prc else 0
                ),
                "ultimo_acto_posterior": (
                    main_prc.get("ultimo_acto_posterior", "")
                    if main_prc else ""
                ),
            })

    print()
    print("CONSOLIDADO SIG COMUNAL")
    print("-" * 72)
    print(f"Capas SIG leídas      : {summary['capas_sig_leidas']}")
    print(f"Vínculos SIG leídos   : {summary['vinculaciones_sig_leidas']}")
    print(f"Instrumentos Portal   : {summary['instrumentos_portal']}")
    print(f"Actos normativos      : {summary['actos_normativos']}")
    print(f"Comunas consolidadas  : {summary['comunas']}")
    print(f"Aptas para visor      : {summary['aptos_si']}")
    print(f"Requieren revisión    : {summary['aptos_revisar']}")
    print(f"No aptas              : {summary['aptos_no']}")
    print(f"Salida                 : {output / 'consolidado_sig_comunal.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
