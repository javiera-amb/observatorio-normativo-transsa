# Scripts del núcleo TUI

## Ejecutar todo el Sprint 1

Desde la raíz del repositorio:

```bash
python scripts/run_sprint1.py
```

## Scripts individuales

- `init_database.py`: crea el esquema SQLite.
- `migrate_legacy_reports.py`: transforma `data/reportes.js` en eventos canónicos.
- `export_legacy_reports.py`: regenera la salida compatible para el portal.
- `validate_sprint1.py`: verifica cantidad, JSON y equivalencia exacta.

Los scripts son idempotentes: pueden ejecutarse nuevamente sin duplicar eventos.

## Cruce territorial para las 346 comunas

`cruzar_capas_por_comuna.py` construye la matriz real capa × comuna. No usa el alcance declarado en Notion como sustituto de una intersección espacial.

```bash
pip install -r scripts/requirements_geoespacial.txt
python scripts/cruzar_capas_por_comuna.py \
  --comunas /ruta/Comunas_SII-Transsa.gpkg \
  --fuentes-dir /ruta/capas_vigentes
```

El proceso:

- exige una matriz objetivo de 346 comunas y campos de código, comuna y región;
- disuelve Santiago, Santiago Sur y Santiago Oeste en una sola comuna de Santiago;
- normaliza Paiguano/Paihuano, Tiltil/Til Til, Alto Biobío/Alto Bio Bio, Cholchol/Chol Chol y Coihaique/Coyhaique;
- conserva Antártica como bloqueo explícito cuando el límite base no contiene su geometría;
- busca los archivos definidos en `config/capas_territoriales_fuentes.json`;
- valida que cada archivo tenga CRS y geometrías consumibles;
- elimina falsos positivos causados solo por contacto de borde;
- guarda presencia, cantidad de elementos, métricas de intersección y SHA-256;
- escribe `data/cobertura_capas_resultados.js`, que consume la vista “Cobertura comunal”.

Una capa sin archivo queda `bloqueada`; una capa procesada puede quedar `con_cobertura` o `sin_elementos` para cada comuna. Cero elementos es un resultado, no un pendiente.
