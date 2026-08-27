# Corrección v0.5.3: precisión jurídica e inteligencia urbana

## Objetivo

Mejorar la redacción preliminar de eventos ambientales para que el reporte distinga correctamente entre el inicio de una evaluación ambiental y la apertura de participación ciudadana dentro de un procedimiento ya iniciado.

## Cambios implementados

- Extracción del inicio del cómputo del plazo de participación.
- Extracción de la base legal.
- Extracción de antecedentes concretos del proyecto.
- Corrección determinística de `why_it_matters`, `practical_implications` y `recommended_action` para aperturas de participación ciudadana en DIA.
- Acciones diferenciadas para proyectos industriales y portuarios/logísticos.
- Normalización de la puntuación de la edición en el Word.
- Nuevos campos visibles en el reporte: inicio del cómputo, base legal, proyecto y antecedentes concretos.

## Principio de diseño

Ollama propone el análisis, pero reglas de alta precisión prevalecen cuando el texto oficial permite verificar el procedimiento, las cifras y las obras del proyecto.

## Validación

La versión incorpora 25 pruebas automáticas y mantiene la compatibilidad con la base SQLite, los eventos canónicos y el portal existente.
