# Configuración automática — Diario Oficial + Actualizaciones IPT

El portal contiene dos automatizaciones independientes.

## 1. Diario Oficial

- Frecuencia: todos los días.
- Hora: 08:30, zona `America/Santiago`.
- Workflow: `.github/workflows/actualizar-diario.yml`.
- Resultado: fichas web y Word diario.

## 2. Actualizaciones IPT

- Frecuencia: primer día de cada mes.
- Hora: 08:00, zona `America/Santiago`.
- Período revisado: mes calendario anterior.
- Workflow: `.github/workflows/actualizar-ipt.yml`.
- Resultado:
  - módulo web de Actualizaciones IPT;
  - Word mensual;
  - consolidado CSV compatible con Excel.

La tarea mensual que ya estaba programada en ChatGPT puede mantenerse como
control paralelo. El portal se actualizará mediante GitHub y OpenAI API, no
mediante la tarea de ChatGPT.

## Activación

### Paso 1: repositorio privado

Crea en GitHub un repositorio privado llamado:

`observatorio-normativo-transsa`

Sube el contenido de esta carpeta a la raíz.

### Paso 2: secreto de OpenAI

En GitHub:

`Settings → Secrets and variables → Actions → New repository secret`

- Nombre: `OPENAI_API_KEY`
- Valor: clave de OpenAI API con facturación habilitada.

Opcionalmente crea la variable:

- `OPENAI_MODEL`
- valor recomendado: `gpt-5-mini`

### Paso 3: prueba manual

En la pestaña Actions ejecuta primero:

1. `Actualizar Diario Oficial`
2. `Actualizar IPT mensual`

El flujo IPT puede tardar más porque revisa las 16 regiones.

### Paso 4: Cloudflare Pages

Conecta el repositorio mediante Git Integration:

- Framework preset: `None`
- Build command: vacío
- Build output directory: `/`
- Production branch: `main`

Cloudflare publicará cada commit nuevo.

## Alcance y control de calidad

La automatización IPT usa búsqueda web restringida a dominios oficiales y
realiza una revisión regional. Aun así, no puede garantizar exhaustividad
absoluta cuando una municipalidad no indexa adecuadamente sus publicaciones,
el sitio está caído o el acto solo aparece en archivos no accesibles.

Por eso, el portal muestra fuentes y una advertencia de cobertura. Para usos
normativos o comerciales, valida siempre el acto oficial.

## Excel

La automatización crea un CSV con codificación UTF-8 y separador punto y coma,
que se abre correctamente en Excel. La tarea mensual de ChatGPT puede continuar
generando el XLSX formal. El portal ya admite un campo `excel_url` para
incorporarlo cuando se automatice su carga.


## Histórico anual 2025

El paquete incluye una tercera acción:

`Actions → Cargar histórico anual → Run workflow`

Parámetros recomendados:

- `year`: `2025`
- `month`: `all`
- `force`: desmarcado

La ejecución investigará los doce meses y generará:

- un módulo web “Histórico anual”;
- Word anual;
- CSV compatible con Excel;
- filtros por mes, módulo, región y texto.

La ejecución puede tardar entre varios minutos y más de una hora, según la
cantidad de fuentes y la respuesta de la API. También puede generar consumo
adicional de OpenAI API. Para reducir el costo o recuperar una ejecución
interrumpida, usa `month` con un número entre 1 y 12.
