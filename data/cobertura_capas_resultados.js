window.COBERTURA_CAPAS_RESULTADOS = {
  "schema_version": 1,
  "generado_en": "2026-08-13T19:15:58+00:00",
  "metodo": "Intersección geométrica capa × comuna; tolerancia de contactos de borde.",
  "limite_comunal": {
    "archivo": "Comunas_SII-Transsa.gpkg",
    "sha256": "152170d993d70ce7ec31a276deae2df00b275d881daa02053734ed4b2a1fb244",
    "registros_origen": 345,
    "geometrias_comunales": 345,
    "comunas_objetivo": 346,
    "comunas_sin_geometria": [
      {
        "region": "Magallanes y de la Antártica Chilena",
        "comuna": "Antártica",
        "codigo_comuna": "12202"
      }
    ],
    "crs_origen": "GEOGCS[\"SIRGAS-Chile 2002\",DATUM[\"SIRGAS-Chile\",SPHEROID[\"GRS 1980\",6378137,298.257222101],AUTHORITY[\"EPSG\",\"1254\"]],PRIMEM[\"Greenwich\",0],UNIT[\"Degree\",0.0174532925199433],AXIS[\"Longitude\",EAST],AXIS[\"Latitude\",NORTH]]",
    "crs_metrico": "EPSG:6933"
  },
  "capas": {
    "Áreas Protegidas": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Scraping AH": {
      "estado": "no_es_capa",
      "comunas": {}
    },
    "Base predios": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Sitios Prioritarios": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Sitios_Prioritarios.shp"
      ],
      "comunas": {}
    },
    "Establecimientos Educacionales": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Transporte Urbano (RED)": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Trips_Transporte.RED.gpkg",
        "trips.txt",
        "stop_times.txt",
        "frequencies.txt",
        "levels.txt",
        "pathways.txt",
        "routes.txt",
        "shapes.txt"
      ],
      "comunas": {}
    },
    "Barrios Transsa": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Barrios-020426_v3.gpkg",
        "Barrios_Transsa_020426.kml"
      ],
      "comunas": {}
    },
    "División Político Regional": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Poligono_regiones.qmd"
      ],
      "comunas": {}
    },
    "División Político Comunal": {
      "estado": "procesada",
      "fuentes": [
        {
          "archivo": "Comunas_SII-Transsa.gpkg",
          "tamano_bytes": 109694976,
          "sha256": "152170d993d70ce7ec31a276deae2df00b275d881daa02053734ed4b2a1fb244",
          "subcapas": [
            "disuelto"
          ]
        }
      ],
      "resumen": {
        "comunas_con_cobertura": 345,
        "comunas_sin_elementos": 0,
        "comunas_sin_limite": 1
      },
      "comunas": {
        "Antofagasta|Antofagasta": {
          "codigo_comuna": "2201",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 30702226242.08,
          "longitud_interseccion_m": 685419.37
        },
        "Antofagasta|Calama": {
          "codigo_comuna": "2301",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 15544690171.2,
          "longitud_interseccion_m": 592693.49
        },
        "Antofagasta|María Elena": {
          "codigo_comuna": "2103",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 12339123486.32,
          "longitud_interseccion_m": 597754.59
        },
        "Antofagasta|Mejillones": {
          "codigo_comuna": "2203",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 3577587830.06,
          "longitud_interseccion_m": 212331.62
        },
        "Antofagasta|Ollagüe": {
          "codigo_comuna": "2302",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 2927633807.2,
          "longitud_interseccion_m": 155090.21
        },
        "Antofagasta|San Pedro De Atacama": {
          "codigo_comuna": "2303",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 23612770953.33,
          "longitud_interseccion_m": 334705.8
        },
        "Antofagasta|Sierra Gorda": {
          "codigo_comuna": "2206",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 12892422699.99,
          "longitud_interseccion_m": 537741.73
        },
        "Antofagasta|Taltal": {
          "codigo_comuna": "2202",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 20424164236.67,
          "longitud_interseccion_m": 507600.0
        },
        "Antofagasta|Tocopilla": {
          "codigo_comuna": "2101",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 4122906497.61,
          "longitud_interseccion_m": 214713.22
        },
        "Arica y Parinacota|Arica": {
          "codigo_comuna": "1101",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 4802217660.49,
          "longitud_interseccion_m": 211083.2
        },
        "Arica y Parinacota|Camarones": {
          "codigo_comuna": "1106",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 3924671983.66,
          "longitud_interseccion_m": 330657.05
        },
        "Arica y Parinacota|General Lagos": {
          "codigo_comuna": "1302",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 2258779051.59,
          "longitud_interseccion_m": 88882.93
        },
        "Arica y Parinacota|Putre": {
          "codigo_comuna": "1301",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 5889803328.07,
          "longitud_interseccion_m": 253375.22
        },
        "Atacama|Alto Del Carmen": {
          "codigo_comuna": "3304",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 6159286294.58,
          "longitud_interseccion_m": 317806.64
        },
        "Atacama|Caldera": {
          "codigo_comuna": "3202",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 3680821036.75,
          "longitud_interseccion_m": 240938.79
        },
        "Atacama|Chañaral": {
          "codigo_comuna": "3101",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 5760876776.0,
          "longitud_interseccion_m": 350519.77
        },
        "Atacama|Copiapó": {
          "codigo_comuna": "3201",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 17792730340.23,
          "longitud_interseccion_m": 972530.58
        },
        "Atacama|Diego De Almagro": {
          "codigo_comuna": "3102",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 18981675883.6,
          "longitud_interseccion_m": 629154.1
        },
        "Atacama|Freirina": {
          "codigo_comuna": "3302",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 3221492530.11,
          "longitud_interseccion_m": 309447.79
        },
        "Atacama|Huasco": {
          "codigo_comuna": "3303",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1601949448.89,
          "longitud_interseccion_m": 196171.39
        },
        "Atacama|Tierra Amarilla": {
          "codigo_comuna": "3203",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 11258480417.5,
          "longitud_interseccion_m": 470740.3
        },
        "Atacama|Vallenar": {
          "codigo_comuna": "3301",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 7228138853.57,
          "longitud_interseccion_m": 631557.87
        },
        "Aysén del General Carlos Ibáñez del Campo|Aysén": {
          "codigo_comuna": "11101",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 29891611868.98,
          "longitud_interseccion_m": 650047.05
        },
        "Aysén del General Carlos Ibáñez del Campo|Chile Chico": {
          "codigo_comuna": "11201",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 5736728942.5,
          "longitud_interseccion_m": 430312.85
        },
        "Aysén del General Carlos Ibáñez del Campo|Cisnes": {
          "codigo_comuna": "11102",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 15421235412.82,
          "longitud_interseccion_m": 528427.89
        },
        "Aysén del General Carlos Ibáñez del Campo|Cochrane": {
          "codigo_comuna": "11301",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 8630263770.61,
          "longitud_interseccion_m": 442535.33
        },
        "Aysén del General Carlos Ibáñez del Campo|Coyhaique": {
          "codigo_comuna": "11401",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 7277060782.2,
          "longitud_interseccion_m": 427704.88
        },
        "Aysén del General Carlos Ibáñez del Campo|Guaitecas": {
          "codigo_comuna": "11104",
          "estado": "con_cobertura",
          "elementos": 1,
          "area_interseccion_m2": 631738507.39,
          "longitud_interseccion_m": 0.0
        },
        "Aysén del General Carlos Ibáñez del Campo|Lago Verde": {
          "codigo_comuna": "11402",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 5436761311.43,
          "longitud_interseccion_m": 259837.7
        },
        "Aysén del General Carlos Ibáñez del Campo|O'Higgins": {
          "codigo_comuna": "11302",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 7784890479.84,
          "longitud_interseccion_m": 269265.88
        },
        "Aysén del General Carlos Ibáñez del Campo|Río Ibánez": {
          "codigo_comuna": "11203",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 6019497234.13,
          "longitud_interseccion_m": 407073.31
        },
        "Aysén del General Carlos Ibáñez del Campo|Tortel": {
          "codigo_comuna": "11303",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 19991119687.93,
          "longitud_interseccion_m": 385496.64
        },
        "Biobío|Alto Bio Bio": {
          "codigo_comuna": "8414",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 2124477633.41,
          "longitud_interseccion_m": 175644.04
        },
        "Biobío|Antuco": {
          "codigo_comuna": "8413",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1957242845.78,
          "longitud_interseccion_m": 230387.92
        },
        "Biobío|Arauco": {
          "codigo_comuna": "8301",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 959903826.12,
          "longitud_interseccion_m": 112821.03
        },
        "Biobío|Cabrero": {
          "codigo_comuna": "8410",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 656672921.11,
          "longitud_interseccion_m": 144297.86
        },
        "Biobío|Cañete": {
          "codigo_comuna": "8305",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1088849686.71,
          "longitud_interseccion_m": 200383.01
        },
        "Biobío|Chiguayante": {
          "codigo_comuna": "8211",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 71399072.63,
          "longitud_interseccion_m": 49434.56
        },
        "Biobío|Concepción": {
          "codigo_comuna": "8201",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 220190844.54,
          "longitud_interseccion_m": 87775.49
        },
        "Biobío|Contulmo": {
          "codigo_comuna": "8306",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 639072459.27,
          "longitud_interseccion_m": 197210.77
        },
        "Biobío|Coronel": {
          "codigo_comuna": "8207",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 281300719.56,
          "longitud_interseccion_m": 65132.12
        },
        "Biobío|Curanilahue": {
          "codigo_comuna": "8302",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1002962133.56,
          "longitud_interseccion_m": 206354.92
        },
        "Biobío|Florida": {
          "codigo_comuna": "8204",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 605753380.12,
          "longitud_interseccion_m": 141238.86
        },
        "Biobío|Hualpén": {
          "codigo_comuna": "8212",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 53780725.69,
          "longitud_interseccion_m": 20635.66
        },
        "Biobío|Hualqui": {
          "codigo_comuna": "8203",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 535803385.6,
          "longitud_interseccion_m": 136206.14
        },
        "Biobío|Laja": {
          "codigo_comuna": "8403",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 345061442.01,
          "longitud_interseccion_m": 79635.3
        },
        "Biobío|Lebu": {
          "codigo_comuna": "8303",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 564578927.83,
          "longitud_interseccion_m": 98531.25
        },
        "Biobío|Los Álamos": {
          "codigo_comuna": "8304",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 600543051.16,
          "longitud_interseccion_m": 181303.03
        },
        "Biobío|Los Ángeles": {
          "codigo_comuna": "8401",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 1748005346.06,
          "longitud_interseccion_m": 260671.68
        },
        "Biobío|Lota": {
          "codigo_comuna": "8208",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 114705297.82,
          "longitud_interseccion_m": 45384.73
        },
        "Biobío|Mulchén": {
          "codigo_comuna": "8407",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1920667834.92,
          "longitud_interseccion_m": 304892.13
        },
        "Biobío|Nacimiento": {
          "codigo_comuna": "8405",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 904418338.88,
          "longitud_interseccion_m": 195182.99
        },
        "Biobío|Negrete": {
          "codigo_comuna": "8406",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 155280888.83,
          "longitud_interseccion_m": 75672.65
        },
        "Biobío|Penco": {
          "codigo_comuna": "8202",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 108371211.07,
          "longitud_interseccion_m": 58863.17
        },
        "Biobío|Quilaco": {
          "codigo_comuna": "8408",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1123972265.97,
          "longitud_interseccion_m": 280919.23
        },
        "Biobío|Quilleco": {
          "codigo_comuna": "8404",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1117800486.62,
          "longitud_interseccion_m": 242637.06
        },
        "Biobío|San Pedro De La Paz": {
          "codigo_comuna": "8210",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 112868543.06,
          "longitud_interseccion_m": 42637.74
        },
        "Biobío|San Rosendo": {
          "codigo_comuna": "8411",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 94434213.49,
          "longitud_interseccion_m": 58686.73
        },
        "Biobío|Santa Bárbara": {
          "codigo_comuna": "8402",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1250939196.36,
          "longitud_interseccion_m": 231827.07
        },
        "Biobío|Santa Juana": {
          "codigo_comuna": "8209",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 777425331.77,
          "longitud_interseccion_m": 170296.98
        },
        "Biobío|Talcahuano": {
          "codigo_comuna": "8206",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 92559468.55,
          "longitud_interseccion_m": 18844.95
        },
        "Biobío|Tirúa": {
          "codigo_comuna": "8307",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 626734003.3,
          "longitud_interseccion_m": 113839.68
        },
        "Biobío|Tomé": {
          "codigo_comuna": "8205",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 494264400.79,
          "longitud_interseccion_m": 90726.75
        },
        "Biobío|Tucapel": {
          "codigo_comuna": "8412",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 913667079.95,
          "longitud_interseccion_m": 175858.7
        },
        "Biobío|Yumbel": {
          "codigo_comuna": "8409",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 726876252.04,
          "longitud_interseccion_m": 176006.43
        },
        "Coquimbo|Andacollo": {
          "codigo_comuna": "4104",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 514252824.91,
          "longitud_interseccion_m": 130195.49
        },
        "Coquimbo|Canela": {
          "codigo_comuna": "4304",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 2195747819.18,
          "longitud_interseccion_m": 224555.45
        },
        "Coquimbo|Combarbalá": {
          "codigo_comuna": "4205",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 2295868374.25,
          "longitud_interseccion_m": 283312.8
        },
        "Coquimbo|Coquimbo": {
          "codigo_comuna": "4103",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1426343214.97,
          "longitud_interseccion_m": 156055.09
        },
        "Coquimbo|Illapel": {
          "codigo_comuna": "4301",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 2629138783.56,
          "longitud_interseccion_m": 323139.74
        },
        "Coquimbo|La Higuera": {
          "codigo_comuna": "4102",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 4165527032.28,
          "longitud_interseccion_m": 355850.07
        },
        "Coquimbo|La Serena": {
          "codigo_comuna": "4101",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1900867843.04,
          "longitud_interseccion_m": 225292.22
        },
        "Coquimbo|Los Vilos": {
          "codigo_comuna": "4303",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1858800814.18,
          "longitud_interseccion_m": 183151.1
        },
        "Coquimbo|Monte Patria": {
          "codigo_comuna": "4203",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 4212318379.5,
          "longitud_interseccion_m": 265318.07
        },
        "Coquimbo|Ovalle": {
          "codigo_comuna": "4201",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 3549114122.38,
          "longitud_interseccion_m": 349238.9
        },
        "Coquimbo|Paihuano": {
          "codigo_comuna": "4106",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 1514194643.66,
          "longitud_interseccion_m": 188614.95
        },
        "Coquimbo|Punitaqui": {
          "codigo_comuna": "4204",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1091952052.33,
          "longitud_interseccion_m": 231720.59
        },
        "Coquimbo|Río Hurtado": {
          "codigo_comuna": "4206",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 2205052658.59,
          "longitud_interseccion_m": 287099.7
        },
        "Coquimbo|Salamanca": {
          "codigo_comuna": "4302",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 3446799313.54,
          "longitud_interseccion_m": 231577.31
        },
        "Coquimbo|Vicuña": {
          "codigo_comuna": "4105",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 7581820600.62,
          "longitud_interseccion_m": 419034.28
        },
        "La Araucanía|Angol": {
          "codigo_comuna": "9101",
          "estado": "con_cobertura",
          "elementos": 10,
          "area_interseccion_m2": 1197155744.36,
          "longitud_interseccion_m": 249344.64
        },
        "La Araucanía|Carahue": {
          "codigo_comuna": "9209",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1337131843.15,
          "longitud_interseccion_m": 220065.04
        },
        "La Araucanía|Chol Chol": {
          "codigo_comuna": "9221",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 427131497.72,
          "longitud_interseccion_m": 118770.76
        },
        "La Araucanía|Collipulli": {
          "codigo_comuna": "9105",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 1305714223.32,
          "longitud_interseccion_m": 272948.95
        },
        "La Araucanía|Cunco": {
          "codigo_comuna": "9204",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 1888711319.78,
          "longitud_interseccion_m": 283515.23
        },
        "La Araucanía|Curacautín": {
          "codigo_comuna": "9110",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 1657588323.36,
          "longitud_interseccion_m": 215186.67
        },
        "La Araucanía|Curarrehue": {
          "codigo_comuna": "9218",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1165657048.11,
          "longitud_interseccion_m": 122515.7
        },
        "La Araucanía|Ercilla": {
          "codigo_comuna": "9106",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 498647576.7,
          "longitud_interseccion_m": 172062.63
        },
        "La Araucanía|Freire": {
          "codigo_comuna": "9203",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 869831666.84,
          "longitud_interseccion_m": 193735.81
        },
        "La Araucanía|Galvarino": {
          "codigo_comuna": "9207",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 567794128.8,
          "longitud_interseccion_m": 141535.53
        },
        "La Araucanía|Gorbea": {
          "codigo_comuna": "9212",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 690290569.55,
          "longitud_interseccion_m": 167449.98
        },
        "La Araucanía|Lautaro": {
          "codigo_comuna": "9205",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 905763360.82,
          "longitud_interseccion_m": 234556.7
        },
        "La Araucanía|Loncoche": {
          "codigo_comuna": "9214",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 971009662.69,
          "longitud_interseccion_m": 225765.44
        },
        "La Araucanía|Lonquimay": {
          "codigo_comuna": "9111",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 3928299127.36,
          "longitud_interseccion_m": 203647.14
        },
        "La Araucanía|Los Sauces": {
          "codigo_comuna": "9103",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 847972290.18,
          "longitud_interseccion_m": 165680.94
        },
        "La Araucanía|Lumaco": {
          "codigo_comuna": "9108",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 1110063056.38,
          "longitud_interseccion_m": 225677.2
        },
        "La Araucanía|Melipeuco": {
          "codigo_comuna": "9217",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1106747770.88,
          "longitud_interseccion_m": 163013.07
        },
        "La Araucanía|Nueva Imperial": {
          "codigo_comuna": "9208",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 730756264.31,
          "longitud_interseccion_m": 176928.37
        },
        "La Araucanía|Padre las Casas": {
          "codigo_comuna": "9220",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 463681941.46,
          "longitud_interseccion_m": 176109.34
        },
        "La Araucanía|Perquenco": {
          "codigo_comuna": "9206",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 330887937.43,
          "longitud_interseccion_m": 114019.07
        },
        "La Araucanía|Pitrufquén": {
          "codigo_comuna": "9211",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 583129858.65,
          "longitud_interseccion_m": 209391.21
        },
        "La Araucanía|Pucón": {
          "codigo_comuna": "9216",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1247274311.69,
          "longitud_interseccion_m": 212350.8
        },
        "La Araucanía|Purén": {
          "codigo_comuna": "9102",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 463992025.03,
          "longitud_interseccion_m": 135672.55
        },
        "La Araucanía|Renaico": {
          "codigo_comuna": "9104",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 265399624.76,
          "longitud_interseccion_m": 111387.95
        },
        "La Araucanía|Saavedra": {
          "codigo_comuna": "9210",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 398450886.72,
          "longitud_interseccion_m": 80171.73
        },
        "La Araucanía|Temuco": {
          "codigo_comuna": "9201",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 466784521.18,
          "longitud_interseccion_m": 116461.03
        },
        "La Araucanía|Teodoro Schmidt": {
          "codigo_comuna": "9219",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 656263403.63,
          "longitud_interseccion_m": 129694.3
        },
        "La Araucanía|Toltén": {
          "codigo_comuna": "9213",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 851891079.3,
          "longitud_interseccion_m": 138667.44
        },
        "La Araucanía|Traiguén": {
          "codigo_comuna": "9107",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 896854613.05,
          "longitud_interseccion_m": 189212.94
        },
        "La Araucanía|Victoria": {
          "codigo_comuna": "9109",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1261776857.34,
          "longitud_interseccion_m": 196796.94
        },
        "La Araucanía|Vilcún": {
          "codigo_comuna": "9202",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1415406952.36,
          "longitud_interseccion_m": 267212.36
        },
        "La Araucanía|Villarrica": {
          "codigo_comuna": "9215",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1291818113.74,
          "longitud_interseccion_m": 244976.39
        },
        "Libertador General Bernardo O'Higgins|Chimbarongo": {
          "codigo_comuna": "6202",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 508762004.43,
          "longitud_interseccion_m": 124913.48
        },
        "Libertador General Bernardo O'Higgins|Chépica": {
          "codigo_comuna": "6209",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 477199102.3,
          "longitud_interseccion_m": 149781.36
        },
        "Libertador General Bernardo O'Higgins|Codegua": {
          "codigo_comuna": "6107",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 284235291.17,
          "longitud_interseccion_m": 125596.68
        },
        "Libertador General Bernardo O'Higgins|Coinco": {
          "codigo_comuna": "6116",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 97340138.24,
          "longitud_interseccion_m": 62841.44
        },
        "Libertador General Bernardo O'Higgins|Coltauco": {
          "codigo_comuna": "6106",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 221899877.49,
          "longitud_interseccion_m": 89440.43
        },
        "Libertador General Bernardo O'Higgins|Doñihue": {
          "codigo_comuna": "6105",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 80567305.92,
          "longitud_interseccion_m": 46189.4
        },
        "Libertador General Bernardo O'Higgins|Graneros": {
          "codigo_comuna": "6103",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 112466264.21,
          "longitud_interseccion_m": 56077.16
        },
        "Libertador General Bernardo O'Higgins|La Estrella": {
          "codigo_comuna": "6304",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 430723139.54,
          "longitud_interseccion_m": 121990.83
        },
        "Libertador General Bernardo O'Higgins|Las Cabras": {
          "codigo_comuna": "6109",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 750992704.49,
          "longitud_interseccion_m": 158391.89
        },
        "Libertador General Bernardo O'Higgins|Litueche": {
          "codigo_comuna": "6303",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 619419581.22,
          "longitud_interseccion_m": 173843.02
        },
        "Libertador General Bernardo O'Higgins|Lolol": {
          "codigo_comuna": "6206",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 596687746.05,
          "longitud_interseccion_m": 146501.2
        },
        "Libertador General Bernardo O'Higgins|Machalí": {
          "codigo_comuna": "6102",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 2594254822.44,
          "longitud_interseccion_m": 223490.82
        },
        "Libertador General Bernardo O'Higgins|Malloa": {
          "codigo_comuna": "6115",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 220610360.83,
          "longitud_interseccion_m": 111579.55
        },
        "Libertador General Bernardo O'Higgins|Marchihue": {
          "codigo_comuna": "6305",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 657584749.95,
          "longitud_interseccion_m": 164480.99
        },
        "Libertador General Bernardo O'Higgins|Mostazal": {
          "codigo_comuna": "6104",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 525887273.71,
          "longitud_interseccion_m": 125708.96
        },
        "Libertador General Bernardo O'Higgins|Nancagua": {
          "codigo_comuna": "6203",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 151660185.9,
          "longitud_interseccion_m": 73833.88
        },
        "Libertador General Bernardo O'Higgins|Navidad": {
          "codigo_comuna": "6302",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 301103216.41,
          "longitud_interseccion_m": 66272.45
        },
        "Libertador General Bernardo O'Higgins|Olivar": {
          "codigo_comuna": "6114",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 44228333.1,
          "longitud_interseccion_m": 39916.77
        },
        "Libertador General Bernardo O'Higgins|Palmilla": {
          "codigo_comuna": "6207",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 235585686.47,
          "longitud_interseccion_m": 85941.23
        },
        "Libertador General Bernardo O'Higgins|Paredones": {
          "codigo_comuna": "6306",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 572502165.61,
          "longitud_interseccion_m": 119182.12
        },
        "Libertador General Bernardo O'Higgins|Peralillo": {
          "codigo_comuna": "6208",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 282966494.4,
          "longitud_interseccion_m": 95996.2
        },
        "Libertador General Bernardo O'Higgins|Peumo": {
          "codigo_comuna": "6108",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 155168599.57,
          "longitud_interseccion_m": 63688.48
        },
        "Libertador General Bernardo O'Higgins|Pichidegua": {
          "codigo_comuna": "6111",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 319400414.35,
          "longitud_interseccion_m": 108524.62
        },
        "Libertador General Bernardo O'Higgins|Pichilemu": {
          "codigo_comuna": "6301",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 714756447.52,
          "longitud_interseccion_m": 129327.6
        },
        "Libertador General Bernardo O'Higgins|Placilla": {
          "codigo_comuna": "6204",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 144274774.72,
          "longitud_interseccion_m": 55049.08
        },
        "Libertador General Bernardo O'Higgins|Pumanque": {
          "codigo_comuna": "6214",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 441053459.65,
          "longitud_interseccion_m": 110719.32
        },
        "Libertador General Bernardo O'Higgins|Quinta De Tilcoco": {
          "codigo_comuna": "6117",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 86749340.54,
          "longitud_interseccion_m": 46437.97
        },
        "Libertador General Bernardo O'Higgins|Rancagua": {
          "codigo_comuna": "6101",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 260967983.39,
          "longitud_interseccion_m": 81270.87
        },
        "Libertador General Bernardo O'Higgins|Rengo": {
          "codigo_comuna": "6112",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 585261472.01,
          "longitud_interseccion_m": 169181.75
        },
        "Libertador General Bernardo O'Higgins|Requínoa": {
          "codigo_comuna": "6113",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 677255061.21,
          "longitud_interseccion_m": 140475.91
        },
        "Libertador General Bernardo O'Higgins|San Fernando": {
          "codigo_comuna": "6201",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 2321841113.81,
          "longitud_interseccion_m": 223152.49
        },
        "Libertador General Bernardo O'Higgins|San Vicente": {
          "codigo_comuna": "6110",
          "estado": "con_cobertura",
          "elementos": 12,
          "area_interseccion_m2": 484702858.28,
          "longitud_interseccion_m": 123409.28
        },
        "Libertador General Bernardo O'Higgins|Santa Cruz": {
          "codigo_comuna": "6205",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 393273534.13,
          "longitud_interseccion_m": 127382.71
        },
        "Los Lagos|Ancud": {
          "codigo_comuna": "10406",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 1755525627.03,
          "longitud_interseccion_m": 146064.57
        },
        "Los Lagos|Calbuco": {
          "codigo_comuna": "10309",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 587525184.26,
          "longitud_interseccion_m": 71228.5
        },
        "Los Lagos|Castro": {
          "codigo_comuna": "10401",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 471628063.95,
          "longitud_interseccion_m": 113712.75
        },
        "Los Lagos|Chaitén": {
          "codigo_comuna": "10501",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 8254080310.91,
          "longitud_interseccion_m": 305194.49
        },
        "Los Lagos|Chonchi": {
          "codigo_comuna": "10402",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1361927217.44,
          "longitud_interseccion_m": 117499.15
        },
        "Los Lagos|Cochamó": {
          "codigo_comuna": "10302",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 3977987170.72,
          "longitud_interseccion_m": 249233.48
        },
        "Los Lagos|Curaco de Vélez": {
          "codigo_comuna": "10410",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 79887468.41,
          "longitud_interseccion_m": 3792.36
        },
        "Los Lagos|Dalcahue": {
          "codigo_comuna": "10408",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1229916154.8,
          "longitud_interseccion_m": 197915.29
        },
        "Los Lagos|Fresia": {
          "codigo_comuna": "10304",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1276200421.94,
          "longitud_interseccion_m": 210256.03
        },
        "Los Lagos|Frutillar": {
          "codigo_comuna": "10305",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 828384332.35,
          "longitud_interseccion_m": 160767.72
        },
        "Los Lagos|Futaleufú": {
          "codigo_comuna": "10503",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 1235677484.02,
          "longitud_interseccion_m": 107600.86
        },
        "Los Lagos|Hualaihué": {
          "codigo_comuna": "10502",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 2833198990.68,
          "longitud_interseccion_m": 171755.41
        },
        "Los Lagos|Llanquihue": {
          "codigo_comuna": "10306",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 433100555.08,
          "longitud_interseccion_m": 127150.37
        },
        "Los Lagos|Los Muermos": {
          "codigo_comuna": "10308",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1230176082.12,
          "longitud_interseccion_m": 182061.06
        },
        "Los Lagos|Maullín": {
          "codigo_comuna": "10307",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 823302303.04,
          "longitud_interseccion_m": 105194.0
        },
        "Los Lagos|Osorno": {
          "codigo_comuna": "10201",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 954713488.02,
          "longitud_interseccion_m": 254106.49
        },
        "Los Lagos|Palena": {
          "codigo_comuna": "10504",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 2654230207.29,
          "longitud_interseccion_m": 240240.9
        },
        "Los Lagos|Puerto Montt": {
          "codigo_comuna": "10301",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1670272094.75,
          "longitud_interseccion_m": 247075.12
        },
        "Los Lagos|Puerto Octay": {
          "codigo_comuna": "10203",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1793398588.47,
          "longitud_interseccion_m": 295029.12
        },
        "Los Lagos|Puerto Varas": {
          "codigo_comuna": "10303",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 4027164556.47,
          "longitud_interseccion_m": 423458.72
        },
        "Los Lagos|Puqueldón": {
          "codigo_comuna": "10405",
          "estado": "con_cobertura",
          "elementos": 1,
          "area_interseccion_m2": 96625298.65,
          "longitud_interseccion_m": 0.0
        },
        "Los Lagos|Purranque": {
          "codigo_comuna": "10206",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1452122638.34,
          "longitud_interseccion_m": 292992.68
        },
        "Los Lagos|Puyehue": {
          "codigo_comuna": "10204",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1634782531.44,
          "longitud_interseccion_m": 282698.64
        },
        "Los Lagos|Queilén": {
          "codigo_comuna": "10403",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 331035893.99,
          "longitud_interseccion_m": 20713.52
        },
        "Los Lagos|Quellón": {
          "codigo_comuna": "10404",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 3362399091.18,
          "longitud_interseccion_m": 53828.42
        },
        "Los Lagos|Quemchi": {
          "codigo_comuna": "10407",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 438462204.5,
          "longitud_interseccion_m": 65880.42
        },
        "Los Lagos|Quinchao": {
          "codigo_comuna": "10415",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 158782071.78,
          "longitud_interseccion_m": 3792.36
        },
        "Los Lagos|Río Negro": {
          "codigo_comuna": "10205",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1281478495.19,
          "longitud_interseccion_m": 265072.41
        },
        "Los Lagos|San Juan de la Costa": {
          "codigo_comuna": "10207",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1506661116.38,
          "longitud_interseccion_m": 180752.7
        },
        "Los Lagos|San Pablo": {
          "codigo_comuna": "10202",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 630060278.34,
          "longitud_interseccion_m": 184993.29
        },
        "Los Ríos|Corral": {
          "codigo_comuna": "10106",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 729650369.46,
          "longitud_interseccion_m": 128694.34
        },
        "Los Ríos|Futrono": {
          "codigo_comuna": "10105",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 2089331454.07,
          "longitud_interseccion_m": 265231.95
        },
        "Los Ríos|La Unión": {
          "codigo_comuna": "10109",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 2131711174.7,
          "longitud_interseccion_m": 330638.59
        },
        "Los Ríos|Lago Ranco": {
          "codigo_comuna": "10112",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1763273946.32,
          "longitud_interseccion_m": 246384.34
        },
        "Los Ríos|Lanco": {
          "codigo_comuna": "10103",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 532915298.97,
          "longitud_interseccion_m": 154918.67
        },
        "Los Ríos|Los Lagos": {
          "codigo_comuna": "10104",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1788319932.93,
          "longitud_interseccion_m": 319536.1
        },
        "Los Ríos|Mariquina": {
          "codigo_comuna": "10102",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1319329283.03,
          "longitud_interseccion_m": 230118.41
        },
        "Los Ríos|Máfil": {
          "codigo_comuna": "10107",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 579131521.74,
          "longitud_interseccion_m": 181726.42
        },
        "Los Ríos|Paillaco": {
          "codigo_comuna": "10110",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 901539250.09,
          "longitud_interseccion_m": 209529.25
        },
        "Los Ríos|Panguipulli": {
          "codigo_comuna": "10108",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 3294605156.42,
          "longitud_interseccion_m": 276509.68
        },
        "Los Ríos|Río Bueno": {
          "codigo_comuna": "10111",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 2171649942.88,
          "longitud_interseccion_m": 346030.59
        },
        "Los Ríos|Valdivia": {
          "codigo_comuna": "10101",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1018520672.75,
          "longitud_interseccion_m": 162330.54
        },
        "Magallanes y de la Antártica Chilena|Cabo de Hornos": {
          "codigo_comuna": "12401",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 15729961891.72,
          "longitud_interseccion_m": 293086.11
        },
        "Magallanes y de la Antártica Chilena|Laguna Blanca": {
          "codigo_comuna": "12206",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 3568079762.67,
          "longitud_interseccion_m": 213527.65
        },
        "Magallanes y de la Antártica Chilena|Natales": {
          "codigo_comuna": "12101",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 48968288115.59,
          "longitud_interseccion_m": 379771.01
        },
        "Magallanes y de la Antártica Chilena|Porvenir": {
          "codigo_comuna": "12301",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 7462676960.02,
          "longitud_interseccion_m": 277493.68
        },
        "Magallanes y de la Antártica Chilena|Primavera": {
          "codigo_comuna": "12302",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 3949419849.7,
          "longitud_interseccion_m": 155867.5
        },
        "Magallanes y de la Antártica Chilena|Punta Arenas": {
          "codigo_comuna": "12205",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 17766771177.78,
          "longitud_interseccion_m": 64708.55
        },
        "Magallanes y de la Antártica Chilena|Río Verde": {
          "codigo_comuna": "12202",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 9148033857.42,
          "longitud_interseccion_m": 161538.72
        },
        "Magallanes y de la Antártica Chilena|San Gregorio": {
          "codigo_comuna": "12204",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 6710636421.72,
          "longitud_interseccion_m": 77137.94
        },
        "Magallanes y de la Antártica Chilena|Timaukel": {
          "codigo_comuna": "12304",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 11020099283.31,
          "longitud_interseccion_m": 414712.29
        },
        "Magallanes y de la Antártica Chilena|Torres Del Paine": {
          "codigo_comuna": "12103",
          "estado": "con_cobertura",
          "elementos": 2,
          "area_interseccion_m2": 6216329120.62,
          "longitud_interseccion_m": 179251.79
        },
        "Maule|Cauquenes": {
          "codigo_comuna": "7401",
          "estado": "con_cobertura",
          "elementos": 12,
          "area_interseccion_m2": 2124542136.85,
          "longitud_interseccion_m": 303167.3
        },
        "Maule|Chanco": {
          "codigo_comuna": "7403",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 527762079.08,
          "longitud_interseccion_m": 112489.09
        },
        "Maule|Colbún": {
          "codigo_comuna": "7303",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 2926994582.15,
          "longitud_interseccion_m": 337509.52
        },
        "Maule|Constitución": {
          "codigo_comuna": "7208",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1338655554.74,
          "longitud_interseccion_m": 151990.55
        },
        "Maule|Curepto": {
          "codigo_comuna": "7207",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1070058255.69,
          "longitud_interseccion_m": 176645.39
        },
        "Maule|Curicó": {
          "codigo_comuna": "7101",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1335262623.03,
          "longitud_interseccion_m": 267692.28
        },
        "Maule|Empedrado": {
          "codigo_comuna": "7209",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 565111997.45,
          "longitud_interseccion_m": 140295.41
        },
        "Maule|Hualañé": {
          "codigo_comuna": "7107",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 628668633.61,
          "longitud_interseccion_m": 179879.2
        },
        "Maule|Licantén": {
          "codigo_comuna": "7105",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 272744670.29,
          "longitud_interseccion_m": 102201.25
        },
        "Maule|Linares": {
          "codigo_comuna": "7301",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1466181234.58,
          "longitud_interseccion_m": 291204.52
        },
        "Maule|Longaví": {
          "codigo_comuna": "7304",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1452788490.16,
          "longitud_interseccion_m": 268365.83
        },
        "Maule|Maule": {
          "codigo_comuna": "7206",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 242884938.32,
          "longitud_interseccion_m": 84080.23
        },
        "Maule|Molina": {
          "codigo_comuna": "7108",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1517389819.73,
          "longitud_interseccion_m": 334972.96
        },
        "Maule|Parral": {
          "codigo_comuna": "7305",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1637959305.07,
          "longitud_interseccion_m": 348764.97
        },
        "Maule|Pelarco": {
          "codigo_comuna": "7203",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 330874535.44,
          "longitud_interseccion_m": 114114.1
        },
        "Maule|Pelluhue": {
          "codigo_comuna": "7402",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 369363989.89,
          "longitud_interseccion_m": 86979.33
        },
        "Maule|Pencahue": {
          "codigo_comuna": "7205",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 955133667.47,
          "longitud_interseccion_m": 176308.01
        },
        "Maule|Rauco": {
          "codigo_comuna": "7104",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 306605303.44,
          "longitud_interseccion_m": 140276.55
        },
        "Maule|Retiro": {
          "codigo_comuna": "7306",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 826609393.93,
          "longitud_interseccion_m": 198716.66
        },
        "Maule|Romeral": {
          "codigo_comuna": "7103",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1603352005.12,
          "longitud_interseccion_m": 213230.96
        },
        "Maule|Río Claro": {
          "codigo_comuna": "7204",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 433486066.4,
          "longitud_interseccion_m": 144464.74
        },
        "Maule|Sagrada Familia": {
          "codigo_comuna": "7109",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 554155808.48,
          "longitud_interseccion_m": 135168.05
        },
        "Maule|San Clemente": {
          "codigo_comuna": "7202",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 4501047217.25,
          "longitud_interseccion_m": 346969.47
        },
        "Maule|San Javier": {
          "codigo_comuna": "7310",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 1311359357.74,
          "longitud_interseccion_m": 222174.33
        },
        "Maule|San Rafael": {
          "codigo_comuna": "7210",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 262880608.49,
          "longitud_interseccion_m": 96767.34
        },
        "Maule|Talca": {
          "codigo_comuna": "7201",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 231915124.58,
          "longitud_interseccion_m": 83578.08
        },
        "Maule|Teno": {
          "codigo_comuna": "7102",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 618439142.2,
          "longitud_interseccion_m": 172191.82
        },
        "Maule|Vichuquén": {
          "codigo_comuna": "7106",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 451505457.38,
          "longitud_interseccion_m": 92643.44
        },
        "Maule|Villa Alegre": {
          "codigo_comuna": "7309",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 188594631.86,
          "longitud_interseccion_m": 74214.37
        },
        "Maule|Yerbas Buenas": {
          "codigo_comuna": "7302",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 258851100.85,
          "longitud_interseccion_m": 89791.3
        },
        "Metropolitana de Santiago|Alhué": {
          "codigo_comuna": "14605",
          "estado": "con_cobertura",
          "elementos": 10,
          "area_interseccion_m2": 844327089.87,
          "longitud_interseccion_m": 156791.77
        },
        "Metropolitana de Santiago|Buin": {
          "codigo_comuna": "16403",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 217062909.56,
          "longitud_interseccion_m": 90627.4
        },
        "Metropolitana de Santiago|Calera De Tango": {
          "codigo_comuna": "16402",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 73118007.44,
          "longitud_interseccion_m": 44581.57
        },
        "Metropolitana de Santiago|Cerrillos": {
          "codigo_comuna": "14166",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 16820678.69,
          "longitud_interseccion_m": 20678.07
        },
        "Metropolitana de Santiago|Cerro Navia": {
          "codigo_comuna": "14156",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 11053738.72,
          "longitud_interseccion_m": 16749.59
        },
        "Metropolitana de Santiago|Colina": {
          "codigo_comuna": "14201",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 971089786.28,
          "longitud_interseccion_m": 171065.15
        },
        "Metropolitana de Santiago|Conchalí": {
          "codigo_comuna": "14127",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 10941066.89,
          "longitud_interseccion_m": 13746.49
        },
        "Metropolitana de Santiago|Curacaví": {
          "codigo_comuna": "14603",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 694013748.59,
          "longitud_interseccion_m": 153719.89
        },
        "Metropolitana de Santiago|El Bosque": {
          "codigo_comuna": "16165",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 14254736.77,
          "longitud_interseccion_m": 15304.1
        },
        "Metropolitana de Santiago|El Monte": {
          "codigo_comuna": "14503",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 115964449.23,
          "longitud_interseccion_m": 50574.05
        },
        "Metropolitana de Santiago|Estación Central": {
          "codigo_comuna": "14157",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 14377857.22,
          "longitud_interseccion_m": 12559.66
        },
        "Metropolitana de Santiago|Huechuraba": {
          "codigo_comuna": "14158",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 44987123.32,
          "longitud_interseccion_m": 32468.08
        },
        "Metropolitana de Santiago|Independencia": {
          "codigo_comuna": "13167",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 7355772.8,
          "longitud_interseccion_m": 9380.87
        },
        "Metropolitana de Santiago|Isla De Maipo": {
          "codigo_comuna": "14502",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 189617886.06,
          "longitud_interseccion_m": 82474.61
        },
        "Metropolitana de Santiago|La Cisterna": {
          "codigo_comuna": "16110",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 10010007.72,
          "longitud_interseccion_m": 12800.08
        },
        "Metropolitana de Santiago|La Florida": {
          "codigo_comuna": "15128",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 71057811.49,
          "longitud_interseccion_m": 50670.03
        },
        "Metropolitana de Santiago|La Granja": {
          "codigo_comuna": "16131",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 10053148.94,
          "longitud_interseccion_m": 13862.57
        },
        "Metropolitana de Santiago|La Pintana": {
          "codigo_comuna": "16154",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 30475003.89,
          "longitud_interseccion_m": 26339.63
        },
        "Metropolitana de Santiago|La Reina": {
          "codigo_comuna": "15132",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 23392328.8,
          "longitud_interseccion_m": 24051.67
        },
        "Metropolitana de Santiago|Lampa": {
          "codigo_comuna": "14202",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 449537546.11,
          "longitud_interseccion_m": 105279.42
        },
        "Metropolitana de Santiago|Las Condes": {
          "codigo_comuna": "15108",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 99092143.86,
          "longitud_interseccion_m": 51719.03
        },
        "Metropolitana de Santiago|Lo Barnechea": {
          "codigo_comuna": "15161",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1024022277.95,
          "longitud_interseccion_m": 149342.26
        },
        "Metropolitana de Santiago|Lo Espejo": {
          "codigo_comuna": "16164",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 8255010.77,
          "longitud_interseccion_m": 11404.73
        },
        "Metropolitana de Santiago|Lo Prado": {
          "codigo_comuna": "14155",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 6543897.22,
          "longitud_interseccion_m": 10748.0
        },
        "Metropolitana de Santiago|Macul": {
          "codigo_comuna": "15151",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 12812168.91,
          "longitud_interseccion_m": 15225.82
        },
        "Metropolitana de Santiago|Maipú": {
          "codigo_comuna": "14109",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 136810445.1,
          "longitud_interseccion_m": 62081.51
        },
        "Metropolitana de Santiago|María Pinto": {
          "codigo_comuna": "14602",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 394204806.47,
          "longitud_interseccion_m": 109534.11
        },
        "Metropolitana de Santiago|Melipilla": {
          "codigo_comuna": "14601",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 1352352485.1,
          "longitud_interseccion_m": 234314.32
        },
        "Metropolitana de Santiago|Padre Hurtado": {
          "codigo_comuna": "14505",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 80686929.21,
          "longitud_interseccion_m": 51085.87
        },
        "Metropolitana de Santiago|Paine": {
          "codigo_comuna": "16404",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 677620586.64,
          "longitud_interseccion_m": 164081.27
        },
        "Metropolitana de Santiago|Pedro Aguirre Cerda": {
          "codigo_comuna": "16162",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 8731551.12,
          "longitud_interseccion_m": 10050.39
        },
        "Metropolitana de Santiago|Peñaflor": {
          "codigo_comuna": "14504",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 69490706.31,
          "longitud_interseccion_m": 40117.45
        },
        "Metropolitana de Santiago|Peñalolén": {
          "codigo_comuna": "15152",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 53903934.07,
          "longitud_interseccion_m": 37569.66
        },
        "Metropolitana de Santiago|Pirque": {
          "codigo_comuna": "16302",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 444846437.83,
          "longitud_interseccion_m": 103898.15
        },
        "Metropolitana de Santiago|Providencia": {
          "codigo_comuna": "15103",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 14447747.38,
          "longitud_interseccion_m": 16093.99
        },
        "Metropolitana de Santiago|Pudahuel": {
          "codigo_comuna": "14111",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 198580528.11,
          "longitud_interseccion_m": 71982.24
        },
        "Metropolitana de Santiago|Puente Alto": {
          "codigo_comuna": "16301",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 88411363.32,
          "longitud_interseccion_m": 49732.44
        },
        "Metropolitana de Santiago|Quilicura": {
          "codigo_comuna": "14114",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 57327025.23,
          "longitud_interseccion_m": 35106.17
        },
        "Metropolitana de Santiago|Quinta Normal": {
          "codigo_comuna": "14107",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 11805546.18,
          "longitud_interseccion_m": 13197.33
        },
        "Metropolitana de Santiago|Recoleta": {
          "codigo_comuna": "13159",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 15614484.96,
          "longitud_interseccion_m": 18284.61
        },
        "Metropolitana de Santiago|Renca": {
          "codigo_comuna": "14113",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 23684829.32,
          "longitud_interseccion_m": 29018.99
        },
        "Metropolitana de Santiago|San Bernardo": {
          "codigo_comuna": "16401",
          "estado": "con_cobertura",
          "elementos": 13,
          "area_interseccion_m2": 153872637.85,
          "longitud_interseccion_m": 87140.84
        },
        "Metropolitana de Santiago|San Joaquín": {
          "codigo_comuna": "16163",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 9939282.9,
          "longitud_interseccion_m": 12015.96
        },
        "Metropolitana de Santiago|San José de Maipo": {
          "codigo_comuna": "16303",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 4984742369.38,
          "longitud_interseccion_m": 241958.53
        },
        "Metropolitana de Santiago|San Miguel": {
          "codigo_comuna": "16106",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 9630457.83,
          "longitud_interseccion_m": 11962.55
        },
        "Metropolitana de Santiago|San Pedro": {
          "codigo_comuna": "14604",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 786536275.44,
          "longitud_interseccion_m": 163928.89
        },
        "Metropolitana de Santiago|San Ramón": {
          "codigo_comuna": "16153",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 6315779.59,
          "longitud_interseccion_m": 11574.25
        },
        "Metropolitana de Santiago|Santiago": {
          "codigo_comuna": "13101",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 23175767.12,
          "longitud_interseccion_m": 3226.23
        },
        "Metropolitana de Santiago|Talagante": {
          "codigo_comuna": "14501",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 125229837.79,
          "longitud_interseccion_m": 70324.55
        },
        "Metropolitana de Santiago|Til Til": {
          "codigo_comuna": "14203",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 654679602.4,
          "longitud_interseccion_m": 134075.56
        },
        "Metropolitana de Santiago|Vitacura": {
          "codigo_comuna": "15160",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 28598673.22,
          "longitud_interseccion_m": 25634.73
        },
        "Metropolitana de Santiago|Ñuñoa": {
          "codigo_comuna": "15105",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 16902656.3,
          "longitud_interseccion_m": 15579.18
        },
        "Tarapacá|Alto Hospicio": {
          "codigo_comuna": "1211",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 571473546.07,
          "longitud_interseccion_m": 104548.86
        },
        "Tarapacá|Camiña": {
          "codigo_comuna": "1208",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 2201454910.43,
          "longitud_interseccion_m": 232220.43
        },
        "Tarapacá|Colchane": {
          "codigo_comuna": "1210",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 4010997402.76,
          "longitud_interseccion_m": 190461.42
        },
        "Tarapacá|Huara": {
          "codigo_comuna": "1206",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 10479162383.71,
          "longitud_interseccion_m": 517529.15
        },
        "Tarapacá|Iquique": {
          "codigo_comuna": "1201",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 2290770051.51,
          "longitud_interseccion_m": 196331.13
        },
        "Tarapacá|Pica": {
          "codigo_comuna": "1203",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 8989515763.91,
          "longitud_interseccion_m": 433824.5
        },
        "Tarapacá|Pozo Almonte": {
          "codigo_comuna": "1204",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 13775444583.69,
          "longitud_interseccion_m": 728354.57
        },
        "Valparaíso|Algarrobo": {
          "codigo_comuna": "5406",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 176173220.84,
          "longitud_interseccion_m": 55383.4
        },
        "Valparaíso|Cabildo": {
          "codigo_comuna": "5203",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1455099578.04,
          "longitud_interseccion_m": 256176.06
        },
        "Valparaíso|Calera": {
          "codigo_comuna": "5504",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 59978132.63,
          "longitud_interseccion_m": 56827.54
        },
        "Valparaíso|Calle Larga": {
          "codigo_comuna": "5702",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 321327570.75,
          "longitud_interseccion_m": 100993.51
        },
        "Valparaíso|Cartagena": {
          "codigo_comuna": "5403",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 243745301.58,
          "longitud_interseccion_m": 87997.45
        },
        "Valparaíso|Casablanca": {
          "codigo_comuna": "5305",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 954406998.22,
          "longitud_interseccion_m": 182051.77
        },
        "Valparaíso|Catemu": {
          "codigo_comuna": "5603",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 362166264.17,
          "longitud_interseccion_m": 95775.81
        },
        "Valparaíso|Concón": {
          "codigo_comuna": "5309",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 76894776.21,
          "longitud_interseccion_m": 39906.49
        },
        "Valparaíso|El Quisco": {
          "codigo_comuna": "5405",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 51404875.02,
          "longitud_interseccion_m": 28203.73
        },
        "Valparaíso|El Tabo": {
          "codigo_comuna": "5404",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 99498448.95,
          "longitud_interseccion_m": 47897.41
        },
        "Valparaíso|Hijuelas": {
          "codigo_comuna": "5503",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 268117718.74,
          "longitud_interseccion_m": 91587.41
        },
        "Valparaíso|Isla De Pascua": {
          "codigo_comuna": "5101",
          "estado": "con_cobertura",
          "elementos": 1,
          "area_interseccion_m2": 163852118.88,
          "longitud_interseccion_m": 0.0
        },
        "Valparaíso|Juan Fernández": {
          "codigo_comuna": "5308",
          "estado": "con_cobertura",
          "elementos": 1,
          "area_interseccion_m2": 110584052.86,
          "longitud_interseccion_m": 0.0
        },
        "Valparaíso|La Cruz": {
          "codigo_comuna": "5505",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 77840098.13,
          "longitud_interseccion_m": 49065.34
        },
        "Valparaíso|La Ligua": {
          "codigo_comuna": "5201",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1163748086.95,
          "longitud_interseccion_m": 174323.45
        },
        "Valparaíso|Limache": {
          "codigo_comuna": "5506",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 294780707.46,
          "longitud_interseccion_m": 119900.28
        },
        "Valparaíso|Llaillay": {
          "codigo_comuna": "5606",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 348845423.59,
          "longitud_interseccion_m": 99751.76
        },
        "Valparaíso|Los Andes": {
          "codigo_comuna": "5701",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 1234585396.09,
          "longitud_interseccion_m": 179880.37
        },
        "Valparaíso|Nogales": {
          "codigo_comuna": "5502",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 405409887.28,
          "longitud_interseccion_m": 105379.06
        },
        "Valparaíso|Olmué": {
          "codigo_comuna": "5507",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 231283110.02,
          "longitud_interseccion_m": 71011.19
        },
        "Valparaíso|Panquehue": {
          "codigo_comuna": "5602",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 120354209.9,
          "longitud_interseccion_m": 57625.14
        },
        "Valparaíso|Papudo": {
          "codigo_comuna": "5205",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 166137458.04,
          "longitud_interseccion_m": 50316.44
        },
        "Valparaíso|Petorca": {
          "codigo_comuna": "5202",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1515777595.74,
          "longitud_interseccion_m": 221097.29
        },
        "Valparaíso|Puchuncaví": {
          "codigo_comuna": "5307",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 299354011.88,
          "longitud_interseccion_m": 81139.94
        },
        "Valparaíso|Putaendo": {
          "codigo_comuna": "5604",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 1451579228.75,
          "longitud_interseccion_m": 200751.61
        },
        "Valparaíso|Quillota": {
          "codigo_comuna": "5501",
          "estado": "con_cobertura",
          "elementos": 9,
          "area_interseccion_m2": 301140928.28,
          "longitud_interseccion_m": 90828.66
        },
        "Valparaíso|Quilpué": {
          "codigo_comuna": "5304",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 536318221.95,
          "longitud_interseccion_m": 164067.05
        },
        "Valparaíso|Quintero": {
          "codigo_comuna": "5306",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 146024442.8,
          "longitud_interseccion_m": 46917.34
        },
        "Valparaíso|Rinconada": {
          "codigo_comuna": "5704",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 122841202.06,
          "longitud_interseccion_m": 57324.36
        },
        "Valparaíso|San Antonio": {
          "codigo_comuna": "5401",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 399835837.36,
          "longitud_interseccion_m": 111939.93
        },
        "Valparaíso|San Esteban": {
          "codigo_comuna": "5703",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 1374981632.01,
          "longitud_interseccion_m": 141264.36
        },
        "Valparaíso|San Felipe": {
          "codigo_comuna": "5601",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 187264164.99,
          "longitud_interseccion_m": 95842.86
        },
        "Valparaíso|Santa María": {
          "codigo_comuna": "5605",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 165770071.22,
          "longitud_interseccion_m": 76848.38
        },
        "Valparaíso|Santo Domingo": {
          "codigo_comuna": "5402",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 536533032.83,
          "longitud_interseccion_m": 78818.82
        },
        "Valparaíso|Valparaíso": {
          "codigo_comuna": "5301",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 310672818.12,
          "longitud_interseccion_m": 75556.29
        },
        "Valparaíso|Villa Alemana": {
          "codigo_comuna": "5303",
          "estado": "con_cobertura",
          "elementos": 3,
          "area_interseccion_m2": 96331420.54,
          "longitud_interseccion_m": 51052.71
        },
        "Valparaíso|Viña Del Mar": {
          "codigo_comuna": "5302",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 120494501.51,
          "longitud_interseccion_m": 47625.09
        },
        "Valparaíso|Zapallar": {
          "codigo_comuna": "5204",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 288241143.24,
          "longitud_interseccion_m": 76018.53
        },
        "Ñuble|Bulnes": {
          "codigo_comuna": "8113",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 426123444.86,
          "longitud_interseccion_m": 111108.1
        },
        "Ñuble|Chillán": {
          "codigo_comuna": "8101",
          "estado": "con_cobertura",
          "elementos": 11,
          "area_interseccion_m2": 477180451.29,
          "longitud_interseccion_m": 217904.54
        },
        "Ñuble|Chillán Viejo": {
          "codigo_comuna": "8121",
          "estado": "con_cobertura",
          "elementos": 4,
          "area_interseccion_m2": 262409313.82,
          "longitud_interseccion_m": 93247.26
        },
        "Ñuble|Cobquecura": {
          "codigo_comuna": "8107",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 569136587.98,
          "longitud_interseccion_m": 116872.54
        },
        "Ñuble|Coelemu": {
          "codigo_comuna": "8120",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 342255315.6,
          "longitud_interseccion_m": 94688.17
        },
        "Ñuble|Coihueco": {
          "codigo_comuna": "8103",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 1770865750.82,
          "longitud_interseccion_m": 258749.53
        },
        "Ñuble|El Carmen": {
          "codigo_comuna": "8118",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 665510620.13,
          "longitud_interseccion_m": 156066.59
        },
        "Ñuble|Ninhue": {
          "codigo_comuna": "8105",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 402977493.68,
          "longitud_interseccion_m": 118023.47
        },
        "Ñuble|Pemuco": {
          "codigo_comuna": "8117",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 562758169.9,
          "longitud_interseccion_m": 197960.63
        },
        "Ñuble|Pinto": {
          "codigo_comuna": "8102",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 1101999449.17,
          "longitud_interseccion_m": 239905.14
        },
        "Ñuble|Portezuelo": {
          "codigo_comuna": "8106",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 289102859.16,
          "longitud_interseccion_m": 89028.23
        },
        "Ñuble|Quillón": {
          "codigo_comuna": "8115",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 406351232.49,
          "longitud_interseccion_m": 128898.04
        },
        "Ñuble|Quirihue": {
          "codigo_comuna": "8104",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 589779228.01,
          "longitud_interseccion_m": 180022.02
        },
        "Ñuble|Ránquil": {
          "codigo_comuna": "8119",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 247338431.88,
          "longitud_interseccion_m": 84269.05
        },
        "Ñuble|San Carlos": {
          "codigo_comuna": "8109",
          "estado": "con_cobertura",
          "elementos": 8,
          "area_interseccion_m2": 876943983.15,
          "longitud_interseccion_m": 212132.6
        },
        "Ñuble|San Fabián": {
          "codigo_comuna": "8111",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 1541228573.23,
          "longitud_interseccion_m": 217089.4
        },
        "Ñuble|San Ignacio": {
          "codigo_comuna": "8114",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 362915070.31,
          "longitud_interseccion_m": 121833.16
        },
        "Ñuble|San Nicolás": {
          "codigo_comuna": "8112",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 565526958.12,
          "longitud_interseccion_m": 130709.69
        },
        "Ñuble|Treguaco": {
          "codigo_comuna": "8108",
          "estado": "con_cobertura",
          "elementos": 6,
          "area_interseccion_m2": 312914584.45,
          "longitud_interseccion_m": 115931.34
        },
        "Ñuble|Yungay": {
          "codigo_comuna": "8116",
          "estado": "con_cobertura",
          "elementos": 7,
          "area_interseccion_m2": 823993856.05,
          "longitud_interseccion_m": 208504.31
        },
        "Ñuble|Ñiquén": {
          "codigo_comuna": "8110",
          "estado": "con_cobertura",
          "elementos": 5,
          "area_interseccion_m2": 491909634.96,
          "longitud_interseccion_m": 156797.02
        },
        "Magallanes y de la Antártica Chilena|Antártica": {
          "codigo_comuna": "12202",
          "estado": "sin_limite_comunal",
          "elementos": null,
          "area_interseccion_m2": null,
          "longitud_interseccion_m": null
        }
      }
    },
    "EOD": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Zonas_EOD.gpkg"
      ],
      "comunas": {}
    },
    "Caletas Pesqueras": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Embalses": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Embalse_2026.gpkg",
        "Embalse_kmz.kmz"
      ],
      "comunas": {}
    },
    "Transporte Urbano": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Red_de_Interconexin_2018.zip",
        "CICLOVchile_shp.zip",
        "Base_Paraderos_Junio_2012.rar"
      ],
      "comunas": {}
    },
    "Censo 2024": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "CENSO_2024-MANZANET.gpkg"
      ],
      "comunas": {}
    },
    "Inmuebles de Conservación Histórica": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "ICH.shp"
      ],
      "comunas": {}
    },
    "Unidades Operativas PDI": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Unidades_Operativas_PDI.gpkg"
      ],
      "comunas": {}
    },
    "Cuerpo de Bomberos": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Cuerpo_de_bomberos.gpkg"
      ],
      "comunas": {}
    },
    "Cuarteles de Carabineros": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Cuarteles_carabineros.gpkg"
      ],
      "comunas": {}
    },
    "Juntas Vecinales": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Juntas_vecinales.gpkg"
      ],
      "comunas": {}
    },
    "Predios SII": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Poligonos_Vitacura.gpkg"
      ],
      "comunas": {}
    },
    "Campamentos Chile": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Campamentos_2024.gpkg",
        "CNCTECHO_2024-2025.kmz"
      ],
      "comunas": {}
    },
    "Zonas de Conservación Histórica": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Plan Regulador Metropolitano de Santiago": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Áreas Homogéneas SII": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "AH_08-25.gpkg",
        "AH_12-24.gpkg"
      ],
      "comunas": {}
    },
    "Catastro Pre Censal 2024": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Metro de Santiago": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Estaciones_Metro_2026.gpkg",
        "Trazado_Metro_2026.gpkg",
        "Anillo_300_mts.gpkg"
      ],
      "comunas": {}
    },
    "Sectores Oficinas": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [
        "Sectores_Oficinas.gpkg"
      ],
      "comunas": {}
    },
    "Antenas de Servicios Ley de Torres": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Infraestructura Deportiva": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Red Vial": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Áreas Pobladas": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Amenaza de Tsunami": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    },
    "Amenaza de Volcanes": {
      "estado": "bloqueada",
      "motivo": "archivo_no_materializado",
      "archivos_esperados": [],
      "comunas": {}
    }
  }
};
