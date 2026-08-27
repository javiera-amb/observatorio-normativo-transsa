# Sprint 5 — Base del módulo Noticias y Mercado (v0.6)

## Objetivo

Crear la capa inicial de recolección de noticias urbanas e inmobiliarias para Chile completo, sin modificar todavía el portal público, la base principal ni la automatización diaria.

## Alcance de esta entrega

- registro central de fuentes en `config/fuentes_noticias.json`;
- modelos de fuentes y noticias;
- normalización de títulos, textos y URLs;
- eliminación de parámetros de seguimiento;
- lectura de RSS 2.0 y Atom;
- deduplicación por URL, identificador y similitud de título;
- prefiltro ponderado de relevancia;
- comando de prueba sin escritura en la base;
- pruebas automáticas.

## Principios

1. Cobertura nacional, incluyendo medios regionales trazables.
2. Prioridad para mercado, inversión, proyectos, infraestructura, vivienda y desarrollo urbano.
3. No copiar artículos completos.
4. No evadir paywalls ni restricciones técnicas.
5. Respetar términos de uso, `robots.txt` y mecanismos autorizados.
6. Separar el hecho publicado de la interpretación de Transsa.
7. Mantener visible el nivel de confianza y el eventual interés comercial de cada fuente.

## Niveles de confianza

- **A:** fuente primaria, medio económico consolidado, gremio o consultora reconocida.
- **B:** medio especializado o regional con autoría y trazabilidad.
- **C:** blog corporativo, inmobiliaria, corredora o fuente comercial útil como señal.
- **D:** contenido no verificado. No ingresa automáticamente como evento.

El nivel no implica neutralidad. Una fuente puede ser técnicamente sólida y, al mismo tiempo, tener interés comercial.

## Estado inicial de fuentes

Las fuentes RSS verificadas o aptas para prueba se habilitan en la configuración. Las fuentes que requieren revisión de acceso o un recolector específico permanecen deshabilitadas. Esto evita implementar scraping indiscriminado.

El registro inicial considera, entre otras:

- Diario Financiero;
- Pulso;
- El Diario Inmobiliario;
- Revista EMB Construcción;
- Enlace Informa;
- ArchDaily Chile;
- Inmobiliare;
- Cámara Chilena de la Construcción;
- Colliers Chile;
- Cushman & Wakefield Chile;
- CBRE Chile;
- MINVU;
- SEA;
- medios regionales.

## Prefiltro

El prefiltro no reemplaza a Ollama ni a la revisión humana. Solo reduce el universo de noticias mediante términos ponderados y exclusiones.

Ejemplos de señales fuertes:

- proyecto o inversión inmobiliaria;
- permisos de edificación;
- mercado o valor de suelo;
- plan regulador y uso de suelo;
- infraestructura urbana;
- déficit habitacional;
- costos y actividad de la construcción;
- oficinas, logística, retail y multifamily.

Los resultados quedan en cuatro niveles técnicos: `high`, `medium`, `low` y `discard`.

## Prueba local

```bash
python -m unittest discover -s tests -v
python scripts/run_news_dry_run.py
```

Para limitar una prueba a una fuente:

```bash
python scripts/run_news_dry_run.py --source diario_el_dia_region
```

Para guardar el resultado fuera de la base principal:

```bash
python scripts/run_news_dry_run.py --output data/inbox/noticias/dry_run.json
```

## Fuera de alcance por ahora

- análisis con Ollama;
- extracción del artículo completo;
- publicación de noticias en el portal;
- generación de boletín Word;
- escritura en SQLite;
- activación dentro de la tarea de las 08:30;
- seguimiento de propiedades ofertadas.

## Próxima entrega

1. ejecutar y auditar feeds reales;
2. corregir fuentes que respondan HTML o bloqueen automatización;
3. incorporar extracción territorial preliminar;
4. convertir candidatos en eventos canónicos;
5. conectar Ollama en modo preliminar;
6. recién después diseñar la sección `Noticias y mercado` del portal.
