(() => {
  "use strict";

  if (window.location.protocol === "file:") {
    const hash = window.location.hash || "";
    window.location.replace(`http://127.0.0.1:8000/${hash}`);
    return;
  }

  function setModule(moduleName) {
    if (typeof window.switchModule === "function") {
      window.switchModule(moduleName);
    } else {
      document.querySelector(`[data-module="${moduleName}"]`)?.click();
    }
  }

  function focusAndSearch(moduleName, inputId, value) {
    setModule(moduleName);
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => {
      input.focus({ preventScroll: true });
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function initHomeSearch() {
    const input = document.getElementById("homeSearchInput");
    const iptButton = document.getElementById("homeSearchIpt");
    const dailyButton = document.getElementById("homeSearchDaily");
    if (!input || !iptButton || !dailyButton) return;

    const query = () => input.value.trim();

    iptButton.addEventListener("click", () => {
      focusAndSearch("vigencia", "vigenciaSearchInput", query());
    });

    dailyButton.addEventListener("click", () => {
      focusAndSearch("diario", "searchInput", query());
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        iptButton.click();
      }
    });
  }

  function makeMetricInteractive(metricId, moduleName, selectId, filterValue, targetSelector) {
    const card = document.getElementById(metricId)?.closest(".metric-card, .ipt-kpi");
    if (!card) return;

    card.dataset.filterAction = filterValue;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Filtrar por ${filterValue}`);

    const activate = () => {
      setModule(moduleName);
      const select = document.getElementById(selectId);
      if (!select) return;
      const active = select.value === filterValue;
      select.value = active ? "" : filterValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      card.classList.toggle("filter-active", !active);
      document.querySelector(targetSelector)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  }

  function improveEmptyStates() {
    const replacements = [
      ["iptEmptyState", "Los reportes mensuales aparecerán aquí cuando existan registros disponibles."],
      ["annualEmptyState", "El archivo histórico se mostrará aquí cuando termine su carga y validación."],
      ["vigenciaEmptyState", "Las comunas aparecerán aquí cuando exista información normativa y cartográfica para evaluar."]
    ];

    replacements.forEach(([id, message]) => {
      const element = document.getElementById(id);
      if (!element) return;
      const paragraph = element.querySelector("p");
      if (paragraph) paragraph.textContent = message;
      element.querySelector(".template-link")?.classList.add("admin-only");
    });
  }

  function loadScript(src, key = src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-tui-extension="${key}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.dataset.tuiExtension = key;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error(`No se pudo cargar ${src}`));
      };
      document.body.appendChild(script);
    });
  }

  function loadStylesheet(href, key) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[data-tui-style="${key}"]`)) {
        resolve();
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.tuiStyle = key;
      link.onload = resolve;
      link.onerror = () => {
        link.remove();
        reject(new Error(`No se pudo cargar ${href}`));
      };
      document.head.appendChild(link);
    });
  }

  async function ensureLeaflet() {
    if (typeof window.L !== "undefined") return true;

    const candidates = [
      {
        css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        key: "unpkg"
      },
      {
        css: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
        js: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
        key: "jsdelivr"
      },
      {
        css: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
        js: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
        key: "cdnjs"
      }
    ];

    for (const candidate of candidates) {
      try {
        await loadStylesheet(candidate.css, `leaflet-${candidate.key}`);
        await loadScript(candidate.js, `leaflet-${candidate.key}`);
        if (typeof window.L !== "undefined") return true;
      } catch (error) {
        console.warn(error.message);
      }
    }

    return false;
  }

  function showMapLoadError() {
    const container = document.getElementById("territorialMap");
    if (!container || container.querySelector(".map-load-error")) return;
    container.innerHTML = `
      <div class="map-load-error" style="display:grid;place-items:center;height:100%;min-height:420px;padding:28px;text-align:center;background:#f7f8fb;color:#555d70;border:1px solid #dfe3eb;border-radius:16px;">
        <div>
          <strong style="display:block;color:#0f0f69;margin-bottom:8px;">No se pudo cargar la librería del mapa</strong>
          <span>La red bloqueó los proveedores externos de Leaflet. La información territorial sigue disponible en el listado inferior.</span>
        </div>
      </div>
    `;
  }

  async function loadContentExtensions() {
    const leafletReady = await ensureLeaflet();

    try {
      await loadScript("data/noticias.js", "data-noticias");
      await loadScript("tui-content.js", "tui-content");
    } catch (error) {
      console.error("No se pudo cargar el módulo de noticias:", error);
    }

    try {
      await loadScript("vigencia-comunal.js", "vigencia-comunal");
    } catch (error) {
      console.error("No se pudo cargar la vista comunal de IPT:", error);
    }

    if (leafletReady && typeof window.renderTerritorialMap === "function") {
      setTimeout(() => window.renderTerritorialMap(), 80);
      setTimeout(() => window.renderTerritorialMap(), 350);
    } else if (!leafletReady) {
      showMapLoadError();
    }
  }

  function init() {
    initHomeSearch();
    makeMetricInteractive("metricChanges", "diario", "statusFilter", "Con novedades", "#reportes");
    makeMetricInteractive("vigenciaMetricReview", "vigencia", "vigenciaStatusFilter", "Revisión necesaria", ".vigencia-workspace");
    makeMetricInteractive("vigenciaMetricAlert", "vigencia", "vigenciaStatusFilter", "Desactualizado", ".vigencia-workspace");
    improveEmptyStates();
    loadContentExtensions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
