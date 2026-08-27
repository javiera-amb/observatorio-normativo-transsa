#!/usr/bin/env python3
"""Registra en TUI un PRC versionado cuyo cierre llegó desde SharePoint.

Convención admitida:
- <IPT>_ACTUALIZADO.gpkg      => versión lógica 1
- <IPT>_ACTUALIZADO_v2.gpkg   => versión 2
- <IPT>_ACTUALIZADO_v3.gpkg   => versión 3
- también se tolera _v1 si alguna vez se usa explícitamente.

La versión numérica mayor siempre queda como archivo vigente. Si SharePoint
vuelve a emitir un evento de una versión anterior, TUI conserva la versión
más alta y solo incorpora el evento al historial.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

INVENTARIO = Path("data/inventario_prc_onedrive.js")
AVANCE = Path("data/avance_bases_inicial.js")
INDEX = Path("index.html")
PREFIJO_INVENTARIO = "window.INVENTARIO_PRC_ONEDRIVE ="
PREFIJO_AVANCE = "window.AVANCE_BASES_DATOS ="
PATRON_ACTUALIZADO = re.compile(r"_ACTUALIZADO(?:_v(\d+))?\.gpkg$", re.IGNORECASE)


def normalizar(valor: str) -> str:
    salida = unicodedata.normalize("NFD", str(valor or ""))
    salida = "".join(c for c in salida if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", salida.lower()).strip()


def extraer_version(nombre: str) -> int | None:
    m = PATRON_ACTUALIZADO.search(str(nombre or ""))
    if not m:
        return None
    return int(m.group(1)) if m.group(1) else 1


def cargar_js(path: Path, prefijo: str) -> dict[str, Any]:
    texto = path.read_text(encoding="utf-8").strip()
    if not texto.startswith(prefijo):
        raise RuntimeError(f"Formato inesperado en {path}")
    cuerpo = texto[len(prefijo):].strip()
    if cuerpo.endswith(";"):
        cuerpo = cuerpo[:-1].rstrip()
    return json.loads(cuerpo)


def guardar_js(path: Path, prefijo: str, datos: dict[str, Any]) -> None:
    path.write_text(
        prefijo + " " + json.dumps(datos, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )


def contexto_desde_ruta(ruta: str) -> tuple[str | None, str | None]:
    partes = [p for p in re.split(r"[\\/]+", ruta or "") if p]
    indice = next((i for i, parte in enumerate(partes) if normalizar(parte) == "prc"), None)
    if indice is None:
        return None, None
    region = partes[indice - 1] if indice > 0 else None
    comuna = partes[indice + 1] if len(partes) > indice + 1 else None
    return region, comuna


def clave_canonica(avance: dict[str, Any], region: str | None, comuna: str) -> str:
    comunas = avance.get("comunas", {})
    comuna_norm = normalizar(comuna)
    candidatos = [
        (clave, registro)
        for clave, registro in comunas.items()
        if normalizar(registro.get("comuna") or clave.split("|")[-1]) == comuna_norm
    ]
    if not candidatos:
        return f"{region or ''}|{comuna}"
    if len(candidatos) == 1:
        return candidatos[0][0]

    region_norm = normalizar(region or "").replace("ipt ", "")
    if region_norm:
        for clave, registro in candidatos:
            canon = normalizar(registro.get("region") or clave.split("|")[0])
            if region_norm in canon or canon in region_norm:
                return clave
    return candidatos[0][0]


def romper_cache(tag: str) -> None:
    texto = INDEX.read_text(encoding="utf-8")
    reemplazos = {
        r'data/inventario_prc_onedrive\.js\?v=[^"\']+': f'data/inventario_prc_onedrive.js?v={tag}',
        r'data/estado_equipo_versionado\.js\?v=[^"\']+': f'data/estado_equipo_versionado.js?v={tag}',
        r'data/estado_operativo_datos\.js\?v=[^"\']+': f'data/estado_operativo_datos.js?v={tag}',
    }
    for patron, reemplazo in reemplazos.items():
        texto = re.sub(patron, reemplazo, texto)
    INDEX.write_text(texto, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archivo", required=True)
    parser.add_argument("--ruta", required=True)
    parser.add_argument("--url", default="")
    parser.add_argument("--comuna", default="")
    parser.add_argument("--region", default="")
    parser.add_argument("--modificado-en", default="")
    args = parser.parse_args()

    version_nueva = extraer_version(args.archivo)
    if version_nueva is None:
        raise SystemExit(
            f"Archivo ignorado: {args.archivo}. Se espera *_ACTUALIZADO.gpkg o *_ACTUALIZADO_vN.gpkg"
        )

    region_ruta, comuna_ruta = contexto_desde_ruta(args.ruta)
    region = args.region or region_ruta or ""
    comuna = args.comuna or comuna_ruta or ""
    if not comuna:
        raise SystemExit("No fue posible determinar la comuna desde el payload o la ruta SharePoint.")

    inventario = cargar_js(INVENTARIO, PREFIJO_INVENTARIO)
    avance = cargar_js(AVANCE, PREFIJO_AVANCE)
    clave = clave_canonica(avance, region, comuna)

    ahora_dt = datetime.now(timezone.utc)
    ahora = ahora_dt.isoformat(timespec="seconds")
    modificado = args.modificado_en or ahora
    ruta = args.ruta.replace("\\", "/")

    comunas = inventario.setdefault("comunas", {})
    anterior = comunas.get(clave, {})
    archivo_anterior = str(anterior.get("archivo_seleccionado") or "")
    version_anterior = int(anterior.get("version_vigente") or extraer_version(archivo_anterior) or 0)
    mismo_archivo = archivo_anterior.casefold() == args.archivo.casefold()

    historial = list(anterior.get("versiones") or [])
    evento = {
        "version": version_nueva,
        "archivo": args.archivo,
        "ruta_relativa": ruta,
        "modificado_en": modificado,
        **({"url_sharepoint": args.url} if args.url else {}),
    }
    indice_existente = next(
        (
            i for i, item in enumerate(historial)
            if int(item.get("version", -1)) == version_nueva
            and str(item.get("archivo", "")).casefold() == args.archivo.casefold()
        ),
        None,
    )
    if indice_existente is None:
        historial.append(evento)
    else:
        historial[indice_existente] = {**historial[indice_existente], **evento}
    historial.sort(key=lambda x: (int(x.get("version", 0)), str(x.get("modificado_en", ""))))

    # Nunca retroceder de versión. En empate, el evento más reciente puede refrescar la misma versión.
    debe_ser_vigente = version_anterior == 0 or version_nueva >= version_anterior

    registro = {**anterior}
    if debe_ser_vigente:
        qa_anterior = anterior.get("qa_archivo") if mismo_archivo else None
        qa = qa_anterior if isinstance(qa_anterior, dict) else {
            "valido": None,
            "estado": "pendiente_qa_cierre",
            "estandar_tui_v2": {
                "modelo_detectado": "tui_v2",
                "cumple_estructura": True,
                "bloqueos": [],
                "activacion_estado": "archivo_actualizado_versionado",
                "nota_estado": "El estado Actualizado se activa por _ACTUALIZADO[ _vN ].gpkg; el QA se registra por separado.",
            },
        }
        registro.update({
            "archivo_seleccionado": args.archivo,
            "ruta_relativa": ruta,
            **({"url_sharepoint": args.url} if args.url else {}),
            "modificado_en": modificado,
            "qa_archivo": qa,
            "version_vigente": version_nueva,
        })

    registro.update({
        "estado_detectado": "actualizado",
        "modelo_detectado": "tui_v2",
        "versiones": historial,
        "versiones_encontradas": len({int(x.get("version", 0)) for x in historial if int(x.get("version", 0)) > 0}),
        "fuente_evento": "sharepoint_power_automate",
    })
    comunas[clave] = registro

    inventario["schema_version"] = max(int(inventario.get("schema_version", 0)), 6)
    inventario["generado_en"] = ahora
    inventario["almacenamiento"] = "SharePoint / OneDrive Transsa. Actualización automática por eventos de archivos PRC versionados."
    inventario["criterio"] = (
        "_ACTUALIZADO.gpkg equivale a V1; _ACTUALIZADO_vN.gpkg equivale a VN. "
        "La versión numérica mayor queda como archivo vigente y activa Actualizado; el QA permanece independiente."
    )

    registros = list(comunas.values())
    inventario["resumen"] = {
        "comunas_con_evidencia": len(comunas),
        "archivos_actualizado": sum(
            extraer_version(str(r.get("archivo_seleccionado", ""))) is not None for r in registros
        ),
        "archivos_enviado": sum(
            bool(re.search(r"_Enviado(?:_v\d+)?\.gpkg$", str(r.get("archivo_seleccionado", "")), re.I))
            for r in registros
        ),
        "ultima_comuna_actualizada": clave,
        "ultimo_archivo_recibido": args.archivo,
        "ultima_version_recibida": version_nueva,
        "version_vigente": comunas[clave].get("version_vigente"),
    }

    guardar_js(INVENTARIO, PREFIJO_INVENTARIO, inventario)
    romper_cache("auto-" + ahora_dt.strftime("%Y%m%d%H%M%S"))
    vigente = comunas[clave].get("archivo_seleccionado")
    print(f"TUI: {clave} -> Actualizado | recibido V{version_nueva} | vigente: {vigente}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
