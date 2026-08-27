# Automatización diaria de Transsa Urban Intelligence

Copiar los cuatro archivos en la raíz del repositorio, al mismo nivel que `automation`, `data`, `index.html` y `.git`.

1. Ejecutar `probar_actualizacion_tui.bat`.
2. Confirmar que el proceso termina correctamente y que GitHub recibe el commit, si hubo novedades.
3. Ejecutar `instalar_tarea_diaria_tui.bat`.
4. La tarea quedará programada todos los días a las 08:30.

La automatización:
- comprueba que no existan cambios de código pendientes;
- hace `git pull --ff-only`;
- comprueba Ollama y `qwen3:8b`;
- ejecuta el pipeline del Diario Oficial;
- ejecuta pruebas y valida el portal;
- prepara solo resultados públicos;
- hace commit y push únicamente si existen cambios;
- guarda logs en `_local/logs/`.

Ollama debe estar activo y la sesión de Windows iniciada.
