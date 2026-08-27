# Corrección v0.5.2 — QA institucional y jurídico

Esta versión corrige hallazgos detectados en la primera ejecución real del 5 de agosto de 2026.

## Cambios principales

1. `organismo emisor` y `fuente de publicación` son campos distintos.
2. Los actos oficiales conservan tipo, número y fecha.
3. Las aperturas de participación ciudadana se describen como una etapa del procedimiento ambiental ya iniciado.
4. Se extraen plazo, proyecto, titular/proponente y ubicación cuando aparecen expresamente.
5. Los motivos de revisión solo señalan campos concretos faltantes.
6. El Word muestra escala, región, provincia, comuna y ubicación específica.
7. El portal heredado continúa funcionando sin cambios visuales.

## Reprocesamiento

Después de instalar, ejecutar `reprocesar_diario_v0_5_2.bat`. Este comando usa `--force`
para regenerar el análisis y el Word de la edición ya procesada, actualizando los eventos existentes
sin duplicarlos.
