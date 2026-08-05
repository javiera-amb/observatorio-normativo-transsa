from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.ollama import OllamaClient, analyze_document, load_ollama_config
from core.database import initialize_database, upsert_events
from core.events import write_event_json
from core.paths import ProjectPaths


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analiza un documento con Ollama y genera un evento preliminar TUI."
    )
    parser.add_argument("archivo", type=Path, help="JSON con metadatos y campo text.")
    parser.add_argument(
        "--importar",
        action="store_true",
        help="Importa el evento preliminar a SQLite y data/events.",
    )
    parser.add_argument("--salida", type=Path, help="Ruta de salida JSON opcional.")
    args = parser.parse_args()

    project = ProjectPaths.discover(ROOT)
    project.ensure_runtime_directories()
    input_path = args.archivo.expanduser().resolve()
    if not input_path.exists():
        print(f"ERROR: no existe el archivo {input_path}")
        return 1

    payload = json.loads(input_path.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, dict):
        print("ERROR: el archivo debe contener un objeto JSON.")
        return 1
    text = str(payload.pop("text", ""))

    config = load_ollama_config(project.root / "config" / "ollama.json")
    client = OllamaClient(config)

    try:
        analysis, event = analyze_document(client, payload, text)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    output = {"analysis": analysis, "canonical_event": event.to_dict()}
    output_path = args.salida.expanduser().resolve() if args.salida else (
        project.inbox_dir / f"{event.event_id}_ollama.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("ANÁLISIS PRELIMINAR GENERADO")
    print(f"- Evento: {event.event_id}")
    print(f"- Salida: {output_path}")

    if args.importar:
        initialize_database(project.database)
        created, updated = upsert_events(project.database, [event])
        canonical_path = write_event_json(project.events_dir, event)
        print(f"- Base: creados={created}, actualizados={updated}")
        print(f"- JSON canónico: {canonical_path.relative_to(project.root)}")
        print("- Ejecuta scripts/export_web_events.py para actualizar data/eventos.js.")
    else:
        print("- No se importó a la base. Revisa el resultado antes de usar --importar.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
