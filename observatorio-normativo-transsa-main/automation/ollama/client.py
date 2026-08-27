from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .config import OllamaConfig


class OllamaError(RuntimeError):
    """Error controlado de conexión, modelo o respuesta de Ollama."""


@dataclass(slots=True)
class OllamaClient:
    config: OllamaConfig

    def _request_json(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"{self.config.base_url}{path}"
        body = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = Request(url, data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=self.config.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise OllamaError(f"Ollama respondió HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise OllamaError(
                "No fue posible conectar con Ollama en "
                f"{self.config.base_url}. Comprueba que Ollama esté iniciado."
            ) from exc
        except TimeoutError as exc:
            raise OllamaError(
                f"Ollama no respondió dentro de {self.config.timeout_seconds} segundos."
            ) from exc

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise OllamaError("Ollama devolvió una respuesta HTTP que no es JSON válido.") from exc
        if not isinstance(parsed, dict):
            raise OllamaError("La respuesta de Ollama no tiene la estructura esperada.")
        return parsed

    def available_models(self) -> list[str]:
        response = self._request_json("GET", "/api/tags")
        models = response.get("models") or []
        result: list[str] = []
        for item in models:
            if isinstance(item, dict):
                name = str(item.get("name") or item.get("model") or "").strip()
                if name:
                    result.append(name)
        return result

    def model_is_available(self) -> bool:
        wanted = self.config.model.lower()
        return any(
            name.lower() == wanted or name.lower().split(":")[0] == wanted.split(":")[0]
            for name in self.available_models()
        )

    def generate_json(self, prompt: str) -> dict[str, Any]:
        request_payload = {
            "model": self.config.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "think": False,
            "options": {
                "temperature": self.config.temperature,
                "num_ctx": self.config.num_ctx,
            },
        }

        last_error: Exception | None = None
        for _ in range(self.config.retries):
            try:
                response = self._request_json("POST", "/api/generate", request_payload)
                raw_content = response.get("response")
                if isinstance(raw_content, dict):
                    return raw_content
                if not isinstance(raw_content, str) or not raw_content.strip():
                    raise OllamaError("Ollama no devolvió contenido en el campo 'response'.")
                return parse_json_object(raw_content)
            except (OllamaError, ValueError) as exc:
                last_error = exc

        raise OllamaError(f"No se obtuvo JSON válido desde Ollama: {last_error}")


def parse_json_object(text: str) -> dict[str, Any]:
    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate, flags=re.IGNORECASE)
        candidate = re.sub(r"\s*```$", "", candidate)

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("No se encontró un objeto JSON en la respuesta.")
        parsed = json.loads(candidate[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("La respuesta debe ser un objeto JSON.")
    return parsed
