# Automatización de tablas normativas IPT en SharePoint

## Objetivo

Procesar automáticamente las tablas cargadas o modificadas en SharePoint sin que el usuario tenga que subirlas manualmente a TUI.

## Carpetas

Sitio: `https://transsa.sharepoint.com/sites/DEI`

Biblioteca: `Documentos`

- Entrada inmutable: `General/Cartografía Transsa_GENERAL/00_IPT_Nacional/02_Tablas_normativas/01_TABLAS_CANONICAS`
- Salida normalizada: `General/Cartografía Transsa_GENERAL/00_IPT_Nacional/02_Tablas_normativas/02_TABLAS_NORMALIZADAS`
- QA y trazabilidad: `General/Cartografía Transsa_GENERAL/00_IPT_Nacional/02_Tablas_normativas/03_QA_TRAZABILIDAD`

Nunca se sobrescribe un archivo de `01_TABLAS_CANONICAS`.

## Flujo recomendado

1. SharePoint recibe o modifica un archivo en `01_TABLAS_CANONICAS`.
2. Power Automate usa el trigger `When a file is created or modified (properties only)` sobre la biblioteca, filtrando la carpeta de entrada.
3. El flujo entrega al motor el `drive_id`, `item_id`, nombre y versión/ETag del archivo.
4. El motor descarga el archivo mediante Microsoft Graph, ejecuta auditoría y normalización determinística y consulta el catálogo de reglas normativas fuente-específicas.
5. El motor genera:
   - `PRC_<COMUNA>_NORMALIZADO.xlsx`
   - `QA_PRC_<COMUNA>.xlsx`
   - `STATUS_PRC_<COMUNA>.json`
6. El motor sube los resultados a `02_TABLAS_NORMALIZADAS` y `03_QA_TRAZABILIDAD`.
7. La TUI consume los estados/resultados y muestra `CORREGIDA`, `REQUIERE_REVISION`, `CONFLICTO NORMATIVO`, etc.

## Regla de seguridad

Los triggers sólo observan `01_TABLAS_CANONICAS`. Las carpetas de salida no disparan el flujo, evitando procesamiento recursivo.

## Autocorrección

Se puede autocorregir:
- normalización de formato de alta confianza;
- reglas normativas exactas con respaldo de fuente y confianza ALTA;
- tipos numéricos y NULL literales cuando la transformación no cambia el significado normativo.

No se autocorrige sin fuente:
- `CODIGO_PRC` descriptivo;
- cambios de `ZONA`;
- OCR como `P.2` → `0,2`;
- conflictos entre instrumentos;
- valores de confianza media/baja.

## Regla fuente-específica

Cada corrección normativa se registra en `config/tablas_normativas_reglas.json` con, al menos:

```json
{
  "id": "regla-unica",
  "comuna": "Peñalolén",
  "instrumento": "nombre/version oficial",
  "field": "ZONA",
  "original": "U-1",
  "corrected": "ZU1",
  "confidence": "ALTA",
  "auto_apply": true,
  "source": "fuente oficial",
  "page": "página/plano",
  "reason": "motivo de la corrección"
}
```

No existen reemplazos globales de nomenclatura.

## Componentes que faltan para operación 100% cloud

1. Aplicación Microsoft Entra ID para el motor.
2. Permiso Microsoft Graph `Sites.Selected` o alcance seleccionado equivalente, restringido al sitio DEI y con acceso de lectura/escritura sólo donde corresponda.
3. Motor desplegado en Azure Function, Container App o servidor interno accesible por Power Automate.
4. Flujo Power Automate con trigger SharePoint y llamada al motor.
5. Secretos/credenciales almacenados fuera de GitHub Pages.
6. Catálogo de fuentes/reglas por comuna e instrumento para las correcciones normativas de contenido.

## Motor actual

El paquete `automation.tablas_normativas` ya permite:
- CSV y XLSX;
- contrato exacto de 35 campos;
- normalización determinística;
- auditoría y trazabilidad;
- reglas exactas por comuna/instrumento/campo;
- salida normalizada XLSX;
- QA XLSX;
- estado JSON.

Ejemplo local:

```bash
python -m automation.tablas_normativas.cli \
  "PRC_PEÑALOLEN_35_CAMPOS.csv" \
  --normalized-dir "02_TABLAS_NORMALIZADAS" \
  --qa-dir "03_QA_TRAZABILIDAD"
```
