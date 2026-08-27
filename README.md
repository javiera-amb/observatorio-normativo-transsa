# Transsa Urban Intelligence

**Sistema de inteligencia urbana, territorial e inmobiliaria de Transsa.**

El repositorio evoluciona desde el antiguo Observatorio Normativo Urbano hacia una plataforma que detecta, interpreta, gestiona y publica información pública relevante para el equipo: normativa, planificación, noticias, mercado inmobiliario, desarrollo urbano, infraestructura, proyectos y alertas.

## Estado actual

El portal existente continúa operativo con estos módulos:

1. Diario Oficial.
2. Actualizaciones IPT.
3. Histórico anual.
4. Mapa territorial.
5. Vigencia cartográfica.

La migración será incremental y mantendrá compatibilidad durante cada sprint.

## Documentación fundacional

Lee primero [`docs/README.md`](docs/README.md).

Documentos principales:

- [`docs/01_VISION_Y_PRINCIPIOS.md`](docs/01_VISION_Y_PRINCIPIOS.md)
- [`docs/02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md)
- [`docs/03_MODELO_DE_DATOS.md`](docs/03_MODELO_DE_DATOS.md)
- [`docs/04_ROADMAP.md`](docs/04_ROADMAP.md)
- [`docs/05_DIAGNOSTICO_REPOSITORIO_ACTUAL.md`](docs/05_DIAGNOSTICO_REPOSITORIO_ACTUAL.md)

## Automatizaciones existentes

- `.github/workflows/actualizar-diario.yml`
- `.github/workflows/actualizar-ipt.yml`
- `.github/workflows/cargar-historico-anual.yml`
- `.github/workflows/actualizar-vigencia-cartografica.yml`

## Bases web actuales

- `data/reportes.js`
- `data/ipt_reportes.js`
- `data/historicos.js`
- `data/vigencia_cartografica.js`


## Núcleo de datos v0.2

La plataforma cuenta con una migración compatible desde `data/reportes.js` hacia eventos canónicos y SQLite.

Para reconstruir y validar la capa de datos:

```bash
python scripts/run_sprint1.py
python -m unittest discover -s tests -v
```

El portal sigue leyendo `data/reportes.js`; por lo tanto, esta versión no altera la experiencia visible.

## Motor local de IA

Desde la versión 0.4, Transsa Urban Intelligence puede usar Ollama con `qwen3:8b` para generar análisis preliminares sin costos de API. La revisión y versión validada siguen siendo humanas. Consulta `docs/09_SPRINT_3_OLLAMA_LOCAL.md`.

## Diario Oficial local v0.5

La revisión diaria ya no depende de una API pagada. El comando:

```text
ejecutar_diario_local.bat
```

descarga la edición oficial, aplica reglas, analiza candidatos con Ollama, guarda los documentos originales, actualiza SQLite y genera un Word preliminar. Consulta `docs/11_SPRINT_4_DIARIO_OFICIAL_LOCAL.md`.
