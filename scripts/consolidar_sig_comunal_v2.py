from __future__ import annotations

"""
Wrapper robusto de consolidar_sig_comunal.py para cargar los 1.784 actos IPT.

La fuente comprimida del repositorio llega a descomprimirse pero presenta un
CRC GZIP inconsistente. Por eso este script:
1. reutiliza una copia JSON limpia si ya fue validada;
2. intenta los bloques nacionales completos 01 ... 10;
3. si GZIP falla SOLO por integridad, lee el DEFLATE interno ignorando el
   trailer CRC y valida el contenido por estructura y conteos conocidos;
4. guarda una copia JSON limpia para no depender nuevamente del GZIP roto.

No modifica ni vuelve a recorrer la cartografia SIG.
"""

import base64
import gzip
import json
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import consolidar_sig_comunal as base  # noqa: E402

EXPECTED_ROWS = 1784
EXPECTED_STATES = {
    "Vigente": 955,
    "Derogado": 631,
    "En Desarrollo": 198,
}
EXPECTED_TYPES = {
    "Enmienda": 158,
    "Rectificación": 38,
    "Modificación mediante seccional": 130,
}
EXPECTED_LINKED = 275
CACHE_NAME = "actos_ipt_nacionales_limpio.json"


def _fragment(path: Path) -> str:
    if not path.exists():
        raise RuntimeError(f"Falta el archivo {path.name}.")
    return base.extract_appended_payload(path)


def _validate_rows(rows: Any, label: str) -> list[list[Any]]:
    if not isinstance(rows, list):
        raise RuntimeError(f"{label}: el contenido no es una lista.")
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError(
            f"{label}: contiene {len(rows)} actos; se esperaban {EXPECTED_ROWS}."
        )

    for position, row in enumerate(rows):
        if not isinstance(row, list) or len(row) < 17:
            raise RuntimeError(f"{label}: fila {position} incompleta.")

    states = Counter(str(row[6] or "") for row in rows)
    types = Counter(str(row[11] or "") for row in rows)
    linked = sum(bool(row[10]) for row in rows)

    state_mismatches = [
        f"{name}: {states.get(name, 0)} != {expected}"
        for name, expected in EXPECTED_STATES.items()
        if states.get(name, 0) != expected
    ]
    type_mismatches = [
        f"{name}: {types.get(name, 0)} != {expected}"
        for name, expected in EXPECTED_TYPES.items()
        if types.get(name, 0) != expected
    ]

    if state_mismatches or type_mismatches or linked != EXPECTED_LINKED:
        details = state_mismatches + type_mismatches
        if linked != EXPECTED_LINKED:
            details.append(f"vinculados por codigo: {linked} != {EXPECTED_LINKED}")
        raise RuntimeError(
            f"{label}: el contenido no coincide con el reporte anual conocido: "
            + "; ".join(details)
        )

    return rows


def _gzip_payload_without_crc(compressed: bytes) -> bytes:
    """Extrae y descomprime el DEFLATE de un GZIP sin validar CRC/ISIZE."""
    if len(compressed) < 18 or compressed[:2] != b"\x1f\x8b":
        raise RuntimeError("cabecera GZIP no reconocida")
    if compressed[2] != 8:
        raise RuntimeError("metodo GZIP distinto de DEFLATE")

    flags = compressed[3]
    position = 10

    # FEXTRA
    if flags & 0x04:
        if position + 2 > len(compressed):
            raise RuntimeError("cabecera FEXTRA incompleta")
        xlen = struct.unpack("<H", compressed[position:position + 2])[0]
        position += 2 + xlen

    # FNAME / FCOMMENT
    for mask in (0x08, 0x10):
        if flags & mask:
            end = compressed.find(b"\x00", position)
            if end < 0:
                raise RuntimeError("cabecera GZIP de texto incompleta")
            position = end + 1

    # FHCRC
    if flags & 0x02:
        position += 2

    if position >= len(compressed) - 8:
        raise RuntimeError("GZIP sin cuerpo DEFLATE suficiente")

    deflate_body = compressed[position:-8]
    return zlib.decompress(deflate_body, -zlib.MAX_WBITS)


