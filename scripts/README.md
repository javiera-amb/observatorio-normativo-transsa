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
