# Plataforma operativa de auditoría IPT

## Objetivo

Transformar la ficha comunal en una herramienta de trabajo para auditar IPT a nivel nacional. La plataforma debe permitir saber, sin leer todo el expediente:

- qué instrumento está vigente;
- qué fuente normativa y qué fuente vectorial se usaron;
- por qué el SIG todavía no está validado;
- qué controles están pendientes, bloqueados o resueltos;
- quién es responsable;
- qué evidencia respalda cada decisión;
- qué resultado produjo el último proceso QGIS/Python;
- quién cambió un estado y cuándo.

La plataforma no debe permitir que marcar una tarea como lista cambie automáticamente la vigencia normativa. La validación final debe exigir evidencia y revisión humana.

## Decisión técnica

GitHub Pages puede seguir publicando la parte informativa, pero no puede sostener usuarios ni guardar avances porque es hosting estático. Para la operación interna se propone:

1. **Frontend:** el portal actual, desplegado también en Cloudflare Pages.
2. **Acceso interno:** Cloudflare Access por correo corporativo o proveedor de identidad.
3. **API:** Cloudflare Pages Functions.
4. **Base de datos:** Cloudflare D1.
5. **Código y snapshots públicos:** GitHub.
6. **Archivos SIG internos pesados:** repositorio corporativo existente; D1 guarda ruta, metadatos, hash y estado, no el GeoPackage completo.

Esta arquitectura no requiere mantener un servidor tradicional. Las credenciales y escrituras quedan en Functions; nunca deben quedar API keys en JavaScript público.

## Roles y permisos

| Rol | Puede hacer |
|---|---|
| Administradora principal | Única cuenta con control total: gestionar usuarios, asignar trabajo, editar fuentes y criterios, aprobar o reabrir controles y declarar una versión validada |
| Colaborador | Ver sus asignaciones, cambiar el avance de sus propios controles, adjuntar evidencia y comentar; no puede reasignar, editar el diagnóstico base ni validar el IPT final |
| Propiteq | Consultar el seguimiento consolidado y descargar su estado; no puede modificar avances ni acceder a comentarios internos |
| Consulta interna | Ver fichas, evidencia, avance y bitácora sin editar |

La administradora principal es la única autoridad de cierre. La asignación debe poder realizarse por comuna, instrumento o control específico. Un colaborador solo puede modificar controles que estén asignados a su usuario.

La validación final requiere una acción explícita de la administradora principal: completar todas las tareas no debe cambiar automáticamente el estado normativo a “validado”.

## Estados de trabajo

| Estado | Uso |
|---|---|
| Por asignar | Existe el control, pero no tiene responsable |
| Pendiente | Asignado, todavía no iniciado |
| En progreso | Trabajo activo |
| Bloqueado | Falta archivo, fuente, decisión o dependencia |
| En revisión | Trabajo entregado y pendiente de segunda revisión |
| Validado | Evidencia revisada y criterio de aceptación cumplido |
| Descartado con justificación | El control no aplica; exige comentario y evidencia |

## Modelo mínimo de datos

### `users`

`id`, `email`, `nombre`, `rol`, `activo`, `created_at`.

### `instruments`

`id`, `codigo_comuna`, `region`, `comuna`, `tipo_ipt`, `nombre`, `version_vigente`, `estado_legal`, `estado_sig`, `responsable_id`, `updated_at`.

### `audit_controls`

`id`, `instrument_id`, `codigo_control`, `categoria`, `titulo`, `hallazgo`, `metodo`, `tarea`, `prioridad`, `estado`, `responsable_id`, `fecha_limite`, `criterio_aceptacion`, `updated_at`.

### `evidence`

`id`, `control_id`, `tipo`, `nombre`, `url_o_ruta`, `fuente`, `fecha_fuente`, `hash_archivo`, `observacion`, `created_by`, `created_at`.

### `audit_runs`

`id`, `instrument_id`, `script`, `version_script`, `fecha_ejecucion`, `hash_entrada`, `archivo_salida`, `resultado`, `metricas_json`, `ejecutado_por`.

### `activity_log`

