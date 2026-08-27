# Checklist de revisión — Noticias v0.6

## Código

- [ ] Las pruebas existentes del repositorio continúan aprobadas.
- [ ] `tests/test_news_module.py` queda incluido en el descubrimiento de `unittest`.
- [ ] La configuración de fuentes no contiene IDs duplicados.
- [ ] Ninguna fuente RSS habilitada carece de `feed_url`.
- [ ] El dry run no modifica SQLite ni archivos públicos del portal.

## Fuentes

- [ ] Se verifican localmente los feeds habilitados.
- [ ] Las fuentes que responden HTML, bloqueo o error quedan deshabilitadas.
- [ ] Se documenta cualquier restricción de uso detectada.
- [ ] El contenido comercial queda identificado.

## Calidad

- [ ] Se revisan falsos positivos y falsos negativos del prefiltro.
- [ ] La deduplicación no elimina noticias realmente distintas.
- [ ] Las URLs quedan sin parámetros de seguimiento.
- [ ] Las fechas quedan en formato `YYYY-MM-DD`.

## Integración

- [ ] No se modifica el portal en esta entrega.
- [ ] No se modifica la tarea diaria de las 08:30.
- [ ] No se conecta Ollama todavía.
- [ ] La rama puede integrarse mediante squash cuando la validación esté completa.
