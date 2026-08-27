from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

DEFAULT_VERIFICATION_PATH = (
    Path(__file__).resolve().parents[2] / "config" / "fuentes_noticias_verificacion.json"
)


@dataclass(slots=True)
class SourceVerification:
    source_id: str
    status: str
    verified_at: str
    evidence_url: str
    feed_url: str = ""
    notes: str = ""


class VerificationConfigError(ValueError):
    pass


def load_verifications(path: str | Path = DEFAULT_VERIFICATION_PATH) -> dict[str, SourceVerification]:
    config_path = Path(path)
    if not config_path.exists():
        return {}

    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise VerificationConfigError(f"JSON inválido en {config_path}: {exc}") from exc

    raw_records = payload.get("records")
    if not isinstance(raw_records, list):
        raise VerificationConfigError("La verificación debe contener una lista 'records'.")

    result: dict[str, SourceVerification] = {}
    issues: list[str] = []

    for index, raw in enumerate(raw_records):
        if not isinstance(raw, dict):
            issues.append(f"records[{index}] debe ser un objeto")
            continue

        source_id = str(raw.get("source_id") or "").strip()
        status = str(raw.get("status") or "").strip()
        verified_at = str(raw.get("verified_at") or "").strip()
        evidence_url = str(raw.get("evidence_url") or "").strip()
        feed_url = str(raw.get("feed_url") or "").strip()

        if not source_id:
            issues.append(f"records[{index}]: source_id obligatorio")
            continue
        if source_id in result:
            issues.append(f"source_id duplicado: {source_id}")
        if status not in {
            "verified_public_feed",
            "runtime_required",
            "pending_feed_verification",
            "pending_access_review",
            "pending_collector",
            "rejected",
        }:
            issues.append(f"{source_id}: status no permitido")
        if not verified_at:
            issues.append(f"{source_id}: verified_at obligatorio")
        if not evidence_url.startswith(("https://", "http://")):
            issues.append(f"{source_id}: evidence_url inválida")

        result[source_id] = SourceVerification(
            source_id=source_id,
            status=status,
            verified_at=verified_at,
            evidence_url=evidence_url,
            feed_url=feed_url,
            notes=str(raw.get("notes") or "").strip(),
        )

    if issues:
        raise VerificationConfigError("; ".join(issues))

    return result
