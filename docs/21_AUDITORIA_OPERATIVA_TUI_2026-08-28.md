# Auditoría operativa TUI · 2026-08-28

## Objetivo

Registrar el estado real de Transsa Urban Intelligence (TUI), separar funciones existentes de automatizaciones incompletas y priorizar correcciones antes de considerar la plataforma estable.

Esta auditoría se basa en el código, configuración y datos actualmente presentes en `main` al 28-08-2026. No asume que una funcionalidad está operativa solo porque exista un botón, archivo o workflow.

## Resumen ejecutivo

| Prioridad | Hallazgo | Estado |
|---|---|---|
| P0 | Diario Oficial no está actualizando diariamente el dato publicado | Falla operativa |
| P0 | Existen análisis claramente incompatibles con el título/fuente de actos oficiales | Falla de calidad |
| P0 | Actualizaciones IPT mensuales no tienen datos publicados (`data/ipt_reportes.js` vacío) | No operativo |
| P0 | Cobertura IPT no incluye recolectores determinísticos de municipalidades/boletines locales | Cobertura crítica incompleta |
| P1 | Diario depende de PC + sesión Windows + Ollama local | Riesgo de continuidad |
| P1 | PDFs sin texto extraíble no tienen fallback OCR | Cobertura incompleta |
| P1 | Noticias y Mercado sigue siendo una base/dry-run, no un módulo productivo | Pendiente |
| P1 | Mayoría de fuentes de noticias de alto valor están deshabilitadas/pending | Cobertura incompleta |
| P1 | Histórico anual publicado está vacío | No operativo/incompleto |
| P1 | Documentación raíz contenía guías contradictorias y enlaces rotos | Corregido en rama de depuración |
| P1 | Script local publicaba directamente a `main` | Corregido en rama de depuración |
| P2 | `data/` contiene múltiples archivos generacionales/intermedios IPT | Deuda de organización |
| P2 | `scripts/` mantiene varias versiones del mismo proceso SIG | Deuda de organización |

---

# 1. Diario Oficial

## 1.1 Qué sí existe

Existe un pipeline local que:

1. abre la edición electrónica del Diario Oficial;
2. detecta publicaciones PDF;
3. puntúa relevancia mediante reglas;
4. descarga candidatos;
5. extrae texto mediante `pypdf`;
6. analiza con Ollama;
7. genera eventos/resultados y Word preliminar;
8. valida el portal antes de publicar resultados.

La recolección real no se ejecuta en GitHub Actions. El workflow CI solo valida código/portal.

## 1.2 Falla: datos desactualizados

Al 28-08-2026, `data/reportes.js` tiene como registros más recientes visibles el **12-08-2026**.

Consecuencia: la automatización diaria no está entregando continuidad diaria al repositorio publicado.

### Causa estructural probable

La tarea depende de:

- computador local disponible;
- sesión Windows iniciada;
- Ollama activo;
- modelo local disponible;
- repositorio local limpio y sincronizable.

La tarea programada usa `LogonType Interactive`. Por diseño, no es un servicio 24/7.

## 1.3 Falla crítica de calidad semántica

Se detectan registros donde la interpretación no coincide con el acto descrito en el título.

Ejemplos verificables en `data/reportes.js`:

- una resolución MINVU que modifica llamados/subsidios habitacionales aparece resumida como si hubiese abierto una participación ciudadana dentro de una DIA;
- una resolución del Consejo de Monumentos Nacionales sobre recabar opinión de propietarios aparece redactada con lenguaje de participación ambiental/SEA.

Esto indica contaminación por plantillas/reglas de inteligencia ambiental o una validación insuficiente del análisis generado.

### Riesgo

Un evento puede ser formalmente trazable a una URL oficial y, aun así, contener una interpretación incorrecta. Para TUI, **fuente correcta no equivale a análisis correcto**.

## 1.4 Riesgo: PDFs escaneados

