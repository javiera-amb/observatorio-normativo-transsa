# Changelog

## v0.5.3 - Precisión jurídica e inteligencia urbana

- Corrige la semántica de apertura de participación ciudadana en evaluaciones ambientales en curso.
- Extrae inicio del cómputo del plazo, base legal y antecedentes concretos del proyecto.
- Mejora implicancias y acciones sugeridas para proyectos industriales y portuarios/logísticos.
- Corrige la puntuación de la edición en el Word.
- Aumenta la cobertura a 25 pruebas automáticas.

## 0.1.0-foundation — 2026-08-05

### Añadido

- identidad de producto Transsa Urban Intelligence;
- visión, principios y límites respecto de Propiteq;
- arquitectura modular;
- modelo de datos basado en eventos;
- estrategia de almacenamiento híbrido;
- roadmap de implementación;
- diagnóstico del repositorio actual;
- registros iniciales de decisiones de arquitectura.

### Sin cambios funcionales

Esta versión no modifica el portal ni las automatizaciones existentes.

## 0.2.0 - 2026-08-05

### Agregado
- Núcleo `core/` con modelo canónico de eventos.
- Esquema SQLite v1 con fuentes, documentos, eventos, territorios, temas, reportes y ejecuciones.
- Migrador idempotente desde `data/reportes.js`.
- JSON canónico por evento en `data/events/`.
- Exportador compatible que regenera `window.REPORTES` sin modificar el portal.
- Validación automática y pruebas unitarias.

### Compatibilidad
- `index.html`, `app.js`, `styles.css` y los módulos visibles no fueron modificados.
- El contenido heredado puede reconstruirse exactamente desde SQLite.

## v0.3.0 - Motor universal de eventos

- Se incorpora vocabulario controlado para normativa, noticias, mercado, proyectos e indicadores.
- Se agrega validación estricta de eventos y estados de revisión.
- SQLite avanza al esquema 2 con relaciones de segmentos, actores, proyectos, etiquetas y eventos.
- Se crean importador universal, plantilla de ejemplo y exportación `data/eventos.js`.
- Se mantiene intacta la compatibilidad con `data/reportes.js` y el portal actual.

## [0.4.0] - 2026-08-05

### Añadido
- Integración local con Ollama y `qwen3:8b`.
- Cliente HTTP sin dependencias externas adicionales.
- Prompt de análisis preliminar para normativa, noticias, mercado y desarrollo urbano.
- Normalización a vocabularios controlados de TUI.
- Validación canónica antes de aceptar un resultado de IA.
- Prueba local segura que no modifica SQLite ni el portal.
- Comando manual para analizar e importar documentos.

### Seguridad y trazabilidad
- Ollama nunca puede marcar eventos como validados.
- Los eventos automáticos quedan como `preliminary` o `requires_review`.
- Se registra el proveedor y modelo en el payload heredado del evento.

## [0.4.1] - 2026-08-05

### Corregido
- Clasificación híbrida: reglas determinísticas de alta precisión corrigen tipos evidentes aunque Ollama proponga `news`.
- Las modificaciones de PRC, PRI, PRM, seccionales, límites urbanos y otras materias urbanísticas explícitas se clasifican como `normative_update`.
- Las publicaciones SEA explícitas se clasifican como `environmental_assessment`.
- Un motivo de revisión no vacío obliga al estado `requires_review`.
- Eventos comunales sin comuna y regionales sin región quedan obligatoriamente en revisión.
- Se corrige el código interno `publish_to_propiteq`, manteniendo compatibilidad con la grafía anterior.

### Trazabilidad
- Se conserva el tipo originalmente propuesto por Ollama en `legacy_payload.ai_event_type_raw`.
- Se registra la razón de la clasificación final en `legacy_payload.classification_reason`.

## [0.5.0] - 2026-08-05

### Añadido
- Pipeline local completo para el Diario Oficial sin consumo de OpenAI API.
- Descarga y archivo de PDF y texto original por edición.
- Prefiltro determinístico con ponderación y exclusiones.
- Análisis preliminar con Ollama y clasificación híbrida.
- Manifiesto por corrida y registro en `pipeline_runs`.
- Generación de Word preliminar.
- Actualización de SQLite, JSON canónicos, `data/eventos.js` y `data/reportes.js`.
- Ejecución de un clic mediante `ejecutar_diario_local.bat`.
- Diecisiete pruebas automáticas.

### Cambiado
- El workflow del Diario Oficial deja de ejecutar análisis pagado en GitHub y pasa a validar código y portal.
- El análisis diario se ejecuta localmente, donde está disponible Ollama.

## [0.5.1] - 2026-08-05

### Corregido
- Se incorpora `tzdata` para que `zoneinfo` reconozca `America/Santiago` en Windows.
- `ejecutar_diario_local.bat` verifica la zona horaria e instala el soporte faltante antes de iniciar el pipeline.
- Se agrega una prueba automática específica para la zona horaria de Chile.

### Compatibilidad
- No modifica reportes, eventos, SQLite ni el portal.

## v0.5.2 — QA institucional y jurídico del Diario Oficial

- Se separa el organismo emisor de la fuente de publicación.
- Se extraen número y fecha del acto, etapa procedimental, plazo de participación,
  titular/proponente, proyecto y ubicación explícita.
- Se estandarizan nombres regionales y se presenta escala regional y comunal.
- Las razones de revisión ahora indican campos concretos faltantes.
- Se corrige la descripción de participación ciudadana en DIA: es una etapa dentro
  de una evaluación ambiental en curso, no el inicio de toda la evaluación.
- Se mejora el formato del Word y la fecha en español.
- Se actualiza la prueba de compatibilidad para eventos universales.

## v0.5.2.1 - 2026-08-05

- Corrige el reprocesamiento de documentos cuya URL oficial ya existe.
- Conserva la identidad histórica del documento y actualiza sus metadatos.
- Evita `UNIQUE constraint failed: source_documents.url`.
- Añade prueba automática de idempotencia documental.

## v0.5.2.2 - 2026-08-05

- Corrige el bloqueo de archivos temporales SQLite en Windows durante las pruebas.
- Cierra explícitamente la conexión de `test_document_reprocessing.py`.
- No modifica la base principal, los eventos ni el portal.
