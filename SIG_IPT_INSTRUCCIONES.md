# Inspector SIG IPT

## Objetivo

El Inspector SIG IPT recorre la carpeta nacional de cartografía sin modificar los archivos originales. Genera un inventario por región, comuna, archivo y capa; detecta el tipo de IPT y el rol de la capa; identifica CRS, geometría, campos y un posible campo de zona; y propone una vinculación preliminar con los instrumentos vigentes del Portal IPT ya cargados en el repositorio.

## Ejecución

1. Actualizar la rama `feature/noticias-v0.6` en GitHub Desktop.
2. Cerrar QGIS si hay muchos GeoPackage abiertos. No es obligatorio, pero evita bloqueos de lectura.
3. Hacer doble clic en `REVISAR_CARTOGRAFIA_IPT.bat`.
4. Esperar a que la ventana indique `LISTO`.
5. La carpeta de resultados se abrirá automáticamente.

La ruta configurada por defecto es:

`C:\Users\Javiera Morales\OneDrive - Transsa\DEI - Cartografía Transsa_GENERAL\PRC_Actualización Transsa_2026_S2`

También se puede arrastrar otra carpeta sobre `REVISAR_CARTOGRAFIA_IPT.bat`.

## Resultados

Los archivos se generan en `_local/sig_ipt/`. Esa carpeta está excluida de GitHub para evitar subir rutas locales y cartografía de trabajo.

- `inventario_sig_ipt.csv`: una fila por capa SIG detectada.
- `capas_sig_ipt.json`: inventario completo, campos y muestras de zonas.
- `vinculacion_sig_ipt.csv`: vínculo preliminar SIG ↔ Portal IPT.
- `vinculacion_sig_ipt.json`: versión completa de las vinculaciones y candidatos.
- `alertas_sig_ipt.csv`: problemas que requieren revisión.
- `resumen_sig_ipt.json`: conteos generales del barrido.

## Reglas de interpretación

### Planes seccionales

Los planes seccionales con nombres distintos se tratan como instrumentos diferentes. El inspector no asume que un seccional posterior reemplaza a otro por el solo hecho de compartir el tipo `PS`.

Para vincular un seccional se exige coincidencia de comuna, región y una coincidencia razonable de nombre. Los casos dudosos quedan como `vinculo_ambiguo`.

### PRC consolidado

El inventario mantiene cada plan seccional como instrumento trazable. La consolidación espacial se realizará después del inventario: dentro del ámbito de un seccional se aplicará su normativa y fuera de él continuará la normativa del PRC.

### Estado SIG

Este primer barrido **no declara** que una modificación esté incorporada en SIG. Primero identifica qué archivo y capa parecen corresponder al instrumento. Luego se compararán geometrías, zonas y parámetros entre versiones para asignar estados como:

- Incorporado en SIG
- Parcialmente incorporado
- No incorporado
- Cartografía no localizada
- Pendiente de vinculación

## Formatos

La lectura profunda inicial funciona para:

- GeoPackage (`.gpkg`)
- Shapefile (`.shp` + `.dbf` + `.prj` cuando existen)
- GeoJSON (`.geojson` / `.json` de tamaño moderado)

KML, GML y SQLite se inventarían en esta primera versión, pero pueden quedar marcados como lectura parcial.