`pdf_to_text()` usa extracción textual de `pypdf`. Si el PDF es imagen/escaneo y no contiene capa textual, el pipeline registra error y no dispone de fallback OCR.

No se recomienda incorporar OCR indiscriminado; primero debe existir una cola explícita `sin_texto_extraible` para revisión/fallback controlado.

## 1.5 Corrección de gobernanza aplicada en esta rama

El script `actualizar_y_publicar_tui.ps1` antes hacía `git push origin main`.

En esta rama:

- se prohíbe ejecutarlo sobre `main/master`;
- se exige una rama de trabajo;
- el commit/push queda en esa rama;
- PR/merge queda como revisión separada.

---

# 2. Actualizaciones normativas IPT

## 2.1 Estado publicado

`data/ipt_reportes.js` está vacío:

```javascript
window.IPT_REPORTES = [];
```

Por lo tanto, el módulo de actualización mensual IPT **no tiene actualmente una base de resultados publicada en main**.

## 2.2 Cómo funciona hoy la automatización

`automation/actualizar_ipt_mensual.py` consulta el mes calendario anterior por cada una de las 16 regiones mediante búsqueda web con OpenAI.

Dominios permitidos actualmente:

- Diario Oficial;
- MINVU / IDE MINVU;
- gob.cl;
- MMA / EAE;
- SEA;
- BCN.

## 2.3 Falla de cobertura: municipalidades y boletines locales

No existe un inventario/collector determinístico de:

- sitios municipales;
- DOM;
- transparencia municipal;
- boletines/decretos alcaldicios;
- concejos municipales;
- portales de PRC por comuna;
- SEREMI regionales con URLs específicas;
- GORE/CORE;
- repositorios regionales que no estén bien indexados en buscadores.

Además, los dominios municipales no forman parte del conjunto permitido del proceso mensual actual.

Consecuencia: un PRC, enmienda, seccional, postergación o acto local puede existir oficialmente y no ser descubierto.

## 2.4 Modelo objetivo recomendado

Crear un **Registro de Fuentes Normativas Oficiales** versionado, separado del registro de noticias, con campos mínimos:

- organismo;
- nivel: nacional / regional / municipal;
- región;
- comuna;
- tipo de fuente;
- URL base;
- URL de boletín/listado;
- modo de acceso: RSS / HTML / API / PDF index / manual;
- frecuencia esperada;
- activo sí/no;
- última verificación;
- estado del collector;
- observaciones/limitaciones.

Y recolectores por familia:

```text
Diario Oficial
MINVU / DDU / SEREMI
MMA / EAE
SEA
GORE / CORE
Municipalidades / DOM
BCN u otras fuentes de respaldo
```

La búsqueda LLM puede complementar el descubrimiento, pero no debe ser el único mecanismo de cobertura.

---

# 3. Noticias y Mercado

## 3.1 Estado real

La documentación de Sprint 5 declara expresamente que todavía estaban fuera de alcance:

- análisis con Ollama;
- extracción del artículo completo;
- publicación en portal;
- boletín Word;
- escritura a SQLite;
- integración a la tarea de las 08:30.

Por lo tanto, **Noticias y Mercado no debe presentarse como módulo productivo** todavía.

## 3.2 Cobertura de fuentes

El registro contiene varias fuentes, pero muchas de las más relevantes siguen `enabled=false` o `pending_*`, incluyendo fuentes oficiales y sectoriales.

Entre ellas: MINVU, SEA, CChC, Diario Financiero, Pulso, consultoras y otros medios.

La base RSS está preparada, pero la cobertura real es todavía limitada.

---

# 4. Histórico anual

`data/historicos.js` está actualmente vacío.

Aunque existe workflow/código histórico, el portal no dispone hoy de una base anual cargada en el archivo principal.

Debe decidirse si:

1. se reconstruye el histórico oficial desde fuentes verificables; o
2. el módulo queda temporalmente oculto hasta tener datos.

