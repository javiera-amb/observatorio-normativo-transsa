# Regla nacional para reemplazos integrales y fuentes multifuente

## Objetivo

Evitar que un PRC refundido, una actualización completa o una modificación
integral se presente como una modificación simple. La ficha debe mostrar qué
instrumento queda vigente, qué normas anteriores se incorporan, qué cambia,
qué se reemplaza, qué permanece sin cambio y qué continúa pendiente.

La regla se aplica a todas las fichas comunales. La clasificación automática
no reemplaza la validación jurídica ni espacial.

## Clasificación de transiciones

Cada par de versiones PRC se clasifica en uno de estos estados:

1. `reemplazo_integral_confirmado`: existe evidencia específica de reemplazo.
2. `candidato_reemplazo_integral`: el nombre señala una modificación integral,
   pero falta confirmar su efecto jurídico.
3. `nueva_version_por_clasificar`: se detecta una actualización y falta definir
   si reemplaza, refunde o modifica parcialmente el instrumento anterior.
4. `transicion_entre_versiones`: las versiones pertenecen a la misma línea,
   pero no existe evidencia suficiente para una clasificación más precisa.

La interfaz nunca convierte automáticamente una actualización en refundido
confirmado.

## Paquete de cambio

La ficha separa seis preguntas:

- Qué consolida.
- Qué incorpora de actos anteriores.
- Qué cambia.
- Qué reemplaza o recodifica.
- Qué permanece sin cambio.
- Qué falta validar.

Cuando no existe evidencia, el campo se muestra como pendiente. La ausencia de
información no se interpreta como ausencia de cambios.

## Fuentes normativas y cartográficas

La procedencia se divide en dos grupos:

- Fuente normativa: acto, ordenanza, memoria, planos firmados y expediente.
- Fuente cartográfica: shape, GeoPackage, PDF/JPG, ArcGIS Online/REST u otro
  servicio utilizado para representar espacialmente la norma.

La prioridad de búsqueda es:

1. Municipalidad o institución competente: acto y planos oficiales.
2. Archivo o servicio SIG municipal vinculado a la versión vigente.
3. MINVU, GeoIDE, SEREMI o Gobierno Regional.
4. Otras fuentes oficiales, solo como antecedente sujeto a validación.

La fecha de actualización de un mapa web no acredita su vigencia. Deben
coincidir el acto, la versión, el ámbito, los códigos y la geometría.

## Piloto Coquimbo

Coquimbo se clasifica como reemplazo integral confirmado entre el PRC 2019 y
el PRC 2026. La ficha conserva once diferencias documentadas y ocho acciones
SIG. Además registra:

- expediente, ordenanza y planos firmados de la Municipalidad;
- trece láminas de zonificación y planos de riesgo;
- FeatureServer GeoIDE como geometría candidata pendiente de validación;
- servicio ArcGIS 2016 como fuente descartada por desactualización;
- límite urbano como elemento sin cambio, respaldado por pronunciamiento
  municipal.

## Archivos

- `data/fuentes_multifuente_ipt.js`: fuentes verificadas por comuna.
- `vigencia-refundidos-fuentes.js`: clasificación, enriquecimiento y vista.
- `vigencia-pilotos.js`: detección de versiones pertenecientes a una misma
  línea normativa.
- `data/comparacion_coquimbo_detallada.js`: paquete confirmado de Coquimbo.
