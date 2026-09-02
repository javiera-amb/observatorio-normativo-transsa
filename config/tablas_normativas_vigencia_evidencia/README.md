# Evidencia de aplicación normativa

Esta carpeta recibe evidencia estructurada para comunas con uno o más actos posteriores al instrumento base.

Un archivo de evidencia debe indicar como mínimo:

```json
{
  "comuna": "Nombre comuna",
  "version_normativa_id": "norm-...",
  "actos_aplicados": ["official-id-1", "official-id-2"],
  "checks": {
    "actos_posteriores_verificados": true,
    "actos_posteriores_aplicados_tabla": true,
    "actos_posteriores_aplicados_sig": true,
    "texto_vigente_verificado": true,
    "version_normativa_coincidente": true
  }
}
```

El motor V5 exige coincidencia exacta de versión y de todos los actos esperados. Un archivo incompleto o de otra versión no certifica la comuna.
