# Corrección v0.4.1 — Clasificación híbrida

## Problema detectado

La primera prueba real con Ollama interpretó una modificación explícita de un Plan Regulador Comunal como `news`. El modelo generó un buen resumen, pero el tipo de evento no fue suficientemente preciso. También entregó un motivo de revisión, aunque mantuvo el estado `preliminary`.

## Decisión

Transsa Urban Intelligence no dependerá exclusivamente de la clasificación generativa. La clasificación final preliminar combina:

1. la propuesta de Ollama;
2. reglas determinísticas de alta precisión;
3. validaciones de consistencia territorial;
4. revisión humana posterior.

## Reglas incorporadas

- Instrumentos y actos urbanísticos explícitos → `normative_update`.
- Declaraciones, estudios y procedimientos SEA explícitos → `environmental_assessment`.
- Indicadores oficiales explícitos → `indicator`.
- Informes de mercado identificables → `report`.
- Infraestructura, proyectos urbanos y señales de mercado conservan reglas temáticas específicas.

Las reglas solo sustituyen a Ollama cuando existe una señal textual clara. En casos ambiguos se conserva la propuesta del modelo o se usa `other`.

## Control de revisión

El estado pasa obligatoriamente a `requires_review` cuando:

- existe un motivo de revisión;
- no puede determinarse el territorio;
- la escala es comunal/local y falta la comuna;
- la escala es regional y falta la región.

## Trazabilidad

El evento conserva:

- `ai_event_type_raw`: clasificación original de Ollama;
- `classification_reason`: razón de la clasificación final;
- etiqueta `hybrid_classification`.

La IA sigue sin capacidad para validar eventos.
