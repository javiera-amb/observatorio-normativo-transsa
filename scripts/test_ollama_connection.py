from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.ollama import OllamaClient, OllamaError, analyze_document, load_ollama_config
from core.paths import ProjectPaths


def main() -> int:
    project = ProjectPaths.discover(ROOT)
    project.ensure_runtime_directories()
    config = load_ollama_config(project.root / "config" / "ollama.json")
    client = OllamaClient(config)

    print("COMPROBANDO OLLAMA LOCAL")
    print(f"- Servidor: {config.base_url}")
    print(f"- Modelo configurado: {config.model}")

    try:
        models = client.available_models()
    except OllamaError as exc:
        print(f"ERROR: {exc}")
        return 1

    print(f"- Modelos disponibles: {', '.join(models) if models else 'ninguno'}")
    if not client.model_is_available():
        print(f"ERROR: el modelo {config.model} no está instalado.")
        print(f"Ejecuta: ollama pull {config.model}")
        return 1

    test_path = project.root / "prueba_ollama_documento.json"
    payload = json.loads(test_path.read_text(encoding="utf-8-sig"))
    text = str(payload.pop("text") or "")

    print("- Ejecutando análisis de prueba. La primera carga puede tardar...")
    try:
        analysis, event = analyze_document(client, payload, text)
    except Exception as exc:
        print(f"ERROR durante el análisis: {exc}")
        return 1

    output = {
        "analysis": analysis,
        "canonical_event": event.to_dict(),
    }
    output_path = project.inbox_dir / "prueba_ollama_resultado.json"
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("\nANÁLISIS LOCAL CORRECTO")
    print(f"- Tipo: {event.event_type}")
    print(f"- Clasificación: {analysis.get('classification_reason', '')}")
    print(f"- Resumen: {event.summary}")
    print(f"- Relevancia: {event.relevance_level}")
    print(f"- Impacto: {event.impact_level}")
    print(f"- Estado: {event.review_status}")
    if event.requires_review_reason:
        print(f"- Motivo de revisión: {event.requires_review_reason}")
    print(f"- Resultado guardado en: {output_path.relative_to(project.root)}")
    print("- El evento de prueba NO fue importado a la base principal.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
