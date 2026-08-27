# Decisión operativa — Fuentes de noticias v0.6

## Criterio

La incorporación de una fuente no depende únicamente de su prestigio. También se evalúan:

- trazabilidad del contenido;
- autoría y fecha visibles;
- mecanismo de acceso permitido;
- estabilidad técnica;
- cobertura territorial;
- interés comercial declarado;
- posibilidad de corroborar cifras o afirmaciones.

## Estados

- `verified_public_feed`: feed público identificado y apto para prueba.
- `runtime_required`: endpoint plausible que debe verificarse en ejecución local.
- `pending_feed_verification`: el sitio parece ofrecer sindicación, pero falta confirmar endpoint y condiciones.
- `pending_access_review`: requiere revisar términos y mecanismo de acceso.
- `pending_collector`: fuente aprobada conceptualmente, pero necesita un recolector específico.

## Regla de activación

Una fuente se activa solo cuando:

1. el acceso es público y permitido;
2. entrega título, fecha y URL trazable;
3. el recolector no necesita evadir restricciones;
4. supera una prueba local sin errores;
5. sus noticias relevantes pueden distinguirse de contenido promocional o irrelevante.

## Regla editorial

El registro de una noticia no equivale a validar sus afirmaciones. La plataforma debe conservar la fuente original, indicar su nivel de confianza y diferenciar:

- hechos publicados;
- cifras atribuidas;
- interpretación preliminar de Ollama;
- validación humana de Transsa.
