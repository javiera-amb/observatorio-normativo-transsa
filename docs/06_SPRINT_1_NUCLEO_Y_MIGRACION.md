# Transsa Urban Intelligence
## 06. Sprint 1 — Núcleo y migración compatible

**Versión:** 0.2.0  
**Fecha:** 5 de agosto de 2026  
**Estado:** Implementado y validado

## Objetivo

Crear la primera capa operativa del nuevo sistema sin alterar el portal existente.

## Implementación

Se incorporaron:

- paquete común `core/`;
- base SQLite `data/db/tui.sqlite3`;
- eventos canónicos versionables en `data/events/`;
- scripts de migración, exportación y validación;
- pruebas con `unittest`.

## Estrategia de compatibilidad

`data/reportes.js` continúa siendo la fuente consumida por `app.js`. La información también queda normalizada en SQLite y en archivos JSON por evento. Durante la etapa de transición, cada evento conserva el payload heredado para garantizar una regeneración exacta del archivo JavaScript.

## Regla de fuente maestra

Para los registros migrados:

1. el JSON canónico permite revisión y versionado;
2. SQLite permite consultas y relaciones;
3. `data/reportes.js` es una exportación de compatibilidad para el portal.

En los módulos nuevos, el evento canónico será creado primero y la salida web se generará después.

## Prueba de aceptación

- cantidad de reportes heredados = cantidad de eventos;
- un JSON canónico por evento;
- migración idempotente;
- exportación idéntica a la entrada;
- portal sin cambios de estructura ni campos.
