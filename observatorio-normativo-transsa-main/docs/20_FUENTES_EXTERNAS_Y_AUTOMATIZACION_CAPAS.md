# Fuentes externas y automatización de capas territoriales

Fecha de corte: 2026-08-11.

## Regla de control

La plataforma separa cinco hitos: fuente localizada, archivo materializado, cruce geométrico ejecutado, QA aprobado y publicación. Encontrar una descarga o un visor no confirma cobertura comunal ni vigencia.

Orden de preferencia para adquirir datos:

1. API, FeatureServer o WFS oficial.
2. GeoPackage, GeoJSON o FileGDB oficial.
3. Shapefile oficial completo.
4. CSV oficial con coordenadas.
5. KML/KMZ oficial.
6. Fuente abierta complementaria, identificada como no normativa.
7. PDF o imagen, solo cuando no existe geometría recuperable.

## Hallazgos del primer barrido

| Capa | Fuente recomendada | Adquisición | Observación principal |
|---|---|---|---|
| Áreas protegidas | SBAP / SIMBIO | Geoportal y servicios | Desde febrero de 2026 el SBAP administra los datos oficiales de biodiversidad. |
| Sitios prioritarios | MMA / IDE Chile | Shapefile | Reemplaza el SHP incompleto registrado en Notion. |
| Establecimientos educacionales | Centro de Estudios MINEDUC | Directorio anual con coordenadas | Convertir a puntos y conservar año del directorio. |
| Caletas pesqueras | Geoportal SUBPESCA | Shapefile ArcGIS | Confirmar si existe una edición posterior al recurso 2020. |
| PRMS | Geoportal MINVU | FeatureServer | Siete capas consultables; sigue siendo una interpretación referencial. |
| Antenas Ley de Torres | SUBTEL | Tabla exportable con coordenadas | Separar antenas en servicio de antenas autorizadas. |
| Infraestructura deportiva | IDE Chile / IND | Capa + directorio | La capa espacial encontrada es de 2014 y requiere contraste. |
| Red vial | Dirección de Vialidad MOP | Descarga / servicio | OSM puede complementar calles urbanas, sin reemplazar la fuente MOP. |
| Áreas pobladas y Censo 2024 | INE | GDB / SHP | Preferir la cartografía censal definitiva. |
| Amenaza de tsunami | SENAPRED / SHOA | Capas y planos | Mantener áreas, vías, puntos de encuentro y CITSU como productos separados. |
| Amenaza volcánica | SERNAGEOMIN / SENAPRED | Mapas por volcán | No se encontró una capa nacional única, homogénea y vigente. |
| ICH y ZCH | Municipalidades / MINVU | IPT por comuna | No validar con una capa nacional antigua o genérica. |

## Fuentes complementarias propuestas

- MINSAL/DEIS: establecimientos de salud vigentes.
- MMA: humedales urbanos declarados.
- CMN / Servicio del Patrimonio: monumentos nacionales y zonas típicas.
- EFE, BCN y OSM: trazados ferroviarios. Las fajas normativas se controlan por separado.
- OpenStreetMap/Geofabrik: POI, calles y equipamientos, con actualización diaria y QA de completitud.
- Overture Maps: huellas de edificaciones por área de interés.
- ESA WorldCover: cobertura de suelo raster a 10 metros.
- WorldPop: población en grilla como complemento, nunca sustituto del INE.

## Automatización prevista

El proceso programado deberá:

1. Consultar cada fuente y detectar su versión o fecha.
2. Descargarla a una carpeta temporal y calcular SHA-256.
3. Normalizar CRS y reparar geometrías sin alterar el original.
4. Cruzar la capa con las 346 comunas objetivo.
5. Registrar presencia, cantidad de elementos, fecha, versión, fuente y huella.
6. Ejecutar QA y publicar solo resultados aprobados.

Las capas normativas descentralizadas —PRC, ICH, ZCH y fajas de afectación— requieren además revisión documental de los actos vigentes.
