# Operación local · Diario Oficial TUI

## Objetivo

Ejecutar la revisión diaria del Diario Oficial, generar resultados preliminares, validar el portal y publicar esos resultados en una **rama de trabajo** para revisión posterior.

## Dependencias locales

- Python disponible en PATH.
- Ollama ejecutándose en `http://localhost:11434`.
- Modelo `qwen3:8b` disponible, salvo que la configuración operativa se cambie de forma controlada.
- Clon Git del repositorio.
- Sesión de Windows iniciada para la tarea programada actual.

## Ejecución manual

```text
ejecutar_diario_local.bat
```

El pipeline:

1. consulta la edición más reciente del Diario Oficial;
2. detecta publicaciones PDF;
3. aplica un prefiltro por relevancia;
4. descarga candidatos;
5. extrae texto cuando el PDF lo permite;
6. analiza candidatos con Ollama;
7. actualiza eventos/resultados locales;
8. genera Word preliminar.

## Ejecución diaria con publicación de resultados

```text
actualizar_y_publicar_tui.ps1
```

La versión vigente del script:

- exige estar en una rama distinta de `main`/`master`;
- rechaza detached HEAD;
- comprueba que no existan cambios de código/configuración pendientes;
- actualiza la rama actual desde GitHub;
- comprueba Ollama;
- ejecuta el pipeline del Diario Oficial;
- corre tests y validación del portal;
- prepara solo resultados públicos permitidos;
- hace commit/push **a la rama actual**;
- no integra automáticamente esos cambios a `main`.

## Tarea programada

`instalar_tarea_diaria_tui.ps1` instala una tarea de Windows a las 08:30.

### Limitación importante

La tarea actual usa una sesión interactiva. Por lo tanto, **no es una automatización servidor 24/7**: depende del computador, de la sesión de Windows y de Ollama local. Si el equipo no está disponible, no existe garantía de actualización diaria puntual.

## QA

Los resultados de IA son preliminares. Registros `preliminary` o `requires_review` deben revisarse antes de tratarlos como información validada. La publicación técnica en Git no equivale por sí sola a validación de contenido.

## Datos que no se suben

`.gitignore` excluye, entre otros:

- `_local/`;
- base SQLite local;
- inbox de descarga;
- PDFs/textos originales del Diario Oficial;
- logs.

Esto evita publicar insumos locales o archivos de trabajo innecesarios.
