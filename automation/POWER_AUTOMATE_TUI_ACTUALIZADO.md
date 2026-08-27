# Power Automate · cambio automático a ACTUALIZADO en TUI

## Objetivo

Cuando un integrante del equipo guarda en SharePoint/OneDrive un archivo final cuyo nombre termina en:

`_ACTUALIZADO.gpkg`

TUI debe cambiar automáticamente el estado correspondiente a **Actualizado**.

- Si el archivo está dentro de una carpeta `PRC`, se actualiza la **comuna**.
- Si está dentro de `PRI`, `PRM`, `PRMS`, `PRMV`, `PRMC`, `PRMVAL` u otra variante metropolitana/intercomunal admitida, se actualiza el **instrumento PRI/PRM**.
- El QA continúa siendo un control separado.

---

## Flujo único recomendado

### 1. Disparador SharePoint

Usar:

**SharePoint → Cuando se crea un archivo (solo propiedades)**

Sitio:

`DEI`

Biblioteca:

`Documentos compartidos`

No restringir el disparador a una sola región. El filtro se hace dentro del flujo para cubrir todo `00_IPT_Nacional`.

---

## 2. Condición inicial

Continuar únicamente cuando se cumplan ambas condiciones:

1. La ruta contiene `00_IPT_Nacional`.
2. El nombre del archivo termina exactamente en `_ACTUALIZADO.gpkg`.

Expresión conceptual:

```text
contains(Ruta, '00_IPT_Nacional')
AND
endsWith(NombreConExtension, '_ACTUALIZADO.gpkg')
```

Si no se cumple, finalizar el flujo sin acción.

---

## 3. Determinar tipo de IPT

### Rama A · PRC

Si la ruta contiene:

```text
/PRC/
```

enviar un evento de GitHub con:

```text
event_type = prc_actualizado_sharepoint
```

Payload:

```json
{
  "archivo": "<Nombre con extensión>",
  "ruta": "<Ruta relativa del archivo>",
  "url": "<Vínculo al elemento>",
  "modificado_en": "<Fecha/hora de modificación>"
}
```

No es obligatorio enviar comuna ni región: GitHub las obtiene desde la estructura:

```text
IPT_<Region>/PRC/<Comuna>/<archivo>
```

Workflow receptor:

`.github/workflows/prc-actualizado-sharepoint.yml`

---

### Rama B · PRI / PRM

Si NO es PRC y la ruta contiene alguna carpeta intercomunal/metropolitana, por ejemplo:

```text
/PRI/
/PRM/
/PRMS/
/PRMV/
/PRMC/
/PRMVAL/
```

enviar:

```text
event_type = pri_prm_actualizado_sharepoint
```

Payload:

```json
{
  "archivo": "<Nombre con extensión>",
  "ruta": "<Ruta relativa del archivo>",
  "url": "<Vínculo al elemento>",
  "modificado_en": "<Fecha/hora de modificación>"
}
```

Región y tipo se derivan automáticamente desde una ruta como:

```text
00_IPT_Nacional/IPT_Metropolitana/PRMS/IPT_13_PRMS_Santiago_ACTUALIZADO.gpkg
```

Workflow receptor:

`.github/workflows/pri-prm-actualizado-sharepoint.yml`

---

## 4. Acción GitHub

Usar el conector GitHub y la acción equivalente a:

**Create a repository dispatch event**

Repositorio:

```text
javiera-amb/observatorio-normativo-transsa
```

Cada rama usa su `event_type` correspondiente.

---

## 5. Resultado esperado

### PRC

```text
IPT_02_PRC_Calama_ACTUALIZADO.gpkg
        ↓
SharePoint
        ↓
Power Automate
        ↓
prc_actualizado_sharepoint
        ↓
GitHub Actions
        ↓
TUI · Calama = Actualizado
```

### PRI / PRM

```text
IPT_13_PRMS_Santiago_ACTUALIZADO.gpkg
        ↓
SharePoint
        ↓
Power Automate
        ↓
pri_prm_actualizado_sharepoint
        ↓
GitHub Actions
        ↓
TUI · PRMS Santiago = Actualizado
```

---

## Regla de precedencia

El archivo `_ACTUALIZADO.gpkg` acredita el **estado de producción**, no el QA.

Orden lógico:

```text
Pendiente
  ↓
En desarrollo
  ↓
_ACTUALIZADO.gpkg detectado
  ↓
Actualizado
  ↓
Enviado
```

`Enviado` queda por encima de `Actualizado` y no debe ser rebajado automáticamente si ya existe un envío posterior válido.

---

## Estructura de almacenamiento que se respeta

No se crean carpetas nuevas ni se trasladan archivos.

```text
00_IPT_Nacional/
└── IPT_<Region>/
    ├── LU/
    ├── PRC/
    ├── PRI/        # cuando exista
    ├── PRM/        # cuando exista
    ├── PRMS/       # cuando exista
    ├── PRMV/       # cuando exista
    └── ...
```

TUI detecta y sigue la estructura existente de Cartografía Transsa.
