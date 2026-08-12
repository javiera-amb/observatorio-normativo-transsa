# Estructura de carpetas para capas territoriales

Fecha de corte: 2026-08-12.

## Qué existe hoy

- **34 registros territoriales identificables** en el catálogo, de los cuales **33** se muestran en “Cobertura comunal” porque los Planes Reguladores Comunales se controlan en el bloque normativo.
- **16 registros de fuentes externas**: 10 localizados, 3 localizados con observaciones, 2 descentralizados por comuna y 1 que requiere fuente interna.
- **0 capas cruzadas nacionalmente** en la matriz publicada. Esto no significa que no existan archivos: significa que todavía no se ha ejecutado el lote de intersección con los límites comunales.
- La base `Comunas SII-Transsa 2.gpkg` es el límite de referencia. La matriz está preparada para 346 comunas objetivo, pero el archivo tiene 345 geometrías; **Antártica queda explícitamente como “sin límite comunal”**, no como cobertura cero.

## Dónde dejar los archivos

En la carpeta de trabajo donde ya están los IPT, crear un hermano llamado `02_CAPAS_TERRITORIALES`. No se deben subir los binarios pesados al repositorio de GitHub Pages: SharePoint/OneDrive conserva los archivos y el sitio publica únicamente el catálogo, la evidencia y el resultado JSON.

```text
FUENTES_TUI/
├── 00_LIMITES_REFERENCIA/
│   ├── 00_original/
│   │   └── Comunas SII-Transsa 2.gpkg
│   ├── 01_normalizada/
│   └── 02_qa/
├── 01_IPT/
│   ├── 00_original/
│   ├── 01_vigentes/
│   ├── 02_historicos/
│   ├── 03_consolidados/
│   └── 04_qa/
├── 02_CAPAS_TERRITORIALES/
│   ├── 01_NORMATIVA_RESTRICCIONES/
│   ├── 02_MOVILIDAD_TRANSPORTE/
│   ├── 03_EQUIPAMIENTO_SERVICIOS/
│   ├── 04_INFRAESTRUCTURA/
│   ├── 05_DEMOGRAFIA_TEJIDO_URBANO/
│   ├── 06_MEDIO_AMBIENTE_RIESGOS/
│   ├── 07_PROPIEDAD_BASE_TERRITORIAL/
│   └── 08_COMPLEMENTARIAS_NO_NORMATIVAS/
└── 90_RESULTADOS/
    ├── 01_catalogo/
    ├── 02_cruces_comuna/
    └── 03_reportes_qa/
```

Cada capa tiene su propia carpeta. El script puede recibir como `--fuentes-dir` la raíz `02_CAPAS_TERRITORIALES`: cuando detecta carpetas `03_para_cruce` sólo indexa esas carpetas, nunca los originales ni los resultados. Si todavía no existe la estructura, mantiene compatibilidad con una carpeta plana:

```text
02_CAPAS_TERRITORIALES/01_NORMATIVA_RESTRICCIONES/areas_protegidas/
├── 00_fuente_original/       # descarga original, URL o respuesta del servicio
├── 01_trabajo_transsa/       # limpieza, conversión y correcciones de Transsa
├── 02_evidencia/             # ficha, resolución, captura, licencia y notas
├── 03_para_cruce/             # único archivo que entra al cruce nacional
└── 04_qa/                     # reporte geométrico y de atributos
```

La misma estructura se repite para `predios_sii`, `metro_santiago`, `red_vial`, etc. Los nombres deben ser estables, sin tildes ni espacios, por ejemplo `predios_sii`, `estaciones_metro`, `amenaza_tsunami`.

## Fuente y tratamiento son dos cosas distintas

No se debe resumir la procedencia en una sola etiqueta. La plataforma tiene que conservar:

| Campo | Ejemplo para predios |
|---|---|
| `fuente_clase` | `scraping_publico` |
| `fuente_original` | URL, visor o archivo compartido por el profesor |
| `tratamiento_transsa` | `correccion_transsa` |
| `descripcion_procedencia` | “Scraping público; corrección y homologación de Transsa” |
| `archivo_original` | `00_fuente_original/predios_ profesor_2026.zip` |
| `archivo_para_cruce` | `03_para_cruce/predios_sii_2026.gpkg` |

Las clases permitidas son:

- `oficial_directa`: descarga o servicio de un organismo público;
- `oficial_interoperable`: ArcGIS REST, WFS o API oficial;
- `scraping_publico`: extracción de un visor o sitio abierto;
- `scraping_publico_corregida_transsa`: extracción pública que Transsa corrigió, limpió u homologó;
- `dato_interno_transsa`: producto propio o base interna (por ejemplo, predios consolidado);
- `normativa_municipal`: plano, ordenanza o archivo entregado por una municipalidad;
- `fuente_abierta_complementaria`: OSM, Overture u otra fuente abierta no normativa;
- `referencia_documental`: PDF, JPG o ficha que sirve como evidencia, pero no como capa consumible.

La fuente original nunca se reemplaza por el archivo corregido: ambos se conservan y se calcula SHA-256 para cada versión.

## Manifest mínimo por capa

En `90_RESULTADOS/01_catalogo/catalogo_capas.csv` debe existir una fila por capa con estas columnas:

```text
id_capa,nombre,familia,subfamilia,geometria,fuente_clase,fuente_original,url_fuente,
archivo_original,archivo_para_cruce,fecha_fuente,fecha_descarga,version,crs_original,
crs_salida,licencia,hash_original,hash_para_cruce,estado_fuente,estado_cruce,
comunas_con_elementos,elementos_total,qa_geometria,qa_atributos,responsable,
ultima_revision,observaciones
```

Estados de cruce:

- `pendiente`: el archivo está materializado, pero el lote aún no se ejecuta;
- `confirmada`: intersección ejecutada y hay elementos en la comuna;
- `sin_elementos`: intersección ejecutada y el resultado fue cero;
- `bloqueada`: falta fuente válida, CRS, geometría o archivo completo;
- `error`: el proceso falló y se conserva el motivo;
- `no_aplica`: el ámbito territorial de la fuente no incluye la comuna.

“Fuente localizada”, “cobertura nacional declarada” o “archivo encontrado” nunca equivalen a `confirmada`.

## Ejecución del cruce

Con las capas convertidas y copiadas a sus carpetas `03_para_cruce`, el lote nacional se ejecuta así:

```bash
python scripts/cruzar_capas_por_comuna.py \
  --comunas "FUENTES_TUI/00_LIMITES_REFERENCIA/01_normalizada/comunas_sii_transsa.gpkg" \
  --fuentes-dir "FUENTES_TUI/02_CAPAS_TERRITORIALES" \
  --manifest config/capas_territoriales_fuentes.json \
  --salida data/cobertura_capas_resultados.js
```

El proceso valida CRS y geometrías, convierte a un CRS métrico, cruza cada archivo con las 346 comunas objetivo, cuenta elementos por comuna y guarda archivo, tamaño, subcapas y SHA-256. Los PDF/JPG quedan como evidencia documental y no entran al cruce.

## Prioridad de carga

1. Límite comunal Transsa y capas normativas/afectaciones.
2. Metro, paraderos, recorridos, red vial y líneas férreas.
3. Predios, manzanas y áreas pobladas.
4. Equipamientos: educación, salud, seguridad, bomberos y deporte.
5. Riesgos, áreas protegidas, humedales, campamentos y patrimonio.
6. POI y fuentes abiertas complementarias.

La página puede mostrar una capa en el catálogo desde el primer día, pero sólo la marcará como cobertura comunal cuando exista el resultado del cruce y su evidencia.