`id`, `entidad`, `entidad_id`, `accion`, `antes_json`, `despues_json`, `usuario_id`, `created_at`.

La bitácora es obligatoria. No se eliminan revisiones anteriores: se corrigen creando una nueva versión.

## Contrato con QGIS/Python

Los scripts locales no deben escribir directamente en la base productiva durante la primera etapa. Cada ejecución debe generar un resultado JSON reproducible junto con el GeoPackage o reporte técnico.

Ejemplo mínimo:

```json
{
  "schema_version": "1.0",
  "instrument_id": "PRC-04201-2026",
  "run_id": "PRC-04201-2026-20260811T154500",
  "script": "auditar_ipt_qgis.py",
  "script_version": "0.1.0",
  "executed_at": "2026-08-11T15:45:00-04:00",
  "source": {
    "type": "arcgis_feature_server",
    "url": "https://geoide.minvu.cl/server/rest/services/IPT/PRC_Coquimbo/FeatureServer",
    "downloaded_at": "2026-08-11T15:30:00-04:00"
  },
  "layers": [
    {
      "name": "zonificacion",
      "feature_count": 1183,
      "empty_geometries": 2,
      "invalid_geometries": 0,
      "duplicate_geometries": 0
    }
  ],
  "controls": [
    {
      "code": "COQ-VAL-03",
      "status": "failed",
      "finding": "Dos geometrías vacías",
      "object_ids": [656, 892]
    }
  ],
  "outputs": {
    "geopackage": "PRC_Coquimbo_2026_auditoria.gpkg",
    "report": "PRC_Coquimbo_2026_auditoria.json"
  }
}
```

El portal importa este JSON y propone actualizar controles. Una persona debe confirmar el cambio antes de declarar el instrumento validado.

## Criterio para declarar “SIG validado”

El estado final solo puede activarse cuando:

1. el último acto normativo y sus rectificaciones están identificados;
2. la fuente vectorial y su fecha de descarga están registradas;
3. códigos y atributos coinciden con ordenanza y planos;
4. modificaciones, enmiendas y seccionales tienen destino documentado;
5. QA geométrica no tiene errores bloqueantes;
6. capas suplementarias aplicables están presentes;
7. cada control crítico tiene evidencia y segunda revisión;
8. la versión validada queda congelada mediante hash y fecha.

## Implementación por etapas

### Etapa 1 — ficha operativa y transparente

- Mostrar alertas, método, evidencia y tareas en la ficha comunal.
- Usar Coquimbo como piloto.
- Preparar el mismo esquema de controles para todas las comunas.

### Etapa 2 — tablero nacional y responsables

- Vista “Mi trabajo”.
- Asignación por comuna, IPT y control.
- Filtros por responsable, prioridad y estado.
- Porcentaje calculado sobre controles, no editado manualmente.
- Vista consolidada de solo lectura para Propiteq, separada de la gestión interna.

El 11 de agosto de 2026 se incorporó una primera visualización de esta etapa dentro de “Seguimiento PRC”. El conmutador separa “Vista Propiteq” de “Vista interna”. La vista interna ya presenta responsable, etapa técnica, prioridad, porcentaje, QA, bloqueo, próxima acción y última actividad; mientras no exista autenticación y base operativa, los responsables no informados se muestran explícitamente como “Sin asignar” y no se habilita guardado en línea.

### Etapa 3 — autenticación, D1 y bitácora

- Proteger la versión operativa con Cloudflare Access.
- Crear API de lectura y escritura con Pages Functions.
- Guardar usuarios, asignaciones, estados, comentarios y bitácora en D1.

### Etapa 4 — integración QGIS/Python

- Estandarizar el JSON de salida de todos los scripts.
- Importar ejecuciones y métricas.
- Vincular cada error automático con un control de la ficha.
- Reejecutar y cerrar automáticamente solo los controles técnicos que pasen; la validación normativa sigue siendo humana.

### Etapa 5 — vigilancia nacional continua

- Detectar nuevos actos y cambios en servicios oficiales.
- Crear automáticamente controles por revisar.
- Notificar al responsable del instrumento.
- Mantener snapshots históricos para comparar versiones.
