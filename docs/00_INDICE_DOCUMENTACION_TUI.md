# Índice real de documentación TUI

## Qué existe en este repositorio

Este inventario se verificó el 11 de agosto de 2026 sobre la rama `feature/auditoria-operativa-ipt`.

No existe una serie continua de diecinueve archivos. Los documentos disponibles comienzan en el número 05 y algunos números tienen dos archivos porque registran un sprint y una corrección distinta.

| Número | Archivo disponible | Tipo |
|---|---|---|
| 01 | No está en el repositorio ni en su historial Git disponible | Referencia antigua: Visión y principios |
| 02 | No está en el repositorio ni en su historial Git disponible | Referencia antigua: Arquitectura |
| 03 | No está en el repositorio ni en su historial Git disponible | Referencia antigua: Modelo de datos |
| 04 | No está en el repositorio ni en su historial Git disponible | Referencia antigua: Roadmap |
| 05 | `05_DIAGNOSTICO_REPOSITORIO_ACTUAL.md` | Diagnóstico |
| 06 | `06_SPRINT_1_NUCLEO_Y_MIGRACION.md` | Sprint |
| 07 | `07_REGISTRO_VALIDACION_V0_2.md` | Registro de validación |
| 08 | `08_SPRINT_2_MOTOR_UNIVERSAL_DE_EVENTOS.md` | Sprint |
| 09 | `09_SPRINT_3_OLLAMA_LOCAL.md` | Sprint |
| 10 | `10_CORRECCION_V0_4_1_CLASIFICACION_HIBRIDA.md` | Corrección |
| 11 | `11_SPRINT_4_DIARIO_OFICIAL_LOCAL.md` | Sprint |
| 12 | `12_SPRINT_5_NOTICIAS_BASE.md` | Sprint |
| 12 | `12_CORRECCION_V0_5_2_QA_INSTITUCIONAL.md` | Corrección |
| 13 | `13_DECISION_FUENTES_NOTICIAS.md` | Decisión |
| 13 | `13_CORRECCION_V0_5_2_1_REPROCESAMIENTO_IDEMPOTENTE.md` | Corrección |
| 14 | `14_CHECKLIST_PR_NOTICIAS_V0_6.md` | Checklist |
| 14 | `14_CORRECCION_V0_5_2_2_CIERRE_SQLITE_WINDOWS.md` | Corrección |
| 15 | `15_PRIORIDAD_NORMATIVA_Y_ARQUITECTURA_PORTAL.md` | Arquitectura funcional |
| 15 | `15_CORRECCION_V0_5_3_PRECISION_JURIDICA_E_INTELIGENCIA.md` | Corrección |
| 16 | `16_AUDITORIA_UX_PORTAL.md` | Auditoría UX |
| 17 | `17_REEMPLAZOS_INTEGRALES_Y_FUENTES_MULTIFUENTE.md` | Regla nacional |
| 18 | `18_PLATAFORMA_OPERATIVA_USUARIOS_QGIS.md` | Plataforma operativa |
| 19 | `19_SEGUIMIENTO_PROPITEQ_Y_CAPAS_TERRITORIALES.md` | Seguimiento y capas |

## Qué conviene guardar

1. Guardar siempre la carpeta `docs` completa, no archivos sueltos.
2. Conservar ambos archivos cuando un número se repite: no son duplicados.
3. Mantener este índice junto con `README.md`.
4. No crear documentos 01–04 solo para completar la numeración. Si se recuperan desde otro respaldo, deben compararse antes de reincorporarlos.
5. El código y los datos que hacen funcionar la visualización deben conservarse en el repositorio Git; los documentos 18 y 19 por sí solos no reproducen la página.

## Componentes de la visualización operativa

- `seguimiento-consolidado.js` y `seguimiento-consolidado.css`;
- `data/seguimiento_normativo.js`;
- `capas-territoriales.js` y `capas-territoriales.css`;
- `data/capas_territoriales.js`;
- ficha detallada de Coquimbo y sus datos de auditoría;
- `index.html`, `app.js` y `ux-refresh.js`.
