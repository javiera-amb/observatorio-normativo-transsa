(() => {
  "use strict";

  if (
    typeof vigenciaInstruments !== "function" ||
    typeof renderVigenciaDetail !== "function" ||
    typeof renderVigenciaMap !== "function"
  ) {
    console.warn("La extensión comunal se cargó antes que el módulo de vigencia.");
    return;
  }

  const COMMUNES_SERVICE = "https://geoide.minvu.cl/server/rest/services/Hosted/CVP2024/FeatureServer/2";
  const communeIndexUrl = `${COMMUNES_SERVICE}/query?where=1%3D1&outFields=cut%2Ccomuna%2Cregion%2Cprovincia&returnGeometry=false&f=json`;
  let communeIndexPromise = null;
  const boundaryCache = new Map();

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bregion\b/g, "")
    .replace(/\bdel\b|\bde\b|\bla\b|\blas\b|\blos\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function injectStyles() {
    if (document.getElementById("vigenciaComunalStyles")) return;
    const style = document.createElement("style");
    style.id = "vigenciaComunalStyles";
    style.textContent = `
      .commune-plan-section { margin-top:22px; padding:20px; border:1px solid var(--line); border-radius:16px; background:var(--surface-soft); }
      .commune-plan-section h4 { margin:0 0 5px; color:var(--transsa-navy); }
      .commune-plan-section > p { margin:0 0 15px; color:var(--muted); font-size:.82rem; }
      .commune-plan-list { display:grid; gap:9px; }
      .commune-plan-item { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:center; padding:13px 14px; border:1px solid var(--line); border-radius:12px; background:#fff; }
      .commune-plan-type { display:inline-flex; min-width:48px; justify-content:center; padding:6px 9px; border-radius:999px; color:var(--transsa-blue); background:var(--transsa-pale); font-size:.72rem; font-weight:700; }
      .commune-plan-copy strong, .commune-plan-copy span { display:block; }
      .commune-plan-copy strong { color:var(--transsa-navy); font-size:.87rem; }
      .commune-plan-copy span { margin-top:3px; color:var(--muted); font-size:.72rem; }
      .commune-plan-source { color:var(--transsa-blue); font-size:.75rem; font-weight:500; white-space:nowrap; }
      .commune-boundary-loading { color:var(--muted); }
      @media(max-width:700px){ .commune-plan-item{grid-template-columns:auto 1fr}.commune-plan-source{grid-column:2;white-space:normal} }
    `;
    document.head.appendChild(style);
  }

  function rebuildTypeFilter() {
    const select = document.getElementById("vigenciaTypeFilter");
    if (!select) return;
    const selected = select.value;
    select.innerHTML = '<option value="">Todos</option>';
    const types = [...new Set(vigenciaInstruments().flatMap(item => item.tipos_ipt || []))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
    types.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
    });
    select.value = types.includes(selected) ? selected : "";
  }

  filteredVigenciaInstruments = function filteredVigenciaCommunes() {
    const q = vigenciaState.search.trim().toLowerCase();
    return vigenciaInstruments()
      .filter(item => !vigenciaState.region || item.region === vigenciaState.region)
      .filter(item => !vigenciaState.type || (item.tipos_ipt || []).includes(vigenciaState.type))
      .filter(item => !vigenciaState.status || item.estado_alerta === vigenciaState.status)
      .filter(item => {
        if (!q) return true;
        return [
          item.region, item.comuna, item.tipo_ipt, item.nombre,
          item.estado_alerta, item.resumen_alerta, item.notas,
          ...(item.instrumentos || []).flatMap(plan => [
            plan.tipo_ipt, plan.nombre, plan.fecha, plan.nivel_planificacion
          ]),
          ...(item.linea_tiempo || []).flatMap(event => [
            event.fecha, event.tipo, event.titulo, event.numero, event.estado, event.resumen
          ])
        ].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.region).localeCompare(String(b.region), "es") || String(a.comuna).localeCompare(String(b.comuna), "es"));
  };

  vigenciaCardTemplate = function vigenciaCommuneCardTemplate(item) {
    const statusClass = vigenciaStatusClass(item.estado_alerta);
    const selected = vigenciaState.selectedId === item.id ? "selected" : "";
    const types = (item.tipos_ipt || []).join(" · ") || "IPT";
    return `
      <button class="vigencia-instrument-card ${selected}" data-vigencia-id="${escapeAttribute(item.id)}">
        <div class="vigencia-card-heading">
          <span class="vigencia-status ${statusClass}"></span>
          <div>
            <strong>${escapeHtml(item.comuna || "Territorio sin comuna")}</strong>
            <span>${escapeHtml(item.region || "")}</span>
          </div>
        </div>
        <div class="vigencia-card-body">
          <span class="vigencia-type-pill">${escapeHtml(types)}</span>
          <p>${Number(item.cantidad_instrumentos || 0)} ${Number(item.cantidad_instrumentos || 0) === 1 ? "plan vigente" : "planes vigentes"}</p>
        </div>
        <div class="vigencia-card-footer">
          <span class="vigencia-alert-label ${statusClass}">${escapeHtml(item.estado_alerta || "Sin clasificación")}</span>
          <span>Ficha comunal</span>
        </div>
      </button>
    `;
  };

  const originalRenderList = renderVigenciaList;
  renderVigenciaList = function renderCommuneList() {
    originalRenderList();
    const items = filteredVigenciaInstruments();
    const result = document.getElementById("vigenciaResultCount");
    if (result) result.textContent = `${items.length} ${items.length === 1 ? "comuna" : "comunas"}`;
  };

  function planListTemplate(item) {
    const plans = item.instrumentos || [];
    return `
      <section class="commune-plan-section">
        <h4>Planes vigentes aplicables a la comuna</h4>
        <p>Incluye instrumentos comunales, intercomunales y regionales presentes en la base de origen.</p>
        <div class="commune-plan-list">
          ${plans.map(plan => `
            <article class="commune-plan-item">
              <span class="commune-plan-type">${escapeHtml(plan.tipo_ipt || "IPT")}</span>
              <div class="commune-plan-copy">
                <strong>${escapeHtml(plan.nombre || "Instrumento sin nombre")}</strong>
                <span>${escapeHtml([plan.fecha || "Sin fecha", plan.nivel_planificacion].filter(Boolean).join(" · "))}</span>
              </div>
              <a class="commune-plan-source" href="${escapeAttribute(plan.fuente || "https://portalipt.minvu.cl/instrumentos")}" target="_blank" rel="noopener noreferrer">Portal IPT →</a>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  const originalRenderDetail = renderVigenciaDetail;
  renderVigenciaDetail = function renderCommuneDetail() {
    originalRenderDetail();
    const item = vigenciaInstruments().find(instrument => instrument.id === vigenciaState.selectedId);
    if (!item) return;

    const detail = document.getElementById("vigenciaDetail");
    const mapSection = detail?.querySelector(".vigencia-map-section");
    if (mapSection && !detail.querySelector(".commune-plan-section")) {
      mapSection.insertAdjacentHTML("beforebegin", planListTemplate(item));
    }

    const detailItems = detail?.querySelectorAll(".detail-item");
    if (detailItems?.[1]) {
      detailItems[1].querySelector("span").textContent = "Primer instrumento registrado";
      detailItems[1].querySelector("strong").textContent = item.fecha_instrumento_base || "Sin fecha";
    }
    if (detailItems?.[2]) {
      detailItems[2].querySelector("span").textContent = "Último instrumento registrado";
      detailItems[2].querySelector("strong").textContent = item.fecha_ultimo_instrumento || "Sin fecha";
    }
    if (detailItems?.[3]) {
      detailItems[3].querySelector("span").textContent = "Planes vigentes";
      detailItems[3].querySelector("strong").textContent = Number(item.cantidad_instrumentos || 0);
    }

    const mapTitle = detail?.querySelector(".vigencia-map-section h3");
    if (mapTitle) mapTitle.textContent = "División comunal y planes SIG";
    const timelineTitle = detail?.querySelector(".timeline-section h3");
    if (timelineTitle) timelineTitle.textContent = "Línea de tiempo normativa de la comuna";
  };

  async function loadCommuneIndex() {
    if (!communeIndexPromise) {
      communeIndexPromise = fetch(communeIndexUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(payload => Array.isArray(payload.features) ? payload.features.map(feature => feature.attributes || {}) : [])
        .catch(error => {
          communeIndexPromise = null;
          throw error;
        });
    }
    return communeIndexPromise;
  }

  async function fetchCommuneBoundary(item) {
    const cacheKey = `${normalize(item.region)}__${normalize(item.comuna)}`;
    if (boundaryCache.has(cacheKey)) return boundaryCache.get(cacheKey);

    const records = await loadCommuneIndex();
    const communeName = normalize(item.comuna);
    const regionName = normalize(item.region);
    const candidates = records.filter(record => normalize(record.comuna) === communeName);
    const match = candidates.find(record => {
      const officialRegion = normalize(record.region);
      return officialRegion === regionName || officialRegion.includes(regionName) || regionName.includes(officialRegion);
    }) || candidates[0];

    if (!match?.cut) return null;
    const query = `${COMMUNES_SERVICE}/query?where=${encodeURIComponent(`cut=${match.cut}`)}&outFields=cut%2Ccomuna%2Cregion%2Cprovincia&returnGeometry=true&outSR=4326&f=geojson`;
    const response = await fetch(query);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const geojson = await response.json();
    boundaryCache.set(cacheKey, geojson);
    return geojson;
  }

  const originalRenderMap = renderVigenciaMap;
  renderVigenciaMap = async function renderCommuneMap(item) {
    await originalRenderMap(item);
    if (!vigenciaMap || !vigenciaBaseLayer || typeof L === "undefined") return;

    const notice = document.getElementById("vigenciaMapNotice");
    if (notice) notice.textContent = `Cargando límite comunal oficial de ${item.comuna}…`;
    const selectedId = item.id;

    try {
      const geojson = await fetchCommuneBoundary(item);
      if (vigenciaState.selectedId !== selectedId) return;
      if (!geojson?.features?.length) {
        if (notice) notice.textContent = "No se encontró el límite comunal en el servicio oficial. Los planes siguen disponibles en el listado superior.";
        return;
      }

      vigenciaBaseLayer.clearLayers();
      const layer = L.geoJSON(geojson, {
        style: {
          color: "#3739d8",
          weight: 3,
          fillColor: "#4a4cfb",
          fillOpacity: 0.12
        },
        onEachFeature: (feature, featureLayer) => {
          const properties = feature.properties || {};
          featureLayer.bindTooltip(`${properties.comuna || item.comuna} · ${properties.region || item.region}`, { sticky: true });
        }
      }).addTo(vigenciaBaseLayer);

      if (layer.getBounds().isValid()) {
        vigenciaMap.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 11 });
      }
      layer.bringToBack();
      if (notice) {
        notice.textContent = "Límite comunal oficial MINVU 2024. La zonificación de PRC, seccionales y límites urbanos se superpondrá al vincular sus servicios o archivos SIG.";
      }
      setTimeout(() => vigenciaMap?.invalidateSize({ pan: false }), 100);
    } catch (error) {
      console.warn("No se pudo cargar la división comunal oficial:", error);
      if (notice) notice.textContent = "No se pudo consultar temporalmente la división comunal oficial. La ficha y la línea de tiempo siguen disponibles.";
    }
  };

  function relabelInterface() {
    const totalLabel = document.getElementById("vigenciaMetricTotal")?.closest(".ipt-kpi")?.querySelector("span");
    if (totalLabel) totalLabel.textContent = "Comunas evaluadas";
    const listTitle = document.querySelector(".vigencia-list-panel h3");
    if (listTitle) listTitle.textContent = "Fichas por comuna";
    const emptyTitle = document.querySelector("#vigenciaDetail h3");
    if (emptyTitle?.textContent.includes("instrumento")) emptyTitle.textContent = "Selecciona una comuna";
  }

  function init() {
    injectStyles();
    rebuildTypeFilter();
    relabelInterface();
    if (typeof renderVigencia === "function") renderVigencia();
  }

  init();
})();
