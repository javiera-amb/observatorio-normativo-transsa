from __future__ import annotations

"""
Wrapper de consolidar_sig_comunal.py que reconstruye la base nacional de
1.784 actos IPT exactamente con la misma lógica usada por el navegador.

No modifica la cartografía. Solo reemplaza la función que carga los actos
normativos y luego ejecuta el consolidador existente.
"""

import base64
import gzip
import json
import sys
from pathlib import Path
from typing import Any

# Permite importar el consolidador que está en esta misma carpeta.
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402

STANDARD_PART_LENGTH = 10179
FINAL_PART_LENGTH = 10173
EXPECTED_ENCODED_LENGTH = STANDARD_PART_LENGTH * 9 + FINAL_PART_LENGTH
EXPECTED_ROWS = 1784


def _fragment(path: Path) -> str:
    if not path.exists():
        raise RuntimeError(f"Falta el archivo {path.name}.")
    return base.extract_appended_payload(path)


def _decode_rows(encoded: str) -> list[list[Any]]:
    if len(encoded) != EXPECTED_ENCODED_LENGTH:
        raise RuntimeError(
            "La base reconstruida tiene un largo inesperado: "
            f"{len(encoded):,} caracteres; se esperaban "
            f"{EXPECTED_ENCODED_LENGTH:,}."
        )
    if len(encoded) % 4 != 0:
        raise RuntimeError(
            f"La base reconstruida no es Base64 válida por longitud ({len(encoded)})."
        )

    try:
        compressed = base64.b64decode(encoded, validate=True)
    except Exception as error:
        raise RuntimeError(f"Base64 inválida después de reconstruir: {error}") from error

    try:
        raw = gzip.decompress(compressed)
    except Exception as error:
        raise RuntimeError(f"GZIP inválido después de reconstruir: {error}") from error

    try:
        rows = json.loads(raw.decode("utf-8"))
    except Exception as error:
        raise RuntimeError(f"JSON inválido después de reconstruir: {error}") from error

    if not isinstance(rows, list):
        raise RuntimeError("La base normativa reconstruida no contiene una lista.")
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError(
            f"La base reconstruida contiene {len(rows)} actos; "
            f"se esperaban {EXPECTED_ROWS}."
        )
    return rows


def _rebuild_national_rows(repo: Path) -> list[list[Any]]:
    data = repo / "data"

    # 1) Reproduce la carga normal del navegador: 01 ... 10.
    national_files = [
        data / f"actos_ipt_nacional_{index:02d}.js"
        for index in range(1, 11)
    ]
    raw_payload = "".join(_fragment(path) for path in national_files)

    # 2) Reproduce exactamente repairNinthPart() de
    #    data/actos_ipt_nacionales_finalizar.js.
    repair_files = [
        data / f"actos_ipt_nacional_09{letter}.js"
        for letter in "abcde"
    ]
    correct_ninth_part = "".join(_fragment(path) for path in repair_files)

    if len(correct_ninth_part) != STANDARD_PART_LENGTH:
        raise RuntimeError(
            "El bloque 9 reparado tiene "
            f"{len(correct_ninth_part):,} caracteres; se esperaban "
            f"{STANDARD_PART_LENGTH:,}."
        )

    minimum_payload = STANDARD_PART_LENGTH * 8 + FINAL_PART_LENGTH
    if len(raw_payload) < minimum_payload:
        raise RuntimeError(
            "El flujo nacional original es demasiado corto para reconstruirlo: "
            f"{len(raw_payload):,} caracteres."
        )

    prefix = raw_payload[: STANDARD_PART_LENGTH * 8]
    suffix = raw_payload[-FINAL_PART_LENGTH:]
    repaired = prefix + correct_ninth_part + suffix

    print("Base normativa IPT:")
    print(f"- Flujo original      : {len(raw_payload):,} caracteres")
    print(f"- Bloque 9 reparado   : {len(correct_ninth_part):,} caracteres")
    print(f"- Flujo reconstruido  : {len(repaired):,} caracteres")

    return _decode_rows(repaired)


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    rows = _rebuild_national_rows(repo)

    acts: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 17:
            raise RuntimeError(
                "Se encontró una fila normativa incompleta dentro de los 1.784 actos."
            )

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

    if len(acts) != EXPECTED_ROWS:
        raise RuntimeError(
            f"Se interpretaron {len(acts)} actos; se esperaban {EXPECTED_ROWS}."
        )

    print(f"- Actos verificados   : {len(acts):,}")
    print()
    return acts


# El main del consolidado consulta esta función global al ejecutarse.
base.load_national_acts = load_national_acts


if __name__ == "__main__":
    raise SystemExit(base.main())
