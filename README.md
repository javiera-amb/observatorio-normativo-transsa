# Observatorio Normativo Urbano — Transsa

Portal privado del Departamento de Estudios Inmobiliarios con dos módulos:

1. **Diario Oficial:** actualización diaria de urbanismo, construcción,
   arquitectura, vivienda, patrimonio y evaluación ambiental.
2. **Actualizaciones IPT:** revisión mensual nacional de PRC, PRI, PRM,
   planes seccionales, enmiendas, límites urbanos, PROT y otros actos.

## Inicio

Lee `CONFIGURACION_AUTOMATICA.md`.

## Automatizaciones

- `.github/workflows/actualizar-diario.yml`
- `.github/workflows/actualizar-ipt.yml`

## Bases web

- `data/reportes.js`
- `data/ipt_reportes.js`


## Histórico anual

- Base: `data/historicos.js`
- Acción: `.github/workflows/cargar-historico-anual.yml`
- Script: `automation/cargar_historico_anual.py`
- Word: `documentos/historicos/`
- Consolidado: `consolidados/historicos/`


## Mapa territorial

- Biblioteca: Leaflet 1.9.4.
- Cartografía base: OpenStreetMap.
- Visualización: marcadores regionales agregados.
- Fuentes: Diario Oficial, IPT e histórico anual.
