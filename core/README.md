# Núcleo de Transsa Urban Intelligence

El directorio `core/` es independiente de las fuentes y del portal.

Responsabilidades actuales:

- modelo canónico de evento;
- identificadores estables;
- esquema y acceso a SQLite;
- lectura y escritura de la salida heredada;
- persistencia de JSON canónicos.

No debe contener scraping, HTML del portal ni lógica específica de una fuente.
