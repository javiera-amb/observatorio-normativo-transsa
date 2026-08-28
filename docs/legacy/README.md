# Documentación histórica / deprecada

Esta carpeta identifica documentación que ya no debe usarse como instrucción operativa vigente de TUI.

La eliminación de un archivo del árbol actual **no elimina su historial Git**. Si se necesita reconstruir una decisión antigua, debe consultarse el commit correspondiente.

## Guías raíz retiradas durante la depuración 2026-08-28

| Archivo anterior | Motivo |
|---|---|
| `CONFIGURACION_AUTOMATICA.md` | Describía un workflow diario de GitHub que ya no existe y asumía publicación directa mediante Actions/OpenAI. |
| `LEEME_ACTUALIZACION.txt` | Instrucción incremental antigua: indicaba copiar/reemplazar archivos y hacer commit directo a `main`. |
| `README_PASOS.txt` | Solo redirigía a `CONFIGURACION_AUTOMATICA.md`. |
| `LEEME_AUTOMATIZACION_DIARIA.md` | Sustituido por `docs/operacion/DIARIO_OFICIAL_LOCAL.md`. |
| `SIG_IPT_INSTRUCCIONES.md` | Documento de una versión anterior del modelo SIG/TUI; contiene reglas que no coinciden con el estándar PRC vigente en Notion. |
| `CORRECCIONES_TUI_2026-08-13.md` | Control histórico de una implementación anterior. Se conserva en Git, pero no es manual vigente. |

## Fuentes vigentes

- Operación Diario Oficial: `docs/operacion/DIARIO_OFICIAL_LOCAL.md`.
- Índice documental: `docs/00_INDICE_DOCUMENTACION_TUI.md`.
- Estado operativo/deuda técnica: `docs/21_AUDITORIA_OPERATIVA_TUI_2026-08-28.md`.
- Gobierno/metodología PRC/TUI: Notion DEI V2.
