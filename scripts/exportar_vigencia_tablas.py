from __future__ import annotations

"""Publica un estado nacional fail-closed para el módulo Tablas Normativas."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.tablas_normativas import vigencia_gate  # noqa: E402

TRACKING = ROOT / "data" / "seguimiento_normativo.js"
CERTIFICATES = ROOT / "config" / "tablas_normativas_vigencia"
POLICY = ROOT / "config" / "tablas_normativas_vigencia_policy.json"
OUTPUT = ROOT / "data" / "vigencia_tablas_normativas.js"


def main() -> int:
    tracking = vigencia_gate.load_tracking(TRACKING)
    certificates = vigencia_gate.load_certificates(CERTIFICATES)
    policy = vigencia_gate.load_policy(POLICY)
    rows = []
    for commune_key, item in sorted(
        tracking.items(), key=lambda pair: str(pair[1].get("comuna") or pair[0])
    ):
        commune = str(item.get("comuna") or commune_key)
        assessment = vigencia_gate.evaluate(
            commune,
            item,
            certificates.get(vigencia_gate.key(commune)),
            policy,
        )
        assessment["ultimo_acto_posterior"] = str(item.get("ultimo_acto_posterior") or "")
        assessment["ultima_revision_normativa"] = str(item.get("ultima_revision_normativa") or "")
        assessment["corte_base_portal_ipt"] = str(item.get("corte_base_portal_ipt") or "")
        assessment["actos_posteriores_detalle"] = item.get("actos_posteriores_detalle") or []
        assessment["candidatos_normativos_detalle"] = item.get("candidatos_normativos_detalle") or []
        rows.append(assessment)

    expected = 346
    if len(rows) != expected:
        raise RuntimeError(
            f"La vigencia nacional debe evaluar {expected} comunas y evaluó {len(rows)}."
        )

    payload = {
        "schema_version": 1,
        "publication_mode": "fail_closed",
        "regla": policy.get("rule", ""),
        "total_comunas": len(rows),
        "certificadas": sum(bool(item.get("vigencia_certificada")) for item in rows),
        "bloqueadas": sum(not bool(item.get("vigencia_certificada")) for item in rows),
        "comunas": rows,
    }
    OUTPUT.write_text(
        "window.VIGENCIA_TABLAS_NORMATIVAS = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(
        f"Vigencia de tablas exportada: {payload['certificadas']} certificadas · "
        f"{payload['bloqueadas']} bloqueadas/revisar · {payload['total_comunas']} comunas."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