def _decode_rows(encoded: str, label: str) -> tuple[list[list[Any]], bool]:
    if len(encoded) % 4 != 0:
        raise RuntimeError(
            f"{label}: longitud Base64 no divisible por 4 ({len(encoded):,})."
        )

    try:
        compressed = base64.b64decode(encoded, validate=True)
    except Exception as error:
        raise RuntimeError(f"{label}: Base64 invalida: {error}") from error

    crc_bypassed = False
    try:
        raw = gzip.decompress(compressed)
    except Exception as gzip_error:
        # La copia actual llega al final del stream pero su trailer CRC es
        # inconsistente. Recuperamos SOLO el DEFLATE y validamos despues el
        # JSON contra todos los conteos conocidos del reporte anual.
        try:
            raw = _gzip_payload_without_crc(compressed)
            crc_bypassed = True
        except Exception as raw_error:
            raise RuntimeError(
                f"{label}: GZIP invalido ({gzip_error}); "
                f"tampoco se pudo recuperar DEFLATE ({raw_error})."
            ) from raw_error

    try:
        rows = json.loads(raw.decode("utf-8"))
    except Exception as error:
        raise RuntimeError(f"{label}: JSON invalido: {error}") from error

    return _validate_rows(rows, label), crc_bypassed


def _cache_path(repo: Path) -> Path:
    return repo / "_local" / "sig_ipt" / CACHE_NAME


def _load_cache(repo: Path) -> list[list[Any]] | None:
    path = _cache_path(repo)
    if not path.exists():
        return None
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
        rows = _validate_rows(rows, "copia JSON limpia")
    except Exception as error:
        print(f"AVISO. Se ignora cache normativa invalida: {error}")
        return None

    print("Base normativa IPT:")
    print("- Fuente utilizada    : copia JSON limpia validada")
    print(f"- Actos verificados   : {len(rows):,}")
    print("- Conteos de control  : OK")
    print()
    return rows


def _save_cache(repo: Path, rows: list[list[Any]]) -> None:
    path = _cache_path(repo)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def _rebuild_national_rows(repo: Path) -> list[list[Any]]:
    cached = _load_cache(repo)
    if cached is not None:
        return cached

    data = repo / "data"
    national_files = [
        data / f"actos_ipt_nacional_{index:02d}.js"
        for index in range(1, 11)
    ]
    missing = [path.name for path in national_files if not path.exists()]
    if missing:
        raise RuntimeError(
            "Faltan bloques nacionales: " + ", ".join(missing)
        )

    encoded = "".join(_fragment(path) for path in national_files)
    rows, crc_bypassed = _decode_rows(
        encoded,
        "bloques nacionales completos 01-10",
    )

    _save_cache(repo, rows)

    print("Base normativa IPT:")
    print("- Fuente utilizada    : bloques nacionales completos 01-10")
    print(f"- Flujo Base64        : {len(encoded):,} caracteres")
    if crc_bypassed:
        print("- CRC GZIP original   : inconsistente; DEFLATE recuperado")
    else:
        print("- CRC GZIP original   : OK")
    print(f"- Actos verificados   : {len(rows):,}")
    print("- Conteos de control  : OK")
    print(f"- Copia limpia        : _local\\sig_ipt\\{CACHE_NAME}")
    print()

    return rows


def load_national_acts(repo: Path) -> list[dict[str, Any]]:
    rows = _rebuild_national_rows(repo)

    acts: list[dict[str, Any]] = []
    for row in rows:
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

    return acts


base.load_national_acts = load_national_acts


if __name__ == "__main__":
    raise SystemExit(base.main())
