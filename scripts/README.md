# Scripts del núcleo TUI

## Ejecutar todo el Sprint 1

Desde la raíz del repositorio:

```bash
python scripts/run_sprint1.py
```

## Scripts individuales

- `init_database.py`: crea el esquema SQLite.
- `migrate_legacy_reports.py`: transforma `data/reportes.js` en eventos canónicos.
- `export_legacy_reports.py`: regenera la salida compatible para el portal.
- `validate_sprint1.py`: verifica cantidad, JSON y equivalencia exacta.

Los scripts son idempotentes: pueden ejecutarse nuevamente sin duplicar eventos.

## Cruce territorial para las 346 comunas

`cruzar_capas_por_comuna.py` construye la matriz real capa × comuna. No usa el alcance declarado en Notion como sustituto de una intersección espacial.

```bash
pip install -r scripts/requirements_geoespacial.txt
python scripts/cruzar_capas_por_comuna.py \
  --comunas /ruta/Comunas_SII-Transsa.gpkg \
  --fuentes-dir /ruta/capas_vigentes
```

El proceso:

- exige una matriz objetivo de 346 comunas y campos de código, comuna y región;
- disuelve Santiago, Santiago Sur y Santiago Oeste en una sola comuna de Santiago;
- normaliza Paiguano/Paihuano, Tiltil/Til Til, Alto Biobío/Alto Bio Bio, Cholchol/Chol Chol y Coihaique/Coyhaique;
- conserva Antártica como bloqueo explícito cuando el límite base no contiene su geometría;
- busca los archivos definidos en `config/capas_territoriales_fuentes.json`;
- valida que cada archivo tenga CRS y geometrías consumibles;
- elimina falsos positivos causados solo por contacto de borde;
- guarda presencia, cantidad de elementos, métricas de intersección y SHA-256;
- escribe `data/cobertura_capas_resultados.js`, que consume la vista “Cobertura comunal”.

Una capa sin archivo queda `bloqueada`; una capa procesada puede quedar `con_cobertura` o `sin_elementos` para cada comuna. Cero elementos es un resultado, no un pendiente.

## Sincronización local con OneDrive

GitHub Pages no puede leer una ruta `C:\\` del equipo. La sincronización se
ejecuta localmente y publica en Git únicamente rutas relativas, inventarios,
huellas y resultados de QA; los GeoPackage permanecen en OneDrive.

1. Copiar `config/rutas_tui.example.json` a `_local/rutas_tui.json`.
2. Instalar `pip install -r scripts/requirements_sincronizacion.txt`.
3. Ejecutar `python scripts/sincronizar_tui_local.py`.

El proceso crea la estructura por categoría en `FUENTES_TUI`, indexa los PRC
con nombres como `IPT_00_PRC_NombreComuna_TUI_V2_Actualizado.gpkg`, busca su
tabla compañera `IPT_00_PRC_NombreComuna_TUI_V2_Normativa.csv` y ejecuta el
cruce capa × comuna cuando el límite comunal está disponible. El sufijo del
archivo se usa como señal inicial; el estado operativo compartido sigue
versionado por la plataforma.

## Estándar PRC TUI V2

Los 45 PRC enviados en la carga inicial se conservan como antecedente V1, pero
no se consideran una base geométrica válida. Deben reconstruirse porque su
zonificación fue subdividida mediante intersecciones con capas de riesgo. La
TUI V2.1 entrega la geometría y la normativa en archivos separados, preparados
para las dos tablas SQL.

El nuevo estándar está documentado en `config/estandar_prc_tui_v2.json`:

- la zonificación conserva la geometría normativa base;
- inundación y otras amenazas quedan como capas independientes;
- el GeoPackage conserva geometría normativa base y `unidad_normativa_id`;
- la normativa y la homologación de usos viven en una tabla CSV, XLSX o Parquet separada;
- ambos archivos se vinculan mediante `unidad_normativa_id`;
- uso de suelo, edificación y riesgos permanecen como coberturas superpuestas, sin una intersección destructiva previa;
- `TUI_V2` forma parte del nombre del archivo;
- el control estructural no reemplaza el QA normativo de la plataforma.

La capa comunal maestra se busca exclusivamente dentro de:

```text
FUENTES_TUI\00_LIMITES Y ESCALAS\00_Comunas
```

Si hay un solo GeoPackage, se usa automáticamente sin exigir un nombre
específico. Si existen varios, `limite_comunal` en `_local/rutas_tui.json`
permite seleccionar el archivo. No se crea una carpeta alternativa.

La estructura de cada capa es:

- `00_fuente_original`: descarga sin modificaciones;
- `01_trabajo_transsa`: limpieza, scraping público corregido o enriquecimiento;
- `02_qa`: informes, conteos y evidencias;
- `03_para_cruce`: única versión consumida por el cruce nacional;
- `metadata.json`: origen, licencia, fecha, transformación Transsa y responsable.

## Importación inicial del Excel de avance

```bash
python scripts/importar_avance_bases.py /ruta/Avance_Bases_de_datos.xlsx
```

El Excel se usa solo como línea base de migración. No acredita cobertura
territorial: esa condición proviene exclusivamente de la intersección
geométrica.

## Estados marcados por el equipo

La vista interna guarda cambios en el navegador y permite descargar
`borradores_seguimiento_prc.csv`. Para incorporarlos al registro compartido:

```bash
python scripts/importar_borradores_seguimiento.py /ruta/borradores_seguimiento_prc.csv
```

El resultado queda en `data/estado_equipo_versionado.js` con historial. Después
se revisa `git diff`, se publica y todo el equipo ve el mismo estado, sin una
planilla operativa paralela.
