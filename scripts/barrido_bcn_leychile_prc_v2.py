from __future__ import annotations

"""Compatibilidad final de nombres para el barrido BCN/LeyChile.

No introduce reglas normativas por comuna: sólo traduce diferencias ortográficas
entre el inventario territorial histórico y el parámetro ``com`` que espera el
reporte comunal de BCN. La clasificación y el gate siguen siendo nacionales.
"""

import barrido_bcn_leychile_prc as core

core.BCN_QUERY_ALIASES.update(
    {
        "calera": "La Calera",
        "ranquil": "Ránquil",
        "los alamos": "Los Álamos",
        "los angeles": "Los Ángeles",
        # El endpoint SIIT de BCN responde 500 con el apóstrofo escapado. Se prueba
        # primero la variante sin apóstrofo; si BCN la rechaza la corrida falla.
        "o higgins": "O Higgins",
    }
)


if __name__ == "__main__":
    raise SystemExit(core.main())
