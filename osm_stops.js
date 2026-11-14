/*
 * Camada complementar de pontos de ônibus mapeados pela comunidade OpenStreetMap.
 * As coordenadas vêm do Overpass API. Não inferimos linhas nem horários.
 * Caches locais reduzem a frequência de consultas ao serviço público.
 */
(() => {
  "use strict";

  const CACHE_KEY = "buspass.osm-stops.v1";
  const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
  const MAX_EXTRA_STOPS = 220;
  const BOUNDS = [-22.095, -47.965, -21.945, -47.825]; // sul, oeste, norte, leste
  let started = false;

  const inBounds = (lat, lng) =>
    lat >= BOUNDS[0] && lat <= BOUNDS[2] &&
    lng >= BOUNDS[1] && lng <= BOUNDS[3];

  const distanceMeters = (a, b) => {
    const lat = ((a.lat + b.lat) / 2) * Math.PI / 180;
    const dx = (a.lng - b.lng) * 111320 * Math.cos(lat);
    const dy = (a.lat - b.lat) * 111320;
    return Math.hypot(dx, dy);
  };

  function status(message) {
    const el = document.getElementById("osmStopStatus");
    if (el) el.textContent = message;
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cached || !Array.isArray(cached.points) || !Number.isFinite(cached.savedAt)) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function saveCache(points) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), points }));
    } catch {
      // O mapa continua funcionando se o armazenamento estiver bloqueado.
    }
  }

  function convertElements(elements) {
    const internals = window.BusPassInternals;
    const original = BUS_DATA.points;
    const chosen = [];
    const cells = new Set();
    const ids = new Set();

    const nodes = elements
      .filter(item => item.type === "node" &&
        Number.isFinite(item.id) &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon) &&
        inBounds(item.lat, item.lon))
      .sort((a, b) =>
        Number(Boolean(b.tags?.name || b.tags?.["addr:street"])) -
        Number(Boolean(a.tags?.name || a.tags?.["addr:street"])) ||
        a.id - b.id);

    for (const node of nodes) {
      if (chosen.length >= MAX_EXTRA_STOPS) break;
      if (ids.has(node.id)) continue;
      ids.add(node.id);

      const lat = node.lat;
      const lng = node.lon;
      const location = { lat, lng };

      // Desconsidera pontos OSM muito próximos dos pontos do projeto.
      if (original.some(p => distanceMeters(location, p) < 75)) continue;

      // Espaçamento aproximado para evitar centenas de pins sobrepostos.
      const gridX = Math.round((lng - BOUNDS[1]) * 365);
      const gridY = Math.round((lat - BOUNDS[0]) * 395);
      const cell = gridX + ":" + gridY;
      if (cells.has(cell)) continue;
      if (chosen.some(p => distanceMeters(location, p) < 95)) continue;

      const tags = node.tags || {};
      const originalName = String(tags.name || "").trim();
      const street = String(tags["addr:street"] || tags["addr:full"] || "").trim();
      const ref = String(tags.ref || tags.local_ref || "").trim();
      const name = originalName || (street ? "Parada - " + street : "Parada de ônibus OSM " + (ref || String(node.id).slice(-5)));
      const address = street || originalName || "Coordenadas registradas no OpenStreetMap";

      chosen.push({
        id: "osm-" + node.id,
        osmId: node.id,
        name: name.slice(0, 120),
        address: address.slice(0, 180),
        lat,
        lng,
        type: "osm_stop",
        lines: []
      });
      cells.add(cell);
    }
    return chosen;
  }

  function registerPoints(points) {
    const internals = window.BusPassInternals;
    const { state, escapeHtml, selectPoint } = internals;
    if (!state?.map || !window.L) return 0;
    let count = 0;

    for (const point of points.slice(0, MAX_EXTRA_STOPS)) {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) ||
          !Number.isFinite(point.osmId) || !inBounds(point.lat, point.lng) ||
          !/^osm-\d+$/.test(point.id) || state.markers.has(point.id)) continue;

      const osmUrl = "https://www.openstreetmap.org/node/" + point.osmId;
      const html = `
        <h4>${escapeHtml(point.name)}</h4>
        <div class="popup-address">${escapeHtml(point.address)}</div>
        <p class="osm-stop-warning">Parada mapeada pela comunidade OSM. Linhas e horários não verificados.</p>
        <a href="${osmUrl}" target="_blank" rel="noopener noreferrer">Ver no OpenStreetMap</a>
        <a href="#" class="osm-stop-detail" data-point-id="${escapeHtml(point.id)}">Ver detalhes</a>
      `;
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: "",
          html: '<div class="bus-marker osm-stop-marker">•</div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).bindPopup(html);

      marker.on("popupopen", event => {
        const popup = event.popup.getElement();
        const link = popup?.querySelector(".osm-stop-detail");
        if (link) {
          link.onclick = click => {
            click.preventDefault();
            selectPoint(point.id);
          };
        }
      });

      state.markers.set(point.id, marker);
      state.pointsMap.set(point.id, point);
      if (!state.activeLines.size && !state.customRouteActive) marker.addTo(state.map);
      count += 1;
    }

    internals.FilterManager.apply();
    return count;
  }

  async function load() {
    if (started) return;
    const internals = window.BusPassInternals;
    if (!internals?.state?.map || !window.BUS_DATA) return;
    started = true;

    const cache = readCache();
    if (cache?.points?.length) {
      const count = registerPoints(cache.points);
      status(count + " paradas adicionais mapeadas no OpenStreetMap (sem linhas confirmadas)");
    } else {
      status("Buscando mais paradas de ônibus no OpenStreetMap...");
    }

    if (cache && Date.now() - cache.savedAt < CACHE_TTL_MS) return;

    // Uma consulta por navegador a cada 14 dias; nenhuma repetição agressiva.
    const bbox = BOUNDS.join(",");
    const query = '[out:json][timeout:20];(' +
      'node["highway"="bus_stop"](' + bbox + ');' +
      'node["public_transport"="platform"]["bus"="yes"](' + bbox + ');' +
      ');out body;';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Overpass HTTP " + response.status);
      const json = await response.json();
      if (json.remark || !Array.isArray(json.elements)) throw new Error("Resposta OSM incompleta");

      const points = convertElements(json.elements);
      if (points.length === 0) throw new Error("Nenhuma parada adicional encontrada");

      // Quando não há cache, os novos pontos são adicionados imediatamente.
      // Em uma atualização, a sessão atual mantém os marcadores já carregados.
      const added = registerPoints(points);
      saveCache(points);
      const total = [...internals.state.markers.keys()].filter(id => id.startsWith("osm-")).length;
      status(total + " paradas adicionais mapeadas no OpenStreetMap (sem linhas confirmadas)");
      console.info("BusPass: paradas OSM carregadas", { adicionadas: added, total });
    } catch (error) {
      console.warn("BusPass: não foi possível consultar paradas adicionais no OSM.", error.message);
      if (!cache?.points?.length) {
        status("Paradas extras indisponíveis no momento; pontos cadastrados continuam no mapa.");
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  window.BusPassAdditionalStops = { load };
})();