No conviene mantener un módulo anunciado como operativo si su base está vacía.

---

# 5. Vigencia cartográfica / seguimiento IPT

La base de vigencia está fragmentada en múltiples archivos cargados dinámicamente (`ipt_vigentes_01...`, overrides, comparaciones, actos, finalización).

Esto funciona como mecanismo de compatibilidad, pero dificulta entender qué archivo es fuente, complemento, parche o salida final.

Debe converger a:

```text
fuente base versionada
+ overrides explícitos y justificados
→ salida web generada
```

No mantener numerosos archivos `*_01`, `*_02`, `*_gz_*`, `*_nacional_*` como fuentes manuales competidoras indefinidamente.

---

# 6. Organización del repositorio

## Correcciones aplicadas en `chore/tui-depuracion-2026-08-28`

- README reconstruido con arquitectura real.
- enlaces rotos a docs 01–04 eliminados.
- workflow de CI renombrado de `actualizar-diario.yml` a `validar-tui.yml`.
- guía vigente del Diario Oficial movida a `docs/operacion/DIARIO_OFICIAL_LOCAL.md`.
- guías raíz obsoletas retiradas y registradas en `docs/legacy/README.md`.
- `.gitignore` depurado.
- publicación local directa a `main` eliminada.

## Deuda todavía pendiente antes de fusionar

### `data/`
Revisar y consolidar archivos generacionales como:

- `actos_ipt_base_*`;
- `actos_ipt_gz_*`;
- `actos_ipt_nacional_*`;
- archivos de finalización/overrides que puedan convertirse en una salida generada.

No eliminarlos hasta verificar dependencias del portal.

### `scripts/`
Existen múltiples versiones de algunos scripts, por ejemplo `consolidar_sig_comunal.py`, `_v2`, `_v3`.

Debe declararse una versión vigente y mover versiones anteriores a `scripts/legacy/` o retirarlas del árbol actual después de comprobar que ningún BAT/workflow las usa.

### raíz
Los BAT/PS1 operativos permanecen en raíz por ahora porque varios dependen de rutas relativas y/o son puntos de entrada para usuarios Windows. Deben reorganizarse solo junto con la actualización de todos sus llamadores.

---

# 7. Prioridad de corrección recomendada

## P0 · antes de confiar en la plataforma

1. Corregir análisis erróneos del Diario Oficial y agregar pruebas de regresión con actos MINVU/CMN/SEA reales.
2. Ejecutar/reparar continuidad diaria y registrar `última ejecución / éxito / error` visible.
3. Poner en operación la actualización IPT o dejar el módulo marcado explícitamente como no operativo.
4. Construir registro nacional de fuentes normativas municipales/regionales y collectors trazables.

## P1 · siguiente sprint

5. Cola de PDFs sin texto extraíble y fallback controlado.
6. Completar fuentes Noticias/Mercado y conectar eventos/portal solo después de QA.
7. Reconstruir histórico anual o retirar temporalmente el módulo vacío.
8. Añadir health/status de cada pipeline al portal o a Notion.

## P2 · mantenimiento

9. Consolidar archivos generacionales de `data/`.
10. Depurar versiones antiguas en `scripts/`.
11. Reducir documentación de sprint histórica visible y mantener un manual operativo + changelog + arquitectura vigente.

---

# 8. Criterio de “operativo” propuesto

Un módulo TUI se considera **Operativo** solo si cumple simultáneamente:

- fuente definida;
- collector/ingesta ejecutable;
- última ejecución conocida;
- datos no vacíos cuando se esperan resultados;
- QA automático básico;
- revisión humana donde corresponda;
- estado de error visible;
- salida reproducible;
- documentación vigente;
- sin publicación automática destructiva/no revisada.

Si no cumple, usar `En desarrollo`, `Cobertura parcial`, `Bloqueado` o `Requiere QA`, según corresponda.
