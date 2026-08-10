# Prioridad normativa y arquitectura del portal

## Objetivo principal

Transsa Urban Intelligence debe ayudar a comprender el estado normativo territorial de Chile y responder, para cada instrumento de planificación territorial (IPT):

- cuál es el instrumento base vigente;
- qué modificaciones, enmiendas, rectificaciones, seccionales u otros actos posteriores existen;
- si esos actos están vigentes, en trámite, en consulta o pendientes de verificación;
- si la cartografía, planos, shapes o geopackages disponibles incorporan dichos cambios;
- qué diferencias o alertas deben revisarse manualmente;
- cuál es la fuente oficial de cada antecedente.

## Jerarquía funcional

### 1. Inteligencia normativa IPT

Es el núcleo de la plataforma. Debe incluir:

- ficha por comuna y territorio;
- línea de tiempo normativa;
- instrumento base y actos posteriores;
- estado de vigencia;
- fuente oficial y enlace;
- fecha de publicación o promulgación;
- comparación con cartografía disponible;
- estado de actualización: actualizado, parcialmente actualizado, desactualizado, sin cartografía o pendiente de revisión;
- alertas por cambios no incorporados;
- trazabilidad de la validación humana.

### 2. Diario Oficial y fuentes oficiales

Las publicaciones oficiales alimentan las líneas de tiempo y las alertas. Una publicación relevante no debe quedar aislada como noticia: debe vincularse al IPT, territorio o materia correspondiente cuando exista evidencia suficiente.

### 3. Noticias consolidadas Chile

Las noticias se presentan en una sola sección consolidada y sirven como contexto para normativa, mercado, proyectos, infraestructura y desarrollo urbano. Deben mostrar:

- fuente y nivel de confianza;
- territorio;
- categoría;
- fecha;
- relación con un IPT, proyecto o cambio normativo cuando corresponda;
- estado de revisión;
- enlace a la fuente original.

Las noticias no reemplazan la fuente normativa oficial.

### 4. Sección Internacional

Las noticias internacionales se conservan en una sección separada. Su finalidad es identificar tendencias, casos comparables, innovación urbana, inversión e infraestructura internacional. No deben mezclarse con alertas normativas chilenas ni interpretarse como cambios aplicables en Chile.

### 5. Buscador consolidado

El buscador debe permitir consultar por:

- región;
- comuna;
- tipo de IPT;
- acto normativo;
- fecha;
- estado de vigencia;
- estado de actualización cartográfica;
- categoría de noticia;
- proyecto o infraestructura;
- fuente.

## Estados mínimos de actualización IPT

- `actualizado`: la cartografía o ficha vigente incorpora todos los actos identificados y validados;
- `parcialmente_actualizado`: incorpora una parte de los cambios posteriores;
- `desactualizado`: existen actos vigentes posteriores no incorporados;
- `sin_cartografia`: existe normativa, pero no hay cartografía disponible para comparar;
- `pendiente_revision`: existen antecedentes, pero falta validación suficiente;
- `sin_antecedentes`: no se han identificado antecedentes suficientes para determinar el estado.

## Regla de trazabilidad

Toda conclusión sobre vigencia o actualización debe indicar:

- fuente primaria;
- fecha de consulta;
- documento o acto relacionado;
- territorio;
- método de comparación;
- responsable o estado de revisión.

## Criterio de diseño

El front debe priorizar primero el estado normativo y las alertas. Las noticias, proyectos e indicadores complementan la interpretación, pero no deben ocultar el núcleo IPT.
