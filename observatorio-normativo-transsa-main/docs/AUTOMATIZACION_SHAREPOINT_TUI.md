# Automatización SharePoint → TUI

## Objetivo

Cuando se crea en `00_IPT_Nacional` un GeoPackage cuyo nombre termina en `_ACTUALIZADO.gpkg`, SharePoint avisa a GitHub y TUI cambia automáticamente el estado correspondiente a **Actualizado**.

El mismo flujo sirve para:
- PRC: actualiza la comuna.
- PRI / PRM / PRMS / variantes: actualiza el instrumento intercomunal/metropolitano.

GitHub clasifica el tipo según la ruta; Power Automate no necesita mantener dos ramas distintas.

## Flujo Power Automate

### 1. Disparador SharePoint
Usar **Cuando se crea un archivo (solo propiedades)** sobre la biblioteca `Documentos compartidos` del sitio DEI.

No limitar a una sola carpeta regional: los archivos pueden aparecer bajo cualquier `IPT_<Region>`.

### 2. Condición
Continuar solo cuando se cumplan ambas reglas:

- **Nombre de archivo con extensión** termina en `_ACTUALIZADO.gpkg`.
- **Ruta de carpeta** contiene `00_IPT_Nacional`.

Si la condición es falsa, terminar el flujo sin acción.

### 3. Acción GitHub
Usar la acción del conector GitHub **Create a repository dispatch event**.

Configurar:

- Owner: `javiera-amb`
- Repository: `observatorio-normativo-transsa`
- Event type: `ipt_actualizado_sharepoint`

### 4. Client payload
Enviar un objeto JSON con estos campos, usando contenido dinámico del disparador:

```json
{
  "archivo": "<Nombre de archivo con extensión>",
  "ruta": "<Ruta de carpeta + nombre, o ruta relativa disponible>",
  "url": "<Vínculo al elemento, si está disponible>",
  "modificado_en": "<Fecha de modificación>"
}
```

Lo importante es que `ruta` conserve los segmentos del IPT, por ejemplo:

```text
00_IPT_Nacional/IPT_Antofagasta/PRC/Calama/IPT_02_PRC_Calama_ACTUALIZADO.gpkg
```

o:

```text
00_IPT_Nacional/IPT_Metropolitana/PRMS/IPT_13_PRMS_Santiago_ACTUALIZADO.gpkg
```

## Qué hace GitHub

El workflow `.github/workflows/ipt-actualizado-sharepoint.yml`:

1. valida que el archivo termine en `_ACTUALIZADO.gpkg`;
2. clasifica el IPT desde la ruta;
3. si contiene `/PRC/`, ejecuta `scripts/registrar_prc_actualizado.py`;
4. si contiene `/PRI/`, `/PRM/`, `/PRMS/` o variante, ejecuta `scripts/registrar_pri_prm_actualizado.mjs`;
5. actualiza el dato versionado de TUI;
6. rompe la caché necesaria;
7. hace commit automático con usuario `tui-bot` y publica en `main`.

## Regla de estado

`*_ACTUALIZADO.gpkg` acredita el estado **Actualizado**.

El QA técnico permanece separado: un instrumento puede estar visible como Actualizado y mantener QA pendiente u observaciones.

## Prueba recomendada

Usar primero un archivo ya conocido, o subir/copiar temporalmente un archivo de prueba que siga la convención `_ACTUALIZADO.gpkg` en una carpeta IPT de prueba/controlada.

Comprobar:
1. ejecución correcta en Power Automate;
2. ejecución verde del workflow `IPT actualizado desde SharePoint` en GitHub Actions;
3. commit automático de `tui-bot`;
4. cambio visible a **Actualizado** en TUI.
