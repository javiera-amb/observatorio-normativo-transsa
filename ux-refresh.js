(() => {
  "use strict";

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

  function makeDailyMetricInteractive() {
    const card = document.getElementById("metricChanges")?.closest(".metric-card");
    if (!card) return;
    card.dataset.filterAction = "daily-changes";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Filtrar reportes con novedades");

    const activate = () => {
      setModule("diario");
      const select = document.getElementById("statusFilter");
      if (!select) return;
      const active = select.value === "Con novedades";
      select.value = active ? "" : "Con novedades";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      card.classList.toggle("filter-active", !active);
      document.getElementById("reportes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  }

  function makeVigenciaMetricInteractive() {
    const pairs = [
      ["vigenciaMetricReview", "Revisión necesaria"],
      ["vigenciaMetricAlert", "Desactualizado"]
    ];

    pairs.forEach(([metricId, status]) => {
      const card = document.getElementById(metricId)?.closest(".ipt-kpi");
      if (!card) return;
      card.dataset.filterAction = status;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Filtrar instrumentos: ${status}`);

      const activate = () => {
        setModule("vigencia");
        const select = document.getElementById("vigenciaStatusFilter");
        if (!select) return;
        const active = select.value === status;
        select.value = active ? "" : status;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        document.querySelectorAll(".vigencia-summary .ipt-kpi").forEach(item => item.classList.remove("filter-active"));
        card.classList.toggle("filter-active", !active);
        document.querySelector(".vigencia-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      card.addEventListener("click", activate);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function improveEmptyStates() {
    const replacements = [
      ["iptEmptyState", "Los reportes mensuales aparecerán aquí cuando existan registros disponibles."],
      ["annualEmptyState", "El archivo histórico se mostrará aquí cuando termine su carga y validación."],
      ["vigenciaEmptyState", "Los instrumentos aparecerán aquí cuando exista información normativa y cartográfica para evaluar."]
    ];

    replacements.forEach(([id, message]) => {
      const element = document.getElementById(id);
      if (!element) return;
      const paragraph = element.querySelector("p");
      if (paragraph) paragraph.textContent = message;
      element.querySelector(".template-link")?.classList.add("admin-only");
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-tui-extension="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.dataset.tuiExtension = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadContentExtensions() {
    try {
      await loadScript("data/noticias.js");
      await loadScript("tui-content.js");
    } catch (error) {
      console.error("No se pudo cargar la extensión de noticias y mapa:", error);
    }
  }

  function init() {
    initHomeSearch();
    makeDailyMetricInteractive();
    makeVigenciaMetricInteractive();
    improveEmptyStates();
    loadContentExtensions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
