# Transsa Urban Intelligence (TUI)

**Plataforma de inteligencia urbana, territorial e inmobiliaria del área DEI de Transsa.**

TUI consulta, organiza y publica información pública validada para apoyar seguimiento normativo, planificación territorial, noticias, mercado y capas territoriales. El repositorio contiene el código y la configuración de la plataforma; los archivos canónicos de trabajo viven en SharePoint y la documentación/gobierno operativo vive en Notion.

## Estado operativo actual

Módulos presentes en el portal:

1. Diario Oficial.
2. Actualizaciones IPT.
3. Histórico anual.
4. Mapa territorial.
5. Vigencia cartográfica.
6. Seguimiento normativo y capas territoriales disponibles en el portal.

> La existencia de una sección en el portal no implica que su automatización esté completa. Consulta `docs/21_AUDITORIA_OPERATIVA_TUI_2026-08-28.md` para estado, fallas y deuda técnica verificadas.

## Fuentes canónicas

- **GitHub:** código, configuración, tests y workflows TUI.
- **SharePoint:** GPKG, Excel, documentos fuente y entregables.
- **Notion:** metodología, gobierno, QA, decisiones, estado y enlaces.
- **SQL:** datos productivos cuando corresponda.

No se deben duplicar archivos canónicos en Notion ni guardar credenciales en el repositorio.

## Documentación

El índice real y mantenible es:

- [`docs/00_INDICE_DOCUMENTACION_TUI.md`](docs/00_INDICE_DOCUMENTACION_TUI.md)
- [`docs/21_AUDITORIA_OPERATIVA_TUI_2026-08-28.md`](docs/21_AUDITORIA_OPERATIVA_TUI_2026-08-28.md)

Los antiguos documentos 01–04 mencionados en versiones anteriores del README no existen actualmente en el repositorio ni en su historial disponible; no deben enlazarse como documentación vigente.

## Estructura principal

```text
.github/workflows/   CI y automatizaciones GitHub

automation/          pipelines y conectores de actualización
config/              configuración versionada sin secretos
core/                modelo/eventos/base de datos local
scripts/             utilidades de importación, exportación y mantenimiento
tests/               pruebas automáticas
data/                datos web/versionados que consume el portal
docs/                documentación técnica e histórica útil
documentos/          salidas publicables/versionadas cuando corresponda
consolidados/        consolidados generados que forman parte del producto
*.html, *.js, *.css  portal estático publicado por GitHub Pages
```

## Diario Oficial

La recolección real del Diario Oficial es **local**, no un workflow programado de GitHub Actions.

Flujo actual:

```text
Diario Oficial
→ prefiltro por reglas
→ extracción PDF/texto
→ análisis local con Ollama
→ eventos/SQLite
→ reporte web + Word preliminar
→ QA del portal
→ commit/push de resultados en la rama de trabajo
```

Comandos de apoyo:

- `ejecutar_diario_local.bat`
- `actualizar_y_publicar_tui.ps1`
- `instalar_tarea_diaria_tui.ps1`

La tarea de Windows requiere que el computador y la sesión local estén disponibles y que Ollama tenga el modelo configurado. No debe considerarse una automatización servidor 24/7.

## Actualizaciones IPT

`.github/workflows/actualizar-ipt.yml` contiene la automatización mensual de búsqueda de actualizaciones IPT. Su cobertura depende de fuentes oficiales indexadas y actualmente **no sustituye un inventario exhaustivo de ministerios, SEREMI, GORE y municipalidades**. El estado real está documentado en la auditoría operativa.

## Validación CI

`.github/workflows/validar-tui.yml` valida:

- registro de fuentes de noticias;
- tests automáticos;
- sintaxis JavaScript;
- consistencia del portal.

Este workflow **no descarga el Diario Oficial ni ejecuta Ollama**.

## Política de ramas y publicación

El trabajo de desarrollo se realiza en una **rama de trabajo** y se revisa antes de integrarse a `main`.

- Los scripts locales no deben hacer `push` directo a `main`.
- `main` representa la versión publicada/integrada.
- PR/merge y publicación final son pasos separados del proceso local de actualización.
- No asumir permisos de administración por el hecho de poder trabajar en una rama.

## Motor local de IA

El análisis preliminar puede usar Ollama con el modelo configurado en `config/ollama.json`. La IA es apoyo: resultados preliminares o `requires_review` no deben considerarse validados sin revisión humana.
