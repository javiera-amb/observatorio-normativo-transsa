# Seguimiento Propiteq e inventario de capas territoriales

## Vista consolidada para Propiteq

La vista de Propiteq debe responder una pregunta simple por comuna: **¿qué información puede consumir hoy y con qué advertencias?**

No debe obligar a abrir las fichas técnicas. La tabla nacional muestra:

- región y comuna;
- IPT vigente identificado y fecha;
- estado de la fuente normativa/SIG;
- estado de auditoría;
- disponibilidad para Propiteq;
- cantidad de actos o controles pendientes;
- última revisión;
- enlace a la ficha solamente cuando exista una auditoría detallada.

### Estados de consumo

| Estado | Significado |
|---|---|
| Disponible | Existe una capa recomendada para consumo. Puede mantener controles preliminares pendientes |
| Usar con revisión | La capa existe, pero hay actos, diferencias o controles que Propiteq debe conocer |
| No disponible | No hay capa vinculada o la comuna todavía no está consolidada |

Estos estados no reemplazan el estado jurídico ni el estado interno de auditoría.

## Separación de vistas

Todas las vistas pertenecen al mismo sitio de Transsa Urban Intelligence. Se separan como secciones funcionales en la navegación, no como sitios o aplicaciones independientes.

1. **Seguimiento PRC:** una fila por comuna, solo lectura y descarga consolidada del estado del PRC para Propiteq.
2. **Cobertura comunal:** inventario conjunto de IPT aplicables y capas territoriales disponibles para la comuna, con fechas y evidencia de origen. No muestra ni modifica la auditoría PRC.
3. **Gestión interna:** asignaciones, responsables, comentarios, evidencia y bitácora.
4. **Ficha comunal:** explicación técnica y normativa completa.

Propiteq no debe ver comentarios internos, nombres de responsables, archivos de trabajo ni credenciales.

## Inventario de capas territoriales conectado a Notion

El primer snapshot se obtuvo el 11 de agosto de 2026 desde **Diccionario de Datos → T. Espaciales**. Contiene 35 registros territoriales: 34 con nombre y uno sin título.

La plataforma muestra los 34 registros identificables y enlaza cada ficha original de Notion. La conexión confirma metadatos de catálogo —nombre, categoría, Data Owner y última edición—, pero no demuestra por sí sola cobertura comunal, vigencia de la fuente ni calidad geométrica.

### Hallazgos inmediatos

1. **Planes Reguladores Comunales** tiene su verificación de Notion expirada.
2. La ficha declara una **versión 2.1 con fecha 2027-07-02**, aunque fue editada el 2026-07-02. Debe tratarse como fecha inconsistente hasta confirmar el archivo.
3. La versión 2.0 declara incluir Coquimbo, pero esto no acredita que la geometría corresponda al PRC 2026 ni que incorpore todas sus enmiendas.
4. Existe un registro normativo sin nombre.
5. División Político Comunal, EOD y Metro de Santiago fueron comprobadas como verificadas en Notion. Esto sigue siendo una verificación documental, no un QA espacial completo.

### Regla de publicación

Una capa territorial pasa de “existe en el catálogo” a “disponible para Propiteq” solo cuando tiene:

- cobertura por comuna documentada;
- versión y fecha de fuente confirmadas;
- archivo o servicio recuperable;
- formato y CRS registrados;
- QA geométrica y de atributos;
- responsable y fecha de última revisión;
- evidencia enlazada.

## Evolución del inventario territorial

El inventario territorial utilizará la misma unidad de seguimiento: una comuna y una familia de datos. No se mezclará su validación con la vigencia de los IPT.

### Familias iniciales

- estaciones y líneas de Metro;
- paraderos y recorridos de transporte público;
- líneas férreas y estaciones ferroviarias;
- fajas ferroviarias y otras franjas de afectación;
- puntos de interés;
- red vial y vialidad estructurante;
- límites administrativos y urbanos;
- manzanas, predios y roles;
- equipamientos y servicios;
- áreas de riesgo y restricciones territoriales;
- infraestructura sanitaria, energética y logística;
- imágenes, coberturas y cartografías base.

### Registro mínimo por capa

`id`, `familia`, `nombre`, `region`, `comuna`, `fuente`, `url`, `formato`, `crs`, `fecha_fuente`, `fecha_descarga`, `cobertura`, `licencia`, `estado_calidad`, `estado_actualizacion`, `responsable`, `archivo`, `hash`, `observaciones`.

### Estados de calidad

| Estado | Significado |
|---|---|
| Disponible y validada | Cobertura, geometría, atributos y fecha controlados |
| Disponible con observaciones | Puede utilizarse con advertencias documentadas |
| Desactualizada | Existe una versión más reciente o perdió vigencia operacional |
| En preparación | Fuente encontrada y proceso de homologación activo |
| No encontrada | No se identificó una fuente utilizable |
| No aplica | La capa no existe o no corresponde a la comuna |

## Relación con los scripts QGIS/Python

Cada script deberá reportar por capa:

- conteo de entidades;
- extensión territorial y comunas cubiertas;
- CRS original y de salida;
- fecha y URL de la fuente;
- geometrías vacías, inválidas o duplicadas;
- campos obligatorios ausentes;
- cobertura incompleta;
- versión del script y tiempo de ejecución;
- ruta del GeoPackage final y hash.

El resultado se importará a la plataforma mediante el mismo contrato JSON de auditoría. Propiteq verá el estado consolidado; el equipo interno verá los errores y las tareas necesarias para corregirlos.

## Orden de implementación

1. Consolidar normativa para las 346 comunas.
2. Activar usuarios, permisos y bitácora.
3. Conectar los scripts de auditoría IPT.
4. Crear el catálogo de familias territoriales.
5. Incorporar capas de mayor prioridad para Propiteq.
6. Automatizar detección de nuevas versiones y pérdida de vigencia.
