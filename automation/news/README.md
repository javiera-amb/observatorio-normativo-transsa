# Módulo `automation.news`

Base técnica de la versión 0.6 para recolectar noticias urbanas e inmobiliarias.

## Componentes

- `sources.py`: carga y valida el registro de fuentes.
- `rss.py`: descarga y parsea RSS/Atom.
- `normalization.py`: normaliza texto, títulos y URLs.
- `deduplication.py`: elimina duplicados entre fuentes.
- `relevance.py`: puntúa relevancia para Transsa.
- `collector.py`: orquesta una prueba de recolección.

## Restricción actual

El módulo no escribe en SQLite, no llama a Ollama y no modifica el portal. Su salida es preliminar y se usa para auditar fuentes y reglas antes de activar la publicación automática.
