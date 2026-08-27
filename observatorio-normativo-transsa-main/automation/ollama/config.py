from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class OllamaConfig:
    base_url: str = "http://localhost:11434"
    model: str = "qwen3:8b"
    timeout_seconds: int = 240
    temperature: float = 0.1
    num_ctx: int = 8192
    max_input_characters: int = 24000
    retries: int = 2


def load_ollama_config(path: Path) -> OllamaConfig:
    if not path.exists():
        return OllamaConfig()

    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict):
        raise ValueError("config/ollama.json debe contener un objeto JSON.")

    return OllamaConfig(
        base_url=str(payload.get("base_url") or "http://localhost:11434").rstrip("/"),
        model=str(payload.get("model") or "qwen3:8b").strip(),
        timeout_seconds=int(payload.get("timeout_seconds") or 240),
        temperature=float(payload.get("temperature") if payload.get("temperature") is not None else 0.1),
        num_ctx=int(payload.get("num_ctx") or 8192),
        max_input_characters=int(payload.get("max_input_characters") or 24000),
        retries=max(1, int(payload.get("retries") or 2)),
    )
