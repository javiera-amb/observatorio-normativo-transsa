# Inspector SIG IPT

## Rol de esta herramienta

El Inspector SIG IPT es una **herramienta local opcional de diagnóstico**. Puede recorrer una copia sincronizada de `00_IPT_Nacional` sin modificar los archivos originales y generar inventarios técnicos de capas, CRS, geometría, campos y posibles zonas.

**No forma parte de la operación productiva de TUI.**

La operación productiva debe funcionar íntegramente en la nube:

```text
SharePoint
  ↓
Power Automate
  ↓
GitHub Actions
  ↓
TUI
```

Por lo tanto, TUI no depende de que un computador esté encendido, de GitHub Desktop, de una ruta `C:\\`, de una carpeta sincronizada con OneDrive ni de ejecutar un BAT.

## Fuente oficial

La raíz cloud oficial de IPT es:

```text
Sistema Operativo DEI/02_PRODUCCION_DEI/01_CARTOGRAFIA/00_IPT_Nacional
```

La configuración cloud general está documentada en:

`config/sharepoint_tui.json`

## Uso manual opcional del inspector

Solo cuando se necesite un barrido técnico local:

1. Disponer localmente de una carpeta `00_IPT_Nacional`.
2. Arrastrar esa carpeta sobre `REVISAR_CARTOGRAFIA_IPT.bat`, o ejecutar:

```text
REVISAR_CARTOGRAFIA_IPT.bat "RUTA_A_00_IPT_Nacional"
```

El BAT no contiene una ruta personal predeterminada.

## Resultados locales

Los resultados de esta utilidad se generan en `_local/sig_ipt/`, carpeta excluida de GitHub.

- `inventario_sig_ipt.csv`
- `capas_sig_ipt.json`
- `vinculacion_sig_ipt.csv`
- `vinculacion_sig_ipt.json`
- `alertas_sig_ipt.csv`
- `resumen_sig_ipt.json`

Estos resultados son diagnósticos y no constituyen por sí mismos el estado productivo de TUI.

## Reglas de interpretación

### Planes seccionales

Los planes seccionales con nombres distintos se tratan como instrumentos diferentes. El inspector no asume que un seccional posterior reemplaza a otro por el solo hecho de compartir el tipo `PS`.

Para vincular un seccional se exige coincidencia de comuna, región y una coincidencia razonable de nombre. Los casos dudosos quedan como `vinculo_ambiguo`.

### PRC consolidado y modelo de entrega

El inventario mantiene cada plan seccional como instrumento trazable. La consolidación espacial se realiza después del inventario: dentro del ámbito de un seccional se aplica su normativa y fuera de él continúa la normativa del PRC.

TUI no intersecta uso de suelo, edificación y riesgos para fabricar una sola geometría. Esas materias se conservan como coberturas superpuestas.

### Estado SIG

Un barrido local no declara automáticamente que una modificación esté incorporada en SIG. El estado productivo se controla por los flujos cloud y sus reglas de publicación/QA.

## Formatos del inspector local

La lectura profunda funciona principalmente para:

- GeoPackage (`.gpkg`)
- Shapefile (`.shp` + `.dbf` + `.prj` cuando existen)
- GeoJSON (`.geojson` / `.json` de tamaño moderado)

KML, GML y SQLite pueden quedar marcados como lectura parcial según el proceso.
