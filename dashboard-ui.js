/* BusPass — atalhos e estado visual da Página Inicial.
   A lógica de mapa, autenticação, cartões e trajetos continua nos arquivos originais. */
(() => {
  "use strict";

  const PAGE_LABELS = {
    map: ["Página Inicial", "Gestão e uso do transporte público em um só lugar."],
    card: ["Meu cartão", "Consulte seu saldo, suas recargas e o histórico de uso."],
    route: ["Calcular rota", "Planeje seu trajeto pelos pontos de São Carlos."],
    support: ["Suporte", "Encontre orientações e informações sobre o BusPass."]
  };

  function invalidateLeaflet() {
    const map = window.BusPassInternals?.state?.map;
    if (!map || typeof map.invalidateSize !== "function") return;
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  }

  function syncActiveView() {
    const selected = document.querySelector("body > header .tab-btn.active");
    const view = selected?.dataset.view || "map";
    const [title, subtitle] = PAGE_LABELS[view] || PAGE_LABELS.map;
    document.body.dataset.buspassView = view;
    const titleNode = document.querySelector("#workspaceTitle");
    const subtitleNode = document.querySelector("#workspaceSubtitle");
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
    invalidateLeaflet();
  }

  function navigate(view) {
    const tab = document.querySelector('body > header .tab-btn[data-view="' + view + '"]');
    if (!tab) return;
    tab.click(); // Reaproveita os listeners e as regras existentes em script.js.
    requestAnimationFrame(syncActiveView);
  }

  function openLines() {
    navigate("map");
    requestAnimationFrame(() => {
      const filters = document.querySelector("#lineFilters");
      if (filters) filters.scrollIntoView({ block: "nearest", behavior: "smooth" });
      invalidateLeaflet();
    });
  }

  function initializeDashboard() {
    document.querySelectorAll("body > header .tab-btn").forEach(button => {
      button.addEventListener("click", () => requestAnimationFrame(syncActiveView));
    });

    document.querySelectorAll("[data-go-view]").forEach(button => {
      button.addEventListener("click", () => navigate(button.dataset.goView));
    });

    document.querySelector("#linesShortcut")?.addEventListener("click", openLines);
    document.querySelector("#linesCardShortcut")?.addEventListener("click", openLines);

    window.addEventListener("resize", invalidateLeaflet, { passive: true });
    if ("ResizeObserver" in window) {
      const mapElement = document.querySelector("#map");
      if (mapElement) {
        const observer = new ResizeObserver(invalidateLeaflet);
        observer.observe(mapElement);
      }
    }
    syncActiveView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDashboard);
  } else {
    initializeDashboard();
  }
})();
