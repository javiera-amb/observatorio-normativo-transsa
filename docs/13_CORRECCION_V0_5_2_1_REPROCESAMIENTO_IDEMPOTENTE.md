# Corrección v0.5.2.1 — Reprocesamiento idempotente

## Problema observado

Al reprocesar una publicación ya registrada, la mejora de extracción institucional podía cambiar el `document_id` calculado. La URL oficial seguía siendo la misma y posee una restricción única en SQLite, por lo que se producía:

`UNIQUE constraint failed: source_documents.url`

## Solución

- Se conserva el `document_id` histórico cuando la URL oficial ya existe.
- Como respaldo, se reutiliza un `external_id` cuando identifica inequívocamente a un documento.
- La identidad documental se calcula antes de sustituir la fuente de publicación por el organismo emisor.
- Se añadió una prueba automática de reprocesamiento con cambio de organismo emisor.

## Resultado esperado

El reprocesamiento actualiza el evento y el documento existente, sin crear duplicados ni borrar antecedentes históricos.
