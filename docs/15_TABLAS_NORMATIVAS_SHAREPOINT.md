# Tablas Normativas IPT · integración SharePoint

## Origen operativo

Las tablas canónicas se mantienen en el sitio SharePoint **DEI** dentro de `01_TABLAS_CANONICAS`.

La TUI usa un inventario de nombres de archivo para saber qué comunas tienen tabla, pero no publica credenciales ni el contenido de los CSV en GitHub.

## Flujo

1. Seleccionar en el navegador la carpeta `01_TABLAS_CANONICAS` sincronizada desde SharePoint.
2. La TUI reconoce los archivos por comuna.
3. Ejecutar auditoría individual o por carpeta completa.
4. Mantener la tabla original sin modificaciones.
5. Generar tabla normalizada con exactamente 35 campos productivos.
6. Exportar QA y trazabilidad en un archivo separado.
7. Las correcciones normativas que dependan de fuente oficial permanecen pendientes de validación humana hasta contar con evidencia suficiente.

## Carpetas de salida en SharePoint

- `02_TABLAS_NORMALIZADAS`
- `03_QA_TRAZABILIDAD`

## Reglas de seguridad y trazabilidad

- No sobrescribir `01_TABLAS_CANONICAS`.
- No exponer contenido de tablas en GitHub.
- No reemplazar globalmente `ZONA` ni `CODIGO_PRC`.
- Los posibles errores OCR requieren contraste documental.
- `TIPO_VARIANTE` y `MOTIVO_VARIANTE` no pertenecen a los 35 campos productivos y se incorporan después en staging.
