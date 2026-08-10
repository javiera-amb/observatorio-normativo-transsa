# Auditoría UX y simplificación del portal

## Objetivo

La interfaz debe priorizar la respuesta a una pregunta principal: **qué cambió en la normativa territorial, qué instrumento afecta y si ese cambio está incorporado en la cartografía disponible**.

Noticias, mercado, proyectos e infraestructura deben aportar contexto, sin desplazar el seguimiento de IPT y vigencia cartográfica.

## Hallazgos de la versión actual

### 1. Navegación duplicada

La barra superior presenta cinco módulos y la portada repite los mismos cinco accesos mediante botones. Esto aumenta la carga visual sin agregar una acción nueva.

**Decisión:** conservar la navegación principal y reemplazar los botones repetidos de la portada por dos acciones útiles:

- `Explorar cambios normativos`;
- `Buscar comuna o IPT`.

### 2. Secciones con funciones superpuestas

`Actualizaciones IPT`, `Histórico anual` y `Vigencia cartográfica` repiten buscadores, filtros, métricas y listados relacionados con los mismos instrumentos.

**Decisión:** organizar la experiencia alrededor de un módulo consolidado `IPT y vigencia`, con vistas internas:

- Estado nacional;
- Instrumentos por comuna;
- Línea de tiempo;
- Cambios y actos;
- Comparación cartográfica;
- Documentos e histórico.

El histórico debe funcionar principalmente como filtro temporal, no como módulo aislado.

### 3. Mapa desconectado del flujo de consulta

El mapa territorial funciona como módulo separado, aunque su mayor utilidad aparece al revisar una comuna, alerta, noticia o IPT específico.

**Decisión:** mantener una vista nacional, pero integrar mapas contextuales en:

- ficha comunal;
- detalle del instrumento;
- comparación de shape y modificación;
- resultados filtrados.

La selección de mapa y lista debe mantenerse sincronizada.

### 4. Botones de baja utilidad

Hay botones que solo repiten navegación o muestran instrucciones técnicas internas, por ejemplo referencias a ejecutar acciones de GitHub.

**Decisión:** un botón visible debe ejecutar una acción comprensible para el usuario final. Acciones prioritarias:

- Ver línea de tiempo;
- Comparar cartografía;
- Revisar acto pendiente;
- Abrir fuente oficial;
- Descargar documento;
- Ver territorio en mapa;
- Filtrar resultados relacionados;
- Limpiar filtros cuando existan filtros activos.

Las instrucciones técnicas y plantillas de administración se moverán a una sección secundaria de mantenimiento.

### 5. Buscadores fragmentados

Cada módulo tiene su propio buscador y filtros, lo que obliga a repetir consultas.

**Decisión:** incorporar un buscador consolidado que consulte:

- comuna y región;
- tipo y nombre de IPT;
- modificación, enmienda, rectificación o seccional;
- organismo y acto oficial;
- estado de vigencia;
- estado de actualización cartográfica;
- noticias, proyectos e infraestructura vinculados.

Los módulos conservarán filtros específicos solo cuando aporten precisión adicional.

## Arquitectura propuesta

### Inicio

- Resumen nacional de estado normativo.
- Alertas prioritarias.
- Cambios recientes.
- IPT con posibles omisiones cartográficas.
- Buscador principal.

### IPT y vigencia

- Ficha por comuna e instrumento.
- Línea de tiempo completa.
- Estado: actualizado, parcialmente actualizado, desactualizado, sin cartografía, pendiente de revisión o sin antecedentes.
- Comparación entre actos oficiales y cartografía.

### Diario Oficial y cambios recientes

- Publicaciones oficiales relevantes.
- Relación con IPT, territorio y línea de tiempo.
- Separación entre acto oficial, noticia de contexto y análisis preliminar.

### Noticias e inteligencia territorial

Una sección consolidada con pestañas:

- Chile;
- Normativa;
- Mercado y proyectos;
- Infraestructura;
- Internacional.

La pestaña internacional no altera estados normativos chilenos.

### Mapa

- Vista nacional opcional.
- Mapas contextuales dentro de fichas y resultados.
- Interacción bidireccional entre mapa, filtros y listado.

## Reglas de interacción

1. Las métricas deben ser clicables y aplicar filtros.
2. Los estados y alertas deben explicar su criterio al pasar el cursor o abrir detalle.
3. Las tarjetas deben mostrar una acción principal y, como máximo, una secundaria.
4. No se mostrarán botones deshabilitados sin explicación.
5. Los estados vacíos deben orientar al usuario, no entregar instrucciones técnicas de GitHub.
6. La búsqueda y los filtros deben reflejarse en la URL para compartir consultas.
7. En móvil, la navegación se reducirá a menú y el detalle se abrirá debajo del listado.

## Orden de implementación

1. Eliminar navegación y botones repetidos.
2. Crear buscador consolidado.
3. Unificar IPT, histórico y vigencia en una experiencia coherente.
4. Convertir métricas en filtros interactivos.
5. Integrar Noticias e Internacional.
6. Mejorar mapas contextuales y sincronización.
7. Ajustar jerarquía visual, responsive y accesibilidad.

## Criterio de aceptación

Una persona debe poder, en menos de tres pasos:

1. buscar una comuna o IPT;
2. ver su línea de tiempo normativa;
3. identificar si existen actos posteriores no incorporados en la cartografía disponible;
4. abrir la fuente oficial y los antecedentes relacionados.
