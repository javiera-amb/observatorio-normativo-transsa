(() => {
  "use strict";

  if (typeof window.L !== "undefined") return;

  const CENTERS = {
    "Arica y Parinacota": [-18.47, -70.31],
    "Tarapacá": [-20.22, -70.14],
    "Antofagasta": [-23.65, -70.40],
    "Atacama": [-27.37, -70.33],
    "Coquimbo": [-29.91, -71.25],
    "Valparaíso": [-33.05, -71.62],
    "Metropolitana de Santiago": [-33.45, -70.67],
    "O'Higgins": [-34.17, -70.74],
    "Maule": [-35.43, -71.67],
    "Ñuble": [-36.61, -72.10],
    "Biobío": [-36.83, -73.05],
    "La Araucanía": [-38.74, -72.59],
    "Los Ríos": [-39.82, -73.24],
    "Los Lagos": [-41.47, -72.94],
    "Aysén": [-45.57, -72.07],
    "Magallanes y de la Antártica Chilena": [-53.16, -70.91],
    "Chile": [-33.45, -70.67]
  };

  const LABELS = {
    "Arica y Parinacota": "Arica",
    "Tarapacá": "Tarapacá",
    "Antofagasta": "Antofagasta",
    "Atacama": "Atacama",
    "Coquimbo": "Coquimbo",
    "Valparaíso": "Valparaíso",
    "Metropolitana de Santiago": "RM",
    "O'Higgins": "O'Higgins",
    "Maule": "Maule",
    "Ñuble": "Ñuble",
    "Biobío": "Biobío",
    "La Araucanía": "Araucanía",
    "Los Ríos": "Los Ríos",
    "Los Lagos": "Los Lagos",
    "Aysén": "Aysén",
    "Magallanes y de la Antártica Chilena": "Magallanes"
  };

  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));

  function injectOfflineMapStyles() {
    if (document.getElementById("offlineMapStyles")) return;
    const style = document.createElement("style");
    style.id = "offlineMapStyles";
    style.textContent = `
      .offline-map-shell { position:relative; width:100%; min-height:560px; overflow:hidden; background:linear-gradient(160deg,#edf4fb 0%,#f8f8ff 55%,#eef0f7 100%); }
      .offline-map-svg { display:block; width:100%; height:560px; }
      .offline-map-land { fill:#ffffff; stroke:#d8d9e8; stroke-width:2; filter:drop-shadow(0 12px 20px rgba(15,15,105,.08)); }
      .offline-map-route { fill:none; stroke:#c9cae2; stroke-width:3; stroke-linecap:round; stroke-dasharray:3 8; opacity:.7; }
      .offline-map-marker { cursor:pointer; }
      .offline-map-marker circle { fill:var(--transsa-blue); stroke:#fff; stroke-width:3; filter:drop-shadow(0 5px 9px rgba(15,15,105,.2)); transition:r .15s ease, fill .15s ease; }
      .offline-map-marker:hover circle, .offline-map-marker.active circle { fill:var(--transsa-navy); r:18; }
      .offline-map-marker text.count { fill:#fff; font-size:11px; font-weight:700; pointer-events:none; text-anchor:middle; dominant-baseline:middle; }
      .offline-map-marker text.label { fill:var(--transsa-navy); font-size:11px; font-weight:600; pointer-events:none; }
      .offline-map-caption { position:absolute; left:18px; bottom:16px; max-width:360px; padding:10px 12px; border:1px solid rgba(15,15,105,.08); border-radius:11px; color:var(--muted); background:rgba(255,255,255,.92); font-size:.74rem; box-shadow:0 8px 24px rgba(15,15,105,.06); }
      .offline-map-caption strong { color:var(--transsa-navy); }
      @media (max-width:700px){ .offline-map-shell{min-height:440px}.offline-map-svg{height:440px}.offline-map-marker text.label{display:none}.offline-map-caption{right:12px;left:12px;bottom:10px} }
    `;
    document.head.appendChild(style);
  }

  function project(lat, lon, width, height) {
    const minLat = -56.5;
    const maxLat = -17.0;
    const minLon = -76.5;
    const maxLon = -66.0;
    const x = 155 + ((lon - minLon) / (maxLon - minLon)) * (width - 310);
    const y = 35 + ((maxLat - lat) / (maxLat - minLat)) * (height - 85);
    return [x, y];
  }

  function chileShape(width, height) {
    const points = [
      [-17.4, -69.5], [-20.0, -69.9], [-23.0, -70.3], [-26.0, -70.6],
      [-29.0, -71.0], [-32.0, -71.4], [-34.0, -71.6], [-36.0, -72.0],
      [-38.0, -72.5], [-40.0, -73.0], [-42.0, -73.4], [-44.0, -73.7],
      [-46.0, -74.0], [-48.0, -74.1], [-50.0, -74.0], [-52.0, -73.6],
      [-54.5, -72.8]
    ];
    const left = points.map(([lat, lon]) => project(lat, lon - 0.25, width, height));
    const right = [...points].reverse().map(([lat, lon]) => project(lat, lon + 0.35, width, height));
    return [...left, ...right].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }

  function getVisibleItems() {
    try {
      return typeof filteredMapItems === "function" ? filteredMapItems() : [];
    } catch (error) {
      console.error("No se pudieron obtener los registros territoriales:", error);
      return [];
    }
  }

  function groupItems(items) {
    const grouped = new Map();
    items.forEach(item => {
      if (!item.region || !CENTERS[item.region] || item.region === "Chile") return;
      if (!grouped.has(item.region)) grouped.set(item.region, []);
      grouped.get(item.region).push(item);
    });
    return grouped;
  }

  function renderOfflineTerritorialMap() {
    const container = document.getElementById("territorialMap");
    if (!container) return;

    injectOfflineMapStyles();

    const width = 760;
    const height = 560;
    const items = getVisibleItems();
    const grouped = groupItems(items);
    const selected = typeof mapState !== "undefined" ? (mapState.selectedRegion || mapState.region || "") : "";

    const markerHtml = [...grouped.entries()].map(([region, regionItems]) => {
      const [lat, lon] = CENTERS[region];
      const [x, y] = project(lat, lon, width, height);
      const active = selected === region ? "active" : "";
      const labelX = x < width * 0.52 ? x + 22 : x - 22;
      const anchor = x < width * 0.52 ? "start" : "end";
      return `
        <g class="offline-map-marker ${active}" data-offline-region="${escapeText(region)}" tabindex="0" role="button" aria-label="Ver ${escapeText(region)}, ${regionItems.length} registros">
          <circle cx="${x}" cy="${y}" r="15"></circle>
          <text class="count" x="${x}" y="${y + 1}">${regionItems.length}</text>
          <text class="label" x="${labelX}" y="${y + 4}" text-anchor="${anchor}">${escapeText(LABELS[region] || region)}</text>
        </g>
      `;
    }).join("");

    const routePoints = Object.entries(CENTERS)
      .filter(([region]) => region !== "Chile")
      .sort((a, b) => b[1][0] - a[1][0])
      .map(([, [lat, lon]]) => project(lat, lon, width, height).join(","))
      .join(" ");

    container.innerHTML = `
      <div class="offline-map-shell">
        <svg class="offline-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Mapa territorial de Chile con registros por región">
          <defs>
            <linearGradient id="offlineSea" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#eef6fc"></stop>
              <stop offset="100%" stop-color="#f7f7ff"></stop>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" fill="url(#offlineSea)"></rect>
          <polygon class="offline-map-land" points="${chileShape(width, height)}"></polygon>
          <polyline class="offline-map-route" points="${routePoints}"></polyline>
          ${markerHtml}
        </svg>
        <div class="offline-map-caption"><strong>Vista territorial local.</strong> Funciona sin librerías externas. Selecciona un marcador para filtrar el detalle inferior.</div>
      </div>
    `;

    container.querySelectorAll("[data-offline-region]").forEach(marker => {
      const activate = () => {
        const region = marker.dataset.offlineRegion;
        if (typeof mapState !== "undefined") {
          mapState.selectedRegion = mapState.selectedRegion === region ? "" : region;
        }
        if (typeof renderMapResults === "function") renderMapResults();
        renderOfflineTerritorialMap();
      };
      marker.addEventListener("click", activate);
      marker.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    if (typeof renderMapResults === "function") renderMapResults();
  }

  window.renderOfflineTerritorialMap = renderOfflineTerritorialMap;

  try {
    renderTerritorialMap = renderOfflineTerritorialMap;
  } catch (error) {
    console.warn("No se pudo reemplazar el render del mapa:", error);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderOfflineTerritorialMap, { once: true });
  } else {
    renderOfflineTerritorialMap();
  }
})();
