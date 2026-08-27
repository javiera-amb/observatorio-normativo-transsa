# Sprint 2 — Motor universal de eventos

## Objetivo

Permitir que Transsa Urban Intelligence reciba una estructura común para normativa, noticias, señales de mercado, proyectos urbanos, evaluaciones ambientales, infraestructura, indicadores, informes y fallos.

## Entregables

- vocabulario controlado en `core/vocabulary.py`;
- validación estricta en `core/validation.py`;
- importador universal en `core/ingest.py`;
- esquema SQLite versión 2, no destructivo;
- relaciones con territorios, temas, segmentos, actores y proyectos;
- exportación web a `data/eventos.js`;
- plantilla `nuevo_evento_universal_ejemplo.json`;
- comandos de validación e importación;
- pruebas automáticas.

## Regla de estados

Ollama y los recolectores solo podrán crear eventos `preliminary` o `requires_review`. La categoría `validated` queda reservada para revisión humana y exige identificar al validador.

## Comandos

Validar sin guardar:

```bash
python scripts/validate_event.py nuevo_evento_universal_ejemplo.json
```

Importar un archivo real:

```bash
python scripts/import_event.py data/inbox/mi_evento.json
python scripts/export_web_events.py
```

## Compatibilidad

Los seis reportes heredados continúan almacenados y `data/reportes.js` no cambia. `data/eventos.js` es una salida nueva para el portal futuro y no altera la visualización actual.
