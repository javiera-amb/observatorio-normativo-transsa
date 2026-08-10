from __future__ import annotations

"""
Wrapper de consolidar_sig_comunal.py para cargar de forma robusta la base
nacional de 1.784 actos IPT.

Prioridad:
1. Bloques nacionales completos 01 ... 10 (incluye 09.js).
2. Reconstruccion del bloque 9 con 09a ... 09e, solo como respaldo.
3. Bloques originales actos_ipt_gz_*.js, solo como ultimo respaldo.

No modifica ni vuelve a recorrer la cartografia SIG.
"""

import base64
import gzip
import json
import sys
from pathlib import Path
from typing import Any

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


def _decode_rows(encoded: str, label: str) -> list[list[Any]]:
    if len(encoded) % 4 != 0:
        raise RuntimeError(
            f"{label}: longitud Base64 no divisible por 4 ({len(encoded):,})."
        )

    try:
        compressed = base64.b64decode(encoded, validate=True)
    except Exception as error:
        raise RuntimeError(f"{label}: Base64 invalida: {error}") from error

    try:
        raw = gzip.decompress(compressed)
    except Exception as error:
        raise RuntimeError(f"{label}: GZIP invalido: {error}") from error

    try:
        rows = json.loads(raw.decode("utf-8"))
    except Exception as error:
        raise RuntimeError(f"{label}: JSON invalido: {error}") from error

    if not isinstance(rows, list):
        raise RuntimeError(f"{label}: el contenido no es una lista.")
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError(
            f"{label}: contiene {len(rows)} actos; se esperaban {EXPECTED_ROWS}."
        )
    return rows


def _try_candidate(encoded: str, label: str, errors: list[str]) -> list[list[Any]] | None:
    try:
        rows = _decode_rows(encoded, label)
    except Exception as error:
        errors.append(str(error))
        return None

    print("Base normativa IPT:")
    print(f"- Fuente utilizada    : {label}")
    print(f"- Flujo Base64        : {len(encoded):,} caracteres")
    print(f"- Actos verificados   : {len(rows):,}")
    print()
    return rows


def _rebuild_national_rows(repo: Path) -> list[list[Any]]:
    data = repo / "data"
    errors: list[str] = []

    # 1) Fuente prioritaria: los diez bloques completos.
    #    Importante: aqui se usa actos_ipt_nacional_09.js directamente.
    national_files = [
        data / f"actos_ipt_nacional_{index:02d}.js"
        for index in range(1, 11)
    ]
    if all(path.exists() for path in national_files):
        raw_payload = "".join(_fragment(path) for path in national_files)
        rows = _try_candidate(
            raw_payload,
            "bloques nacionales completos 01-10",
            errors,
        )
        if rows is not None:
            return rows
    else:
        missing = [path.name for path in national_files if not path.exists()]
        errors.append("faltan bloques nacionales: " + ", ".join(missing))
        raw_payload = ""

    # 2) Respaldo: reproduccion de la reparacion web con 09a ... 09e.
    #    Solo se intenta si los fragmentos tienen el largo completo esperado.
    repair_files = [
        data / f"actos_ipt_nacional_09{letter}.js"
        for letter in "abcde"
    ]
    if raw_payload and all(path.exists() for path in repair_files):
        repair_parts = [_fragment(path) for path in repair_files]
        repaired_ninth = "".join(repair_parts)

        if len(repaired_ninth) == STANDARD_PART_LENGTH:
            prefix = raw_payload[: STANDARD_PART_LENGTH * 8]
            suffix = raw_payload[-FINAL_PART_LENGTH:]
            repaired_payload = prefix + repaired_ninth + suffix
            rows = _try_candidate(
                repaired_payload,
                "bloque 9 reconstruido con 09a-09e",
                errors,
            )
            if rows is not None:
                return rows
        else:
            lengths = ", ".join(
                f"09{letter}={len(part):,}"
                for letter, part in zip("abcde", repair_parts)
            )
            errors.append(
                "fragmentos 09a-09e incompletos: "
                f"total {len(repaired_ninth):,} de {STANDARD_PART_LENGTH:,} "
                f"({lengths})"
            )

    # 3) Ultimo respaldo: bloques originales generados desde el CSV anual.
    original_files = sorted(data.glob("actos_ipt_gz_*.js"))
    if original_files:
        try:
            original_payload = "".join(_fragment(path) for path in original_files)
            rows = _try_candidate(
                original_payload,
                "bloques originales actos_ipt_gz_*",
                errors,
            )
            if rows is not None:
                return rows
        except Exception as error:
            errors.append(f"bloques originales: {error}")
    else:
        errors.append("no existen bloques originales actos_ipt_gz_*.js")

    detail = "\n  - ".join(errors)
    raise RuntimeError(
        "No se pudo reconstruir una copia integra de los 1.784 actos IPT.\n"
        f"  - {detail}"
    )


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    rows = _rebuild_national_rows(repo)

    acts: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 17:
            raise RuntimeError(
                "Se encontro una fila normativa incompleta dentro de los 1.784 actos."
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
            "tipo_acto": row[11] or "Modificacion",
        })

    if len(acts) != EXPECTED_ROWS:
        raise RuntimeError(
            f"Se interpretaron {len(acts)} actos; se esperaban {EXPECTED_ROWS}."
        )

    return acts


base.load_national_acts = load_national_acts


if __name__ == "__main__":
    raise SystemExit(base.main())
