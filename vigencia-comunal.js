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
      .commune-plan-section, .commune-change-section { margin-top:22px; padding:20px; border:1px solid var(--line); border-radius:16px; background:var(--surface-soft); }
      .commune-plan-section h4, .commune-change-section h4 { margin:0 0 5px; color:var(--transsa-navy); }
      .commune-plan-section > p, .commune-change-section > p { margin:0 0 15px; color:var(--muted); font-size:.82rem; }
      .commune-plan-list, .commune-change-list { display:grid; gap:9px; }
      .commune-plan-item { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:center; padding:13px 14px; border:1px solid var(--line); border-radius:12px; background:#fff; }
      .commune-plan-type { display:inline-flex; min-width:48px; justify-content:center; padding:6px 9px; border-radius:999px; color:var(--transsa-blue); background:var(--transsa-pale); font-size:.72rem; font-weight:700; }
      .commune-plan-copy strong, .commune-plan-copy span { display:block; }
      .commune-plan-copy strong { color:var(--transsa-navy); font-size:.87rem; }
      .commune-plan-copy span { margin-top:3px; color:var(--muted); font-size:.72rem; }
      .commune-plan-source { color:var(--transsa-blue); font-size:.75rem; font-weight:500; white-space:nowrap; }
      .commune-change-item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:13px; padding:15px; border:1px solid var(--line); border-radius:12px; background:#fff; }
      .commune-change-heading { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-bottom:6px; }
      .commune-change-heading strong { color:var(--transsa-navy); font-size:.9rem; }
      .commune-change-meta { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .commune-change-meta span { padding:4px 7px; border-radius:7px; color:var(--muted); background:var(--surface-soft); font-size:.69rem; }
      .sig-review-status { display:inline-flex; align-items:center; align-self:start; padding:7px 9px; border-radius:999px; font-size:.7rem; font-weight:700; white-space:nowrap; }
      .sig-review-status.incorporado { color:#176342; background:#e4f5ec; }
      .sig-review-status.probablemente_incorporado { color:#735110; background:#fff3cf; }
      .sig-review-status.no_incorporado { color:#922f38; background:#fde8ea; }
      .sig-review-status.pendiente_revision { color:#76511c; background:#fff7e8; }
      .sig-review-status.no_aplica { color:#56616f; background:#edf0f4; }
      .commune-change-empty { padding:14px; border:1px dashed var(--line); border-radius:10px; color:var(--muted); background:#fff; font-size:.8rem; }
      .commune-boundary-loading { color:var(--muted); }
      @media(max-width:700px){
        .commune-plan-item{grid-template-columns:auto 1fr}
        .commune-plan-source{grid-column:2;white-space:normal}
        .commune-change-item{grid-template-columns:1fr}
      }
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
          ...(item.actos_normativos || []).flatMap(act => [
            act.tipo_acto, act.titulo, act.fecha, act.estado,
            act.clasificacion_portal, act.fundamento_revision,
            ...(act.codigos_origen_afectados || [])
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
    const changes = Number(item.cantidad_actos || 0);
    const changeLabel = item.indicador_cambios
      || `${changes} ${changes === 1 ? "acto asociado" : "actos asociados"}`;
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
          <span>${escapeHtml(changeLabel)}</span>
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
                <span>${escapeHtml([plan.fecha || "Sin fecha", plan.nivel_planificacion, `Registro ${plan.registro}`].filter(Boolean).join(" · "))}</span>
              </div>
              <a class="commune-plan-source" href="${escapeAttribute(plan.fuente || "https://portalipt.minvu.cl/instrumentos")}" target="_blank" rel="noopener noreferrer">Portal IPT →</a>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  const sigLabel = status => ({
    incorporado: "Incorporado en SIG",
    probablemente_incorporado: "Probable / parcial",
    no_incorporado: "No incorporado",
    no_aplica: "No aplica a geometría",
    pendiente_revision: "Pendiente de revisar"
  }[status] || "Pendiente de revisar");

  function changeListTemplate(item) {
    const acts = item.actos_normativos || [];
    return `
      <section class="commune-change-section">
        <h4>Cambios normativos a verificar en SIG</h4>
        <p>Cada modificación, enmienda o rectificación mantiene su propio estado de revisión cartográfica.</p>
        <div class="commune-change-list">
          ${acts.length ? acts.map(act => {
            const status = act.incorporacion_sig || "pendiente_revision";
            const origins = (act.codigos_origen_afectados || []).length
              ? `Origen: ${(act.codigos_origen_afectados || []).join(", ")}`
              : "Origen pendiente de vincular";
            return `
              <article class="commune-change-item">
                <div>
                  <div class="commune-change-heading">
                    <span class="commune-plan-type">${escapeHtml(act.tipo_acto || "Modificación")}</span>
                    <strong>${escapeHtml(act.titulo || "Acto sin denominación")}</strong>
                  </div>
                  ${act.fundamento_revision ? `<p>${escapeHtml(act.fundamento_revision)}</p>` : ""}
                  <div class="commune-change-meta">
                    <span>${escapeHtml(act.fecha || "Sin fecha")}</span>
                    <span>${escapeHtml(act.estado || "Sin estado")}</span>
                    <span>${escapeHtml(origins)}</span>
                    ${act.registro_portal ? `<span>Registro ${escapeHtml(act.registro_portal)}</span>` : ""}
                  </div>
                  ${act.fuente_oficial ? `<a class="commune-plan-source" href="${escapeAttribute(act.fuente_oficial)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial →</a>` : ""}
                </div>
                <span class="sig-review-status ${escapeAttribute(status)}">${escapeHtml(sigLabel(status))}</span>
              </article>
            `;
          }).join("") : `
            <div class="commune-change-empty">
              Aún no se ha cargado la exportación oficial de modificaciones y enmiendas. La ausencia de registros no significa que la comuna no tenga cambios.
            </div>
          `}
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
    if (mapSection && !detail.querySelector(".commune-change-section")) {
      mapSection.insertAdjacentHTML("beforebegin", changeListTemplate(item));
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
      detailItems[3].querySelector("span").textContent = "Cambios pendientes SIG";
      detailItems[3].querySelector("strong").textContent = Number(item.actos_posteriores_pendientes || 0);
    }

    const mapTitle = detail?.querySelector(".vigencia-map-section h3");
    if (mapTitle) mapTitle.textContent = "División comunal y comparación SIG";
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
        if (notice) notice.textContent = "No se encontró el límite comunal en el servicio oficial. Los planes y cambios siguen disponibles en los listados superiores.";
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
        notice.textContent = "Límite comunal oficial MINVU 2024. Las geometrías de planes y modificaciones se superpondrán al vincular sus servicios o archivos SIG.";
      }
      setTimeout(() => vigenciaMap?.invalidateSize({ pan: false }), 100);
    } catch (error) {
      console.warn("No se pudo cargar la división comunal oficial:", error);
      if (notice) notice.textContent = "No se pudo consultar temporalmente la división comunal oficial. La ficha, los planes y los cambios siguen disponibles.";
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
