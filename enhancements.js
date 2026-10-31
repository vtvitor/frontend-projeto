(() => {
  "use strict";
  const internals = window.BusPassInternals;
  if (!internals) return;
  const { state, MapManager, RouteGeometry, RoutePlanner, FilterManager, getPointById, pointLabel, escapeHtml } = internals;
  const allRoutes = () => BUS_DATA.routes || {};

  const planner = {
    between(line, from, to) {
      const stops = allRoutes()[line] || [];
      let best = null;
      stops.forEach((id, i) => {
        if (id !== from) return;
        stops.forEach((end, j) => {
          if (end !== to || i === j) return;
          const segment = i < j ? stops.slice(i, j + 1) : stops.slice(j, i + 1).reverse();
          if (!best || segment.length < best.stops.length) {
            best = { stops: segment, direction: i < j ? "ida" : "volta (estimada)" };
          }
        });
      });
      return best;
    },
    direct(from, to) {
      return Object.keys(allRoutes()).flatMap(line => {
        const segment = this.between(line, from, to);
        return segment ? [{ kind: "direct", line, ...segment, totalStops: segment.stops.length - 1 }] : [];
      }).sort((a, b) => a.totalStops - b.totalStops);
    },
    transfer(from, to) {
      const lines = Object.keys(allRoutes());
      const best = new Map();
      lines.forEach(lineA => {
        const a = allRoutes()[lineA];
        if (!a.includes(from)) return;
        lines.forEach(lineB => {
          const b = allRoutes()[lineB];
          if (lineA === lineB || !b.includes(to)) return;
          [...new Set(a)].filter(id => b.includes(id)).forEach(transferAt => {
            if (transferAt === from || transferAt === to) return;
            const segmentA = this.between(lineA, from, transferAt);
            const segmentB = this.between(lineB, transferAt, to);
            if (!segmentA || !segmentB) return;
            const option = {
              kind: "transfer", lineA, lineB, transferAt,
              segmentA: segmentA.stops, segmentB: segmentB.stops,
              totalStops: segmentA.stops.length + segmentB.stops.length - 2
            };
            const key = lineA + "/" + lineB;
            if (!best.has(key) || option.totalStops < best.get(key).totalStops) best.set(key, option);
          });
        });
      });
      return [...best.values()].sort((a, b) => a.totalStops - b.totalStops);
    }
  };

  const MapUX = {
    generation: 0,
    plannerLayers: [],
    clearLayers() {
      this.plannerLayers.forEach(layer => {
        if (state.map?.hasLayer(layer)) state.map.removeLayer(layer);
      });
      this.plannerLayers = [];
      if (state.activeRoutePolyline && state.map?.hasLayer(state.activeRoutePolyline)) {
        state.map.removeLayer(state.activeRoutePolyline);
      }
      state.activeRoutePolyline = null;
    },
    hideAllLines() {
      state.polylines.forEach(layer => {
        if (state.map?.hasLayer(layer)) state.map.removeLayer(layer);
      });
    },
    syncMarkers(allowed) {
      if (!state.map) return;
      state.markers.forEach((marker, id) => {
        const visible = allowed.has(id);
        if (visible && !state.map.hasLayer(marker)) marker.addTo(state.map);
        if (!visible && state.map.hasLayer(marker)) state.map.removeLayer(marker);
      });
    },
    async showLine(line) {
      if (!state.map) return;
      const request = ++this.generation;
      this.clearLayers();
      this.hideAllLines();
      state.customRouteActive = false;
      state.activeRoutePointIds = new Set();
      FilterManager.apply();
      const pointIds = (allRoutes()[line] || []).filter(id => getPointById(id));
      if (pointIds.length < 2) return;
      let layer = state.polylines.get(line);
      if (!layer) {
        layer = L.polyline([], { color: MapManager.getLineColor(line), weight: 7, opacity: 1, lineJoin: "round" });
        state.polylines.set(line, layer);
      }
      layer.setLatLngs(pointIds.map(id => {
        const p = getPointById(id);
        return [p.lat, p.lng];
      }));
      layer.addTo(state.map);
      state.map.fitBounds(layer.getBounds(), { padding: [42, 42], maxZoom: 15 });
      try {
        const geometry = await RouteGeometry.getRoadGeometry(pointIds);
        if (request === this.generation && state.activeLines.has(line) && geometry?.length >= 2) layer.setLatLngs(geometry);
      } catch (error) {
        console.warn("O mapa mostra uma ligação aproximada entre pontos; o roteamento viário não respondeu.", error);
      }
    },
    async drawChoice(route) {
      if (!state.map) return;
      const request = ++this.generation;
      this.clearLayers();
      this.hideAllLines();
      state.customRouteActive = true;
      const parts = route.kind === "transfer"
        ? [{ line: route.lineA, stops: route.segmentA }, { line: route.lineB, stops: route.segmentB }]
        : [{ line: route.line, stops: route.stops }];
      state.activeRoutePointIds = new Set(parts.flatMap(x => x.stops));
      this.syncMarkers(state.activeRoutePointIds);
      const jobs = [];
      parts.forEach(part => {
        const points = part.stops.map(getPointById).filter(Boolean);
        if (points.length < 2) return;
        const layer = L.polyline(points.map(p => [p.lat, p.lng]), {
          color: MapManager.getLineColor(part.line), weight: 7, opacity: 1,
          lineJoin: "round", lineCap: "round"
        }).addTo(state.map);
        this.plannerLayers.push(layer);
        jobs.push(RouteGeometry.getRoadGeometry(part.stops).then(geometry => {
          if (request === this.generation && geometry?.length >= 2) layer.setLatLngs(geometry);
        }).catch(error => {
          console.warn("Trajeto aproximado: não foi possível obter o traçado pelas ruas.", error);
        }));
      });
      if (this.plannerLayers.length) {
        const bounds = L.featureGroup(this.plannerLayers).getBounds();
        if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
        state.map.invalidateSize();
      }
      await Promise.allSettled(jobs);
    },
    clearPlanner() {
      ++this.generation;
      this.clearLayers();
      state.customRouteActive = false;
      state.activeRoutePointIds = new Set();
      FilterManager.apply();
      const line = [...state.activeLines][0];
      if (line) this.showLine(line);
    }
  };

  MapManager.renderRoutes = function() {
    MapUX.hideAllLines();
  };
  MapManager.updateStyles = function() {
    const selected = state.customRouteActive ? null : [...state.activeLines][0];
    state.polylines.forEach((layer, line) => {
      if (line !== selected && state.map?.hasLayer(layer)) state.map.removeLayer(layer);
    });
  };
  MapManager.clearCustomRoute = function() { MapUX.clearPlanner(); };

  FilterManager.toggle = function(line) {
    const remove = state.activeLines.has(line);
    state.activeLines = new Set(remove ? [] : [line]);
    syncFilterButtons();
    MapUX.showLine(remove ? null : line);
    refreshPointDetail();
  };
  function syncFilterButtons() {
    document.querySelectorAll("#lineFilters .line-chip").forEach(button => {
      const selected = state.activeLines.has(button.dataset.line);
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("role", "button");
      button.tabIndex = 0;
    });
  }
  function refreshPointDetail() {
    const panel = document.querySelector("#infoPanel");
    if (!panel) return;
    panel.querySelectorAll(".line-tag:not(.time-badge):not([data-point-line])").forEach(span => {
      const line = span.textContent.trim();
      if (!BUS_DATA.lines[line]) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = span.className + " point-line-button";
      button.dataset.pointLine = line;
      button.textContent = line;
      button.title = `Mostrar apenas linha ${line}`;
      span.replaceWith(button);
    });
    panel.querySelectorAll("[data-point-line]").forEach(button => {
      const selected = state.activeLines.has(button.dataset.pointLine);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const current = [...state.activeLines][0];
    panel.querySelectorAll("h4").forEach(h4 => {
      const match = h4.textContent.match(/Linha\s+(\d+)/i);
      if (match && h4.parentElement) h4.parentElement.hidden = !!current && match[1] !== current;
    });
  }

  RoutePlanner.findDirect = (a, b) => planner.direct(a, b);
  RoutePlanner.findWithTransfer = (a, b) => planner.transfer(a, b);
  RoutePlanner.render = function(routes, container) {
    const direct = routes.direct;
    const transfers = routes.transfer.slice(0, 5);
    const choices = [...direct, ...transfers];
    this.choices = choices;
    if (!choices.length) {
      container.innerHTML = '<div class="route-no-result">Nenhum trajeto encontrado com os pontos cadastrados. Escolha outros locais.</div>';
      MapUX.clearPlanner();
      return;
    }
    const card = (route, i) => {
      const transfer = route.kind === "transfer";
      const label = transfer ? `Linhas ${route.lineA} + ${route.lineB}` : `Linha ${route.line}`;
      const name = transfer
        ? `${BUS_DATA.lines[route.lineA]?.name || ""} / ${BUS_DATA.lines[route.lineB]?.name || ""}`
        : BUS_DATA.lines[route.line]?.name || "";
      const start = transfer ? route.segmentA[0] : route.stops[0];
      const end = transfer ? route.segmentB.at(-1) : route.stops.at(-1);
      const via = transfer ? `Troca em ${pointLabel(getPointById(route.transferAt))}` : `Sentido: ${route.direction}`;
      return `<button type="button" class="route-card${transfer ? " transfer" : ""}"
        data-choice="${i}" aria-pressed="false" aria-label="Ver ${escapeHtml(label)} no mapa">
        <span class="route-card-title"><span class="badge">${escapeHtml(label)}</span>${escapeHtml(name)}</span>
        <span class="route-card-line">${route.totalStops} trecho(s) · ${escapeHtml(via)}</span>
        <span class="route-card-stops">${escapeHtml(pointLabel(getPointById(start)))} → ${escapeHtml(pointLabel(getPointById(end)))}</span>
        <span class="route-card-hint">Clique para mostrar este trajeto no mapa</span>
      </button>`;
    };
    container.innerHTML = `
      <p class="route-disclaimer">Rotas aproximadas com base nos pontos cadastrados, sujeitas a validação. Não representam horários ou itinerários oficiais.</p>
      ${direct.length ? "<h3 class='route-group-title'>🚌 Diretas</h3>" : ""}
      ${direct.map((r, i) => card(r, i)).join("")}
      ${transfers.length ? "<h3 class='route-group-title'>🔁 Com integração</h3>" : ""}
      ${transfers.map((r, i) => card(r, direct.length + i)).join("")}`;
    selectChoice(0);
  };
  function selectChoice(index) {
    const choices = RoutePlanner.choices || [];
    if (!choices[index]) return;
    document.querySelectorAll("#routeResult [data-choice]").forEach(button => {
      const selected = Number(button.dataset.choice) === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    MapUX.drawChoice(choices[index]);
  }

  function setUpSupportPreview() {
    const image = document.querySelector("#supportView .support-image");
    if (!image) return;
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "Abrir mapa de suporte ampliado");
    image.title = "Passe o mouse ou clique para ampliar";
    const hover = document.createElement("div");
    hover.className = "support-hover-preview";
    const preview = document.createElement("img");
    preview.src = image.src; preview.alt = "";
    hover.appendChild(preview); document.body.appendChild(hover);
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    image.addEventListener("mouseenter", () => { if (canHover.matches) hover.classList.add("is-visible"); });
    image.addEventListener("mouseleave", () => hover.classList.remove("is-visible"));
    const overlay = document.createElement("div");
    overlay.className = "support-map-modal";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Mapa de suporte ampliado");
    const full = document.createElement("img");
    full.src = image.src; full.alt = image.alt;
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "support-modal-close";
    closeButton.textContent = "Fechar ×";
    overlay.appendChild(closeButton);
    overlay.appendChild(full);
    document.body.appendChild(overlay);
    const open = () => {
      hover.classList.remove("is-visible");
      overlay.hidden = false;
      document.body.classList.add("support-modal-open");
      closeButton.focus();
    };
    const close = () => {
      overlay.hidden = true;
      document.body.classList.remove("support-modal-open");
      image.focus();
    };
    image.addEventListener("click", open);
    image.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) close();
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    const details = document.querySelector("#infoPanel");
    if (details) {
      const observer = new MutationObserver(() => refreshPointDetail());
      observer.observe(details, { childList: true, subtree: true });
      refreshPointDetail();
    }
    const filters = document.querySelector("#lineFilters");
    if (filters) {
      new MutationObserver(syncFilterButtons).observe(filters, { childList: true });
      syncFilterButtons();
      filters.addEventListener("keydown", event => {
        const button = event.target.closest(".line-chip");
        if (button && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          FilterManager.toggle(button.dataset.line);
        }
      });
    }
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-point-line]");
      if (button) FilterManager.toggle(button.dataset.pointLine);
      const route = event.target.closest("#routeResult [data-choice]");
      if (route) selectChoice(Number(route.dataset.choice));
    });
    setUpSupportPreview();
  });
})();
