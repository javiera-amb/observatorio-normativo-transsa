window.CAPAS_TERRITORIALES = {
  corte: "2026-08-11",
  fuente: "Diccionario de Datos · vista T. Espaciales",
  fuente_url: "https://app.notion.com/p/1ee631a6d38f80e9a55cc8115fcf4069?pvs=204",
  nota: "Snapshot de lectura. La existencia de una ficha no acredita cobertura comunal ni calidad geométrica.",
  registros_sin_nombre: 1,
  alertas: [
    {
      nivel: "critica",
      titulo: "Planes Reguladores Comunales: verificación expirada",
      detalle: "La ficha corporativa del PRC está marcada como expirada. No debe usarse por sí sola para declarar un SIG vigente o validado.",
      accion: "Revalidar la ficha, la cobertura comunal y los archivos que componen la versión recomendada.",
      capa: "Planes Reguladores Comunales"
    },
    {
      nivel: "critica",
      titulo: "Fecha futura inconsistente en PRC versión 2.1",
      detalle: "La ficha indica Versión 2.1 con fecha 2027-07-02, aunque su última edición fue 2026-07-02. Se trata como posible error de digitación hasta confirmación.",
      accion: "Confirmar fecha efectiva, nombre y hash de Catastro_PRC_Consolidado02.07.26.gpkg antes de promoverlo como última versión.",
      capa: "Planes Reguladores Comunales"
    },
    {
      nivel: "advertencia",
      titulo: "Un registro territorial no tiene nombre",
      detalle: "La vista T. Espaciales contiene una fila normativa sin título, editada el 2026-06-17.",
      accion: "Identificar la capa o eliminar el registro incompleto para que no quede fuera del monitoreo.",
      capa: "Registro sin nombre"
    }
  ],
  capas: [
    { nombre:"Áreas Protegidas", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-08-11", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f803bbe58dd980bf94cad" },
    { nombre:"Scraping AH", categorias:[], owner:"Fernanda Santos", ultima_edicion:"2026-07-27", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/3a6631a6d38f804f9c0ede538fc934d9" },
    { nombre:"Base predios", categorias:[], owner:"Javiera Morales", ultima_edicion:"2026-07-08", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/396631a6d38f80568222f2a9308dd5cf" },
    { nombre:"Planes Reguladores Comunales", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-07-02", verificacion:"expirada", formatos:["GeoPackage","KML"], version:"2.1 declarada · fecha por confirmar", cobertura:"La versión 2.0 declara incluir Coquimbo; la 2.1 declara agregar Valdivia.", url:"https://app.notion.com/28c631a6d38f80d79bade981a23b0654" },
    { nombre:"Sitios Prioritarios", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-06-24", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f809c9eebfafc048f22ce" },
    { nombre:"Establecimientos Educacionales", categorias:["Infraestructura"], owner:"Javiera Morales", ultima_edicion:"2026-06-22", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f8059a434c1b6950956b6" },
    { nombre:"Transporte Urbano (RED)", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-06-15", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/31a631a6d38f80199c45ec61a153b409" },
    { nombre:"Barrios Transsa", categorias:["Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-28", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/2f7631a6d38f8092b040e51d8f53fbcd" },
    { nombre:"División Político Regional", categorias:[], owner:"Fernanda Santos", ultima_edicion:"2026-05-19", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/365631a6d38f80be9a73ed6e9e899d6a" },
    { nombre:"División Político Comunal", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"verificada", formatos:["GeoPackage","KML"], version:"2026", cobertura:"División comunal nacional con sectores Transsa; revisar excepciones históricas de Santiago.", url:"https://app.notion.com/28c631a6d38f80298799cb62924c02a0" },
    { nombre:"EOD", categorias:["Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"verificada", formatos:["GeoPackage"], version:"2025.2", url:"https://app.notion.com/2a0631a6d38f80c7836cdc8071b21a05" },
    { nombre:"Caletas Pesqueras", categorias:["Infraestructura","Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80dcba75d6f7fdc5c042" },
    { nombre:"Embalses", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f803d80d9d06820c2b4ff" },
    { nombre:"Transporte Urbano", categorias:["Infraestructura","Socioambiental"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f805abd34d11c42f86b4e" },
    { nombre:"Censo 2024", categorias:["Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-19", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/32d631a6d38f804388f3da4aaccced32" },
    { nombre:"Inmuebles de Conservación Histórica", categorias:["Normativa","Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-15", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/31a631a6d38f80f598e9f05473026caa" },
    { nombre:"Unidades Operativas PDI", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-05-13", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f805da8adeed38fdf2e47" },
    { nombre:"Cuerpo de Bomberos", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-05-13", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f8053a132ecb64cd0c118" },
    { nombre:"Cuarteles de Carabineros", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-05-11", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80009184d381eeabed17" },
    { nombre:"Juntas Vecinales", categorias:["Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-11", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/2a0631a6d38f80ff881dffaeee7b70ab" },
    { nombre:"Predios SII", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-05-11", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/31a631a6d38f80fea090c5434c1a5e05" },
    { nombre:"Campamentos Chile", categorias:["Socioambiental","Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-05-11", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f809caf29ded87fca2734" },
    { nombre:"Zonas de Conservación Histórica", categorias:["Normativa","Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-03-05", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/31a631a6d38f802e9c24fc3035f4054f" },
    { nombre:"Plan Regulador Metropolitano de Santiago", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-03-05", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f808ca128c9d21d8e1ed2" },
    { nombre:"Áreas Homogéneas SII", categorias:["Normativa"], owner:"René Rebolledo", ultima_edicion:"2026-03-05", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80809956f0b6b1281718" },
    { nombre:"Catastro Pre Censal 2024", categorias:["Demografía"], owner:"René Rebolledo", ultima_edicion:"2026-03-05", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80728e4ff9917b4b3380" },
    { nombre:"Metro de Santiago", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2026-03-02", verificacion:"verificada", formatos:["GeoPackage","KML"], version:"1 · archivos 2026", cobertura:"Estaciones, trazados y anillos de influencia de 300 m; incluye líneas actuales, en construcción y proyectadas.", url:"https://app.notion.com/28c631a6d38f8087884bd96acbb1ba24" },
    { nombre:"Sectores Oficinas", categorias:["Socioambiental"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80989865c99cb3189152" },
    { nombre:"Antenas de Servicios Ley de Torres", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80c29a65dd83f7f3b8d2" },
    { nombre:"Infraestructura Deportiva", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80baafcad23ee0e915dc" },
    { nombre:"Red Vial", categorias:["Infraestructura"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f802e8667d198962f4afd" },
    { nombre:"Áreas Pobladas", categorias:["Normativa","Socioambiental"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f802ba792d565d4abe980" },
    { nombre:"Amenaza de Tsunami", categorias:["Socioambiental"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80799260e3aae8806454" },
    { nombre:"Amenaza de Volcanes", categorias:["Socioambiental"], owner:"René Rebolledo", ultima_edicion:"2025-10-14", verificacion:"por_revisar", formatos:[], url:"https://app.notion.com/28c631a6d38f80a8ae93da07430cffca" }
  ]
};
