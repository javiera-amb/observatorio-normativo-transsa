# Correcciones TUI — control de implementación

Este control traduce el documento `correcciones tui.docx` a cambios verificables de la plataforma. La fecha corresponde al cierre de la primera implementación integral; los datos de cobertura seguirán actualizándose cuando existan archivos espaciales materializados en `FUENTES_TUI`.

| N° | Corrección | Implementación |
|---:|---|---|
| 1 | Portada más sintética | Encabezado compacto, búsqueda y cuatro accesos de módulo. |
| 2 | Tarjetas menos grandes y reportes vigentes | Portada y reportes compactados; datos diarios recuperados hasta el 12-08-2026. |
| 3 | Orden de navegación | Seguimiento PRC, IPT y vigencia, Cobertura territorial, Noticias y cambios. Mapa, Archivo y Reportes IPT salen de la navegación principal. |
| 4 | Fuente de los PRC enviados | Se distingue inventario V1 histórico, carpeta OneDrive indexada y estándar TUI V2. |
| 5 | Comunas sin PRC | Se separa “Sin PRC comunal” de los cuatro estados de producción y se muestran IPT superiores aplicables. Buin incorpora PRMS y proceso municipal trazable. |
| 6 | Introducción repetida | Seguimiento usa una barra operativa compacta, sin repetir la portada. |
| 7 | Cobertura por región | Acordeones regionales, fichas comunales y cuatro indicadores por comuna. |
| 8 | Separación normativa/territorial | Cobertura muestra solo IPT aplicables y disponibilidad espacial; la auditoría normativa detallada permanece en Seguimiento/Vigencia. |
| 9 | Catálogo único de capas | IPT aplicables, capas recuperables, capas internas y fuentes por incorporar aparecen en una sola lista filtrable. |
| 10 | Fuentes candidatas integradas | Se eliminó el bloque separado; cada fuente incluye enlace, origen, fecha o referencia y estado de adquisición. |
| 11 | Indicadores explicados | Los KPI de seguimiento y vigencia se calculan desde la misma base y tienen rótulos verificables. |
| 12 | Vigencia regional | Se agregó acordeón por región antes del buscador de instrumentos. |
| 13 | Refundidos y transiciones | La ficha Coquimbo consolida PRC 2019→2026 y distingue consolidación, cambios, reemplazos y validaciones. |
| 14 | Lectura y fuentes | Se explicitan fuentes normativas, cartográficas y estado de acreditación. |
| 15 | IPT aplicables | PRC, PRM/PRI y PRDU se muestran según comuna y vigencia identificada. |
| 16 | QA al ingresar TUI V2 | El flujo explica estructura, comparación normativa, QA automático y revisión no automatizable. |
| 17 | Tareas SIG internas | Las tareas técnicas detalladas de Coquimbo se muestran solo en la vista de equipo. |
| 18 | Marco comparativo único | Se eliminó la duplicación entre “planes” y marco 2019→2026. |
| 19 | Avance antiguo | Se retiró el bloque de avance SIG anterior. |
| 20 | Un solo bloque SIG | Coquimbo usa una lista única de acciones verificables. |
| 21 | Cambios repetidos | Se retiró la repetición de “cambios específicos” fuera del marco comparativo. |
| 22 | Mapa secundario | El mapa sale de la navegación principal; queda disponible solo como módulo legado. |
| 23 | Línea de tiempo pura | La cronología ya no asigna estados bueno/malo a cada evento. |
| 24 | Gestión sin SharePoint | El equipo edita borradores nativos y los exporta al registro versionado en Git. |
| 25 | PRC sin cambios | Se genera una cola de candidatos a producción directa, excluyendo las 45 V1 que requieren reconstrucción. |
| 26 | Asignación de equipo | Javiera puede asignar Cristóbal, Annabel, Fernanda o Javiera. |
| 27 | KPI internos | Total comunas, con PRC, trabajo activo y revisión Javiera; cada tarjeta filtra la cola. |
| 28 | Prioridad numérica | Javiera asigna orden 1–5 y la cola se ordena por ese valor. |
| 29 | Definiciones operativas | Se explican estado de producción, envío, QA automático, revisión Javiera, actos, controles y fechas. |

## Regla transversal de diseño

Las matrices ocupan el ancho de la página y crecen hacia abajo. En pantallas estrechas se transforman en fichas verticales; no requieren desplazamiento horizontal para leer columnas.

## Regla transversal de cobertura

Una fuente localizada no equivale a cobertura. La confirmación exige archivo recuperable, versión y CRS controlados, geometría válida y cruce contra el límite comunal. Mientras falte cualquiera de esos pasos, el estado se mantiene como pendiente o bloqueado.
