# Transsa Urban Intelligence
## 05. Diagnóstico del repositorio actual y plan de migración

**Fecha del diagnóstico:** 5 de agosto de 2026  
**Repositorio revisado:** `observatorio-normativo-transsa`

---

## 1. Estado actual

El repositorio ya contiene un MVP funcional con:

- portal estático en `index.html`, `app.js` y `styles.css`;
- módulo Diario Oficial;
- módulo de actualizaciones IPT;
- histórico anual;
- mapa territorial;
- vigencia cartográfica;
- generación de Word;
- workflows de GitHub Actions;
- archivos JavaScript como base de publicación;
- automatización de comparación cartográfica opcional.

Por lo tanto, la estrategia correcta es una migración incremental, no una reescritura total.

---

## 2. Hallazgos técnicos

### 2.1 Dependencia pagada

`automation/actualizar_desde_diario.py` utiliza OpenAI para:

- seleccionar publicaciones relevantes;
- analizar documentos;
- generar contenido estructurado.

`automation/requirements.txt` incluye `openai` y el workflow diario requiere `OPENAI_API_KEY`. La ejecución actual falla cuando no existe cuota disponible.

### 2.2 Programación diaria

El workflow `actualizar-diario.yml` está programado a las 08:30 en `America/Santiago` y corre en `ubuntu-latest`.

Para usar Ollama local se deberá cambiar este flujo, porque un runner estándar de GitHub no tiene acceso al modelo instalado en el computador. Opciones:

1. ejecutar toda la automatización mediante una tarea programada de Windows y hacer push;
2. registrar el computador como runner autohospedado;
3. mantener GitHub Actions solo para validar y desplegar después del push.

Se recomienda comenzar con la opción 1 por simplicidad y dejar el runner autohospedado para una etapa posterior.

### 2.3 Datos actuales

`data/reportes.js` contiene fichas con campos útiles, pero mezcla:

- documento fuente;
- evento;
- análisis;
- publicación web.

Se conservará como salida compatible durante la migración, pero no como único registro maestro.

### 2.4 Portal

El portal actual está orientado principalmente a normativa e IPT. La base visual y técnica puede conservarse, pero la navegación deberá evolucionar para incorporar noticias, mercado, inteligencia y alertas.

### 2.5 Repositorio comprimido

El ZIP recibido incluye la carpeta `.git`. No debe compartirse habitualmente dentro de paquetes de revisión porque agrega peso y metadatos innecesarios. El repositorio local original debe conservarla; los ZIP de intercambio futuro deben excluirla.

---

## 3. Mapa de decisiones

### Se conserva

- portal estático y publicación mediante enlace;
- diseño visual como base;
- módulos IPT, histórico, mapa y vigencia;
- generación Word;
- validación del sitio;
- archivos actuales como capa de compatibilidad;
- workflows que no dependan de OpenAI, mientras se refactorizan.

### Se modifica

- marca y propósito del portal;
- modelo de datos;
- automatización diaria;
- estructura de módulos;
- clasificación y análisis;
- almacenamiento de fuentes originales;
- navegación;
- requirements;
- documentación de configuración.

### Se crea

- `docs/`;
- núcleo común;
- base SQLite;
- JSON canónicos por evento;
- registro de ejecuciones;
- módulo de noticias;
- exportaciones web nuevas;
- estados preliminar/validado;
- alertas y backlog;
- integración local con Ollama.

### No se elimina todavía

- `automation/actualizar_desde_diario.py`;
- `data/reportes.js`;
- `index.html`, `app.js`, `styles.css`;
- workflows existentes.

Se reemplazarán solo cuando sus sustitutos hayan pasado pruebas de equivalencia.

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper el portal durante la migración | Mantener exportación compatible y pruebas de sitio |
| Perder reportes históricos | Respaldo, no borrado y migración verificable |
| Ollama entrega JSON inválido | Validador, reintento y fallback por reglas |
| Computador apagado a la hora programada | Tarea al iniciar sesión y ejecución idempotente |
| Fuentes cambian estructura | Conectores independientes y logs por fuente |
| Noticias duplicadas | Huellas, URL canónica y agrupación de historias |
| Uso indebido de contenido periodístico | Guardar metadatos, resumen propio y enlace, no artículo completo |
| SQLite difícil de versionar en Git | JSON canónico por evento y base reconstruible |
| Reporte automático reemplaza uno revisado | Regla de precedencia de versión validada |

---

## 5. Primer cambio técnico recomendado

El siguiente paso de desarrollo será crear el núcleo mínimo y el esquema de base, sin cambiar el portal:

```text
core/
  __init__.py
  database.py
  models.py
  validation.py

scripts/
  init_database.py
  migrate_legacy_reports.py
  export_legacy_reports.py

data/db/
data/events/
tests/
```

La prueba de aceptación será:

1. leer `data/reportes.js`;
2. convertir sus registros al nuevo modelo;
3. guardarlos en SQLite y JSON;
4. volver a generar `data/reportes.js`;
5. comprobar que el sitio conserva el mismo contenido.

---

## 6. Estado de Sprint 0

- [x] visión y propósito;
- [x] límites respecto de Propiteq;
- [x] arquitectura objetivo;
- [x] modelo de datos lógico;
- [x] roadmap;
- [x] diagnóstico del repositorio;
- [x] revisión y aprobación de la usuaria;
- [ ] commit de documentación en el repositorio local;
- [x] inicio de Sprint 1.
