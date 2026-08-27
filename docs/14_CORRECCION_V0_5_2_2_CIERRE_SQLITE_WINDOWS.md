# Corrección v0.5.2.2 — Cierre explícito de SQLite en pruebas de Windows

## Problema observado

La prueba de reprocesamiento documental abría una conexión SQLite dentro de un
`TemporaryDirectory`. El context manager de `sqlite3.Connection` confirma o
revierte la transacción, pero no cierra la conexión. En Windows, el archivo
`*.sqlite3` permanecía bloqueado al intentar eliminar la carpeta temporal y se
producía `PermissionError: [WinError 32]`.

## Solución

- La prueba cierra explícitamente la conexión mediante `finally`.
- No se modifica la base de datos principal ni la lógica del pipeline.
- Se mantiene la prueba de idempotencia documental incorporada en v0.5.2.1.

## Resultado esperado

Las 20 pruebas finalizan correctamente en Windows y luego puede ejecutarse el
reprocesamiento de la edición sin borrar datos ni recrear la base.
