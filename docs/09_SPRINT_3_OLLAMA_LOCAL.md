# Sprint 3 — Integración local con Ollama

## Objetivo

Conectar Transsa Urban Intelligence con un modelo local gratuito sin usar una API pagada. Ollama genera análisis **preliminares** y nunca reemplaza la validación humana ni los reportes finales preparados con ChatGPT.

## Componentes incorporados

- `config/ollama.json`: configuración del servidor y modelo.
- `automation/ollama/client.py`: comunicación con la API local.
- `automation/ollama/prompts.py`: instrucciones de análisis TUI.
- `automation/ollama/normalize.py`: normalización a vocabularios controlados.
- `automation/ollama/analyzer.py`: construcción y validación de eventos preliminares.
- `scripts/test_ollama_connection.py`: prueba integral sin importar datos a la base.
- `scripts/analyze_with_ollama.py`: análisis manual de documentos JSON.
- `tests/test_ollama_module.py`: pruebas unitarias del módulo.

## Principio de revisión

Los eventos creados por este módulo solo pueden tener estado:

- `preliminary`
- `requires_review`

Ollama no puede asignar `validated`. Los resultados incluyen la etiqueta `ollama_preliminary` y conservan el nombre del modelo utilizado.

## Prueba segura

`instalar_actualizacion_v0_4.bat` ejecuta una prueba sobre `prueba_ollama_documento.json` y guarda el resultado en:

```text
data/inbox/prueba_ollama_resultado.json
```

El evento de prueba no se importa a SQLite ni altera el portal.

## Uso manual

```powershell
py scripts/analyze_with_ollama.py mi_documento.json
```

Para importar después de revisar:

```powershell
py scripts/analyze_with_ollama.py mi_documento.json --importar
py scripts/export_web_events.py
```

## Formato de entrada

El archivo debe contener un objeto JSON con:

```json
{
  "title": "Título del antecedente",
  "event_date": "2026-08-05",
  "published_at": "2026-08-05",
  "source": {
    "source_name": "Nombre de la fuente",
    "source_type": "news_media",
    "reliability_level": "medium",
    "url": ""
  },
  "territory": {
    "scale": "undetermined",
    "region": "",
    "commune": ""
  },
  "text": "Texto completo o extracto público a analizar"
}
```

## Alcance de esta versión

La v0.4 prueba y habilita el motor local. Todavía no reemplaza `automation/actualizar_desde_diario.py` ni publica noticias automáticamente. La siguiente versión conectará este motor a la cola de documentos y eliminará la dependencia operativa de OpenAI.
