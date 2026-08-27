# Sprint 4 — Diario Oficial local sin API pagada

## Objetivo

Reemplazar la dependencia operativa de OpenAI en la revisión diaria del Diario Oficial por un flujo local basado en:

1. descarga oficial;
2. extracción de publicaciones y PDF;
3. prefiltro determinístico por reglas;
4. análisis preliminar con Ollama (`qwen3:8b`);
5. validación canónica;
6. almacenamiento en SQLite y JSON;
7. exportación compatible al portal;
8. generación de Word preliminar.

## Flujo

```text
Diario Oficial
      ↓
Edición y publicaciones
      ↓
Prefiltro por palabras clave y exclusiones
      ↓
Descarga de PDF y extracción de texto
      ↓
Ollama local
      ↓
Clasificación híbrida y validación
      ↓
SQLite + JSON + Word + data/reportes.js + data/eventos.js
```

## Archivos principales

- `automation/actualizar_desde_diario.py`: orquestador local.
- `automation/sources/diario_oficial.py`: descarga, extracción y prefiltro.
- `automation/reports/daily_report.py`: Word y compatibilidad heredada.
- `ejecutar_diario_local.bat`: ejecución de un clic.
- `data/inbox/diario_oficial/YYYY-MM-DD/manifest.json`: trazabilidad de cada corrida.
- `documentos/diario_oficial/YYYY/MM/YYYY-MM-DD/`: PDF y texto originales.
- `documentos/reportes/YYYY/MM/`: reportes Word preliminares.

## Estados

Ollama no valida publicaciones. Los eventos se guardan como:

- `preliminary`; o
- `requires_review`.

La versión validada seguirá requiriendo revisión humana.

## Compatibilidad

El portal actual sigue leyendo `data/reportes.js`. La nueva capa también exporta `data/eventos.js` para el portal futuro.

## Ejecución manual

```text
ejecutar_diario_local.bat
```

Para reprocesar una edición:

```powershell
python automation/actualizar_desde_diario.py --force
```

Para probar sin modificar SQLite ni `data/reportes.js`:

```powershell
python automation/actualizar_desde_diario.py --dry-run
```

## GitHub Actions

El workflow diario pagado se desactiva. GitHub continúa validando código y portal, mientras el análisis con Ollama se ejecuta en el computador local. En el siguiente sprint se configurará la tarea diaria de Windows y el `git push` automático.
