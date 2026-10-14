(() => {
  "use strict";

  const state = {
    map: null,
    markers: new Map(),
    polylines: new Map(),
    pointsMap: new Map(),
    activeLines: new Set(),
    selectedPointId: null,
    activeRoutePolyline: null,
    activeRoutePointIds: new Set(),
    routeGeometryCache: new Map(),
    routeSegmentCache: new Map(),
    customRouteActive: false,

    initialized: {
      search: false,
      tabs: false,
      cards: false,
      routes: false,
      auth: false
    }
  };

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeString(str) {
    return String(str ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getPointById(id) {
    return state.pointsMap.get(id) || null;
  }

  function pointLabel(point) {
    return point?.name || "(desconhecido)";
  }

  function linesPassingAt(pointId) {
    return getPointById(pointId)?.lines?.slice() || [];
  }

  function debounce(fn, delay = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }


  const MapManager = {
    LINE_COLORS: {
      "01": "#fdff9a",
      "03": "#61ff69",
      "04": "#0077ff",
      "06": "#fc6262",
      "08": "#4ff0ff",
      "13": "#06a16e",
      "18": "#f5a905",

    },

    getLineColor(line) {
      return this.LINE_COLORS[String(line)] || "#47c5ff";
    },

    init() {
      if (state.map) return;

      state.map = L.map("map", {
        zoomControl: true
      }).setView(
        BUS_DATA.center,
        BUS_DATA.zoom
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      ).addTo(state.map);
    },

    createMarkerIcon(point) {
      const terminal = point.type === "terminal";

      return L.divIcon({
        className: "",
        html: `
          <div class="bus-marker${terminal ? " terminal" : ""}">
            ${terminal ? "T" : "•"}
          </div>
        `,
        iconSize: terminal ? [38, 38] : [32, 32],
        iconAnchor: terminal ? [19, 19] : [16, 16]
      });
    },

    buildPopup(point) {
      const tags = (point.lines || [])
        .map(line => {
          const info = BUS_DATA.lines[line];
          return `
            <span class="line-tag ${info?.color || ""}">
              ${escapeHtml(line)}
            </span>
          `;
        })
        .join(" ");

      return `
        <h4>${escapeHtml(point.name)}</h4>
        <div class="popup-address">
          ${escapeHtml(point.address)}
        </div>
        <div>
          <strong>Linhas:</strong>
          ${tags}
        </div>
        <a
          href="#"
          class="popup-link"
          data-point-id="${escapeHtml(point.id)}"
        >
          Ver detalhes →
        </a>
      `;
    },

    renderMarkers() {
      BUS_DATA.points.forEach(point => {
        state.pointsMap.set(point.id, point);

        const marker = L.marker(
          [point.lat, point.lng],
          {
            icon: this.createMarkerIcon(point)
          }
        )
          .addTo(state.map)
          .bindPopup(this.buildPopup(point));

        marker.on("popupopen", event => {
          const popup = event.popup.getElement();
          if (!popup) return;

          const link = $(".popup-link", popup);
          if (!link) return;

          link.onclick = event => {
            event.preventDefault();
            selectPoint(point.id);
          };
        });

        state.markers.set(point.id, marker);
      });
    },

    createRoutePolyline(line, geometry = []) {
      const polyline = L.polyline(geometry, {
        color: this.getLineColor(line),
        weight: 5,
        opacity: 0.65,
        lineJoin: "round",
        lineCap: "round",
        smoothFactor: 1.2,
        className: "route-line"
      }).addTo(state.map);

      polyline.lineNumber = line;
      return polyline;
    },

    async renderRoutes() {
      if (!state.map) return;

      state.customRouteActive = false;
      state.activeRoutePointIds = new Set();
      const routes = BUS_DATA.routes || {};

      state.polylines.forEach(polyline => {
        state.map.removeLayer(polyline);
      });
      state.polylines.clear();

      state.markers.forEach((marker, id) => {
        const point = getPointById(id);
        if (!point) return;

        const shouldShow = !state.activeLines.size || point.lines?.some(line => state.activeLines.has(line));
        if (shouldShow && !state.map.hasLayer(marker)) {
          marker.addTo(state.map);
        }
        if (!shouldShow && state.map.hasLayer(marker)) {
          state.map.removeLayer(marker);
        }
      });

      Object.keys(routes).forEach(line => {
        const polyline = this.createRoutePolyline(line);
        state.polylines.set(line, polyline);
      });

      for (const [line, pointIds] of Object.entries(routes)) {
        const polyline = state.polylines.get(line);
        if (!polyline) continue;
        try {
          const geometry = await RouteGeometry.getRoadGeometry(pointIds);
          if (geometry?.length >= 2) {
            polyline.setLatLngs(geometry);
          }
        } catch (error) {
          console.error(`Erro ao carregar linha ${line}:`, error);
        }
      }
      this.updateStyles();
    },

    async renderCustomRoute(pointIds, color = "#db3636") {
      if (!state.map) return;

      if (state.activeRoutePolyline) {
        state.map.removeLayer(state.activeRoutePolyline);
      }

      state.customRouteActive = true;
      state.activeRoutePointIds = new Set(pointIds);

      state.markers.forEach((marker, id) => {
        const shouldShow = state.activeRoutePointIds.has(id);
        if (shouldShow) {
          if (!state.map.hasLayer(marker)) {
            marker.addTo(state.map);
          }
        } else if (state.map.hasLayer(marker)) {
          state.map.removeLayer(marker);
        }
      });

      try {
        const geometry = await RouteGeometry.getRoadGeometry(pointIds);

        if (geometry && geometry.length >= 2) {
          state.activeRoutePolyline = L.polyline(geometry, {
            color: color,
            weight: 7,
            opacity: 1,
            lineJoin: "round"
          }).addTo(state.map);

          state.map.fitBounds(state.activeRoutePolyline.getBounds(), {
            padding: [60, 60]
          });
          this.updateStyles();
        }
      } catch (error) {
        console.error("Erro ao desenhar trajeto customizado:", error);
      }
    },

    clearCustomRoute() {
      if (state.activeRoutePolyline) {
        state.map.removeLayer(state.activeRoutePolyline);
        state.activeRoutePolyline = null;
      }

      state.customRouteActive = false;
      state.activeRoutePointIds = new Set();

      state.markers.forEach((marker, id) => {
        const point = getPointById(id);
        if (!point) return;

        const shouldShow = !state.activeLines.size || point.lines?.some(line => state.activeLines.has(line));
        if (shouldShow && !state.map.hasLayer(marker)) {
          marker.addTo(state.map);
        }
        if (!shouldShow && state.map.hasLayer(marker)) {
          state.map.removeLayer(marker);
        }
      });

      this.updateStyles();
    },

    updateStyles() {
      state.polylines.forEach((polyline, line) => {
        const color = this.getLineColor(line);

        if (state.customRouteActive) {
          const visible = state.activeLines.has(line) || false;
          polyline.setStyle({
            color,
            weight: 5,
            opacity: visible ? 0.75 : 0,
            lineCap: "round",
            lineJoin: "round"
          });
          return;
        }

        if (state.activeLines.size === 0) {
          polyline.setStyle({
            color,
            weight: 5,
            opacity: 0.65
          });
          return;
        }

        const active = state.activeLines.has(line);
        polyline.setStyle({
          color,
          weight: active ? 8 : 4,
          opacity: active ? 1 : 0.10
        });
      });
    },

    focus(originId, destinationId) {
      const origin = getPointById(originId);
      const destination = getPointById(destinationId);

      if (!origin || !destination) {
        return;
      }

      switchView("map");

      state.map.fitBounds(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng]
        ],
        {
          padding: [60, 60]
        }
      );

      const marker = state.markers.get(originId);
      marker?.openPopup();

      this.renderCustomRoute([originId, destinationId]);
    }
  };


  const RouteGeometry = {
    async getRoadGeometry(pointIds) {
      if (!Array.isArray(pointIds) || pointIds.length < 2) {
        return null;
      }

      const points = pointIds
        .map(getPointById)
        .filter(Boolean);

      if (points.length < 2) {
        return null;
      }

      const cacheKey = points.map(p => p.id).join("|");

      if (state.routeGeometryCache.has(cacheKey)) {
        return state.routeGeometryCache.get(cacheKey);
      }

      const coordinates = points
        .map(point => `${point.lng},${point.lat}`)
        .join(";");

      const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        coordinates +
        "?overview=full&geometries=geojson&steps=false";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`OSRM HTTP ${response.status}`);
      }

      const data = await response.json();

      if (
        data.code !== "Ok" ||
        !data.routes?.length ||
        !data.routes[0].geometry?.coordinates
      ) {
        throw new Error(
          "OSRM não retornou uma geometria válida."
        );
      }

      const geometry =
        data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

      state.routeGeometryCache.set(cacheKey, geometry);

      return geometry;
    },

    async getSegment(from, to) {
      if (!from || !to) {
        return null;
      }

      const key = `${from.id}|${to.id}`;

      if (state.routeSegmentCache.has(key)) {
        return state.routeSegmentCache.get(key);
      }

      const promise = this.fetchSegment(from, to);
      state.routeSegmentCache.set(key, promise);

      try {
        return await promise;
      } catch (error) {
        state.routeSegmentCache.delete(key);
        throw error;
      }
    },

    async fetchSegment(from, to) {
      const coordinates =
        `${from.lng},${from.lat};${to.lng},${to.lat}`;

      const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        coordinates +
        "?overview=full&geometries=geojson&steps=false";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`OSRM HTTP ${response.status}`);
      }

      const data = await response.json();

      if (
        data.code !== "Ok" ||
        !data.routes?.length ||
        !data.routes[0].geometry?.coordinates
      ) {
        throw new Error(
          "OSRM não retornou uma geometria válida."
        );
      }

      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );
    }
  };



  // filtros de linhas

  const FilterManager = {
    renderLines() {
      const container = $("#lineFilters");
      if (!container) return;

      container.innerHTML =
        Object.entries(BUS_DATA.lines)
          .map(([line, info]) => `
            <div
              class="line-chip"
              data-line="${escapeHtml(line)}"
              title="${escapeHtml(info.name)}"
              style="
                border-color:
                ${MapManager.getLineColor(line)}
              "
            >
              ${escapeHtml(line)}
            </div>
          `)
          .join("");

      if (!container.dataset.bound) {
        container.dataset.bound = "true";

        container.addEventListener("click", event => {
          const chip = event.target.closest(".line-chip");
          if (!chip) return;
          this.toggle(chip.dataset.line, chip);
        });
      }
    },

    toggle(line, element) {
      if (state.activeLines.has(line)) {
        state.activeLines.delete(line);
        element.classList.remove("active");
      } else {
        state.activeLines.add(line);
        element.classList.add("active");
      }

      this.apply();
      MapManager.updateStyles();
    },

    apply() {
      const input = $("#searchInput");
      const search =
        input?.value
          .trim()
          .toLowerCase() || "";

      if (state.customRouteActive) {
        state.markers.forEach((marker, id) => {
          const shouldShow = state.activeRoutePointIds.has(id);
          if (shouldShow) {
            if (!state.map.hasLayer(marker)) {
              marker.addTo(state.map);
            }
          } else if (state.map.hasLayer(marker)) {
            state.map.removeLayer(marker);
          }
        });
        return;
      }

      const hasLineFilter =
        state.activeLines.size > 0;

      state.markers.forEach((marker, id) => {
        const point = getPointById(id);
        if (!point) return;

        let visible = true;

        if (hasLineFilter) {
          visible =
            point.lines?.some(
              line =>
                state.activeLines.has(line)
            ) || false;
        }

        if (visible && search) {
          visible =
            this.matchesSearch(point, search);
        }

        if (visible) {
          if (!state.map.hasLayer(marker)) {
            marker.addTo(state.map);
          }
        } else {
          if (state.map.hasLayer(marker)) {
            state.map.removeLayer(marker);
          }
        }
      });
    },

    matchesSearch(point, text) {
      if (!point) return false;
      if (!text) return true;

      const normalizedSearch = normalizeString(text);

      const values = [
        point.name,
        point.address,
        ...(point.lines || []),
        ...(point.lines || [])
          .map(line =>
            BUS_DATA.lines[line]?.name
          )
      ];

      return values.some(
        value =>
          value &&
          normalizeString(value).includes(normalizedSearch)
      );
    }
  };
  function initSearch() {
    if (state.initialized.search) {
      return;
    }

    state.initialized.search = true;

    const input = $("#searchInput");
    if (!input) return;

    input.addEventListener(
      "input",
      debounce(() => {
        FilterManager.apply();

        if (!state.selectedPointId) {
          return;
        }

        const point = getPointById(state.selectedPointId);
        if (!point) return;

        const text =
          input.value
            .trim()
            .toLowerCase();

        if (
          text &&
          !FilterManager.matchesSearch(
            point,
            text
          )
        ) {
          state.selectedPointId = null;
          resetInfoPanel();
        }
      }, 150)
    );
  }

  function selectPoint(pointId) {
    const point = getPointById(pointId);
    if (!point) return;

    state.selectedPointId = pointId;

    const panel = $("#infoPanel");
    if (panel) {
      panel.innerHTML =
        buildPointPanel(point);
    }

    state.map.setView(
      [point.lat, point.lng],
      15,
      {
        animate: true
      }
    );

    state.markers
      .get(pointId)
      ?.openPopup();
  }

  function buildPointPanel(point) {
    const lines =
      (point.lines || [])
        .map(line => {
          const info =
            BUS_DATA.lines[line];

          return `
            <span
              class="line-tag ${info?.color || ""}"
              title="${escapeHtml(info?.name || "")}"
            >
              ${escapeHtml(line)}
            </span>
          `;
        })
        .join(" ");

    const schedules =
      (point.lines || [])
        .map(buildScheduleForLine)
        .join("");

    return `
      <div class="point-name">
        ${escapeHtml(point.name)}
      </div>

      <div class="point-address">
        📍 ${escapeHtml(point.address)}
      </div>

      <h3>
        🚌 Linhas que passam aqui
      </h3>

      <div>
        ${lines}
      </div>

      <h3 style="margin-top:18px">
        ⏰ Horários
      </h3>

      ${schedules}

      <p class="disclaimer">
        ⚠️ Horários
        <strong>referenciais</strong>.
        Confirme no próprio ponto ou pelo
        app Moovit antes de sair.
      </p>

      <p
        style="
          margin-top:12px;
          font-size:0.8rem;
          color:#78909c
        "
      >
        Operadora:
        <strong>
          ${escapeHtml(BUS_DATA.operator)}
        </strong>
      </p>
    `;
  }

  function buildScheduleForLine(line) {
    const info = BUS_DATA.lines[line];
    const schedule = getScheduleForLine(line);

    if (!schedule) {
      return "";
    }

    const days = [
      ["weekday", "Dias úteis"],
      ["saturday", "Sábado"],
      ["sunday", "Domingo"]
    ];

    const rows =
      days
        .map(([key, label]) => {
          const times = schedule[key];

          if (!times?.length) {
            return "";
          }

          const timesHtml =
            times
              .map(time => `
                <span class="line-tag">
                  ${escapeHtml(time)}
                </span>
              `)
              .join(" ");

          return `
            <tr>
              <th>${label}</th>
              <td>${timesHtml}</td>
            </tr>
          `;
        })
        .join("");

    return `
      <div style="margin-top:10px">

        <h4
          style="
            font-size:0.9rem;
            color:#1565c0
          "
        >
          Linha ${escapeHtml(line)}
          —
          ${escapeHtml(info?.name || "")}
        </h4>

        <table class="time-table">
          ${rows}
        </table>

      </div>
    `;
  }

  function resetInfoPanel() {
    const panel = $("#infoPanel");

    if (!panel) return;

    panel.innerHTML = `
      <h2>Bem-vindo!</h2>

      <p>
        Clique em um marcador no mapa para ver:
      </p>

      <ul>
        <li>📍 Endereço do ponto</li>
        <li>🚌 Linhas que passam</li>
        <li>⏰ Horários</li>
      </ul>

      <p class="disclaimer">
        <strong>Atenção:</strong>
        Os horários são referenciais.
      </p>
    `;
  }

  function initTabs() {
    if (state.initialized.tabs) {
      return;
    }

    state.initialized.tabs = true;

    $$(".tab-btn").forEach(button => {
      button.addEventListener(
        "click",
        () => {
          switchView(
            button.dataset.view
          );
        }
      );
    });
  }

  function switchView(name) {
    $$(".tab-btn").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === name
      );
    });

    const mapSidebar =
      $("#mapSidebar");

    const cardView =
      $("#cardView");

    const routeView =
      $("#routeView");

    const supportView =
      $("#supportView");

    const map =
      $("#map");

    if (mapSidebar) {
      mapSidebar.style.display =
        name === "map"
          ? "flex"
          : "none";
    }

    if (cardView) {
      cardView.style.display =
        name === "card"
          ? "flex"
          : "none";
    }

    if (routeView) {
      routeView.style.display =
        name === "route"
          ? "flex"
          : "none";
    }

    if (supportView) {
      supportView.style.display =
        name === "support"
          ? "flex"
          : "none";
    }

    if (map) {
      map.style.display = "block";
    }

    if ((name === "map" || name === "card") && state.map) {
      requestAnimationFrame(() => {
        state.map.invalidateSize();
      });
    }
  }


  const RoutePlanner = {
    findDirect(originId, destinationId) {

      const results = [];


      Object.entries(
        BUS_DATA.routes || {}
      ).forEach(
        ([line, stops]) => {

          const originIndex =
            stops.indexOf(originId);

          const destinationIndex =
            stops.indexOf(destinationId);


          if (
            originIndex === -1 ||
            destinationIndex === -1
          ) {
            return;
          }


          const start =
            Math.min(
              originIndex,
              destinationIndex
            );

          const end =
            Math.max(
              originIndex,
              destinationIndex
            );


          results.push({
            kind: "direct",

            line,

            direction:
              destinationIndex > originIndex
                ? "ida"
                : "volta",

            stops:
              stops.slice(
                start,
                end + 1
              ),

            totalStops:
              end - start
          });
        }
      );


      return results.sort(
        (a, b) =>
          a.totalStops -
          b.totalStops
      );
    },


    findWithTransfer(
      originId,
      destinationId
    ) {

      const results = [];

      const originLines =
        linesPassingAt(originId);

      const destinationLines =
        linesPassingAt(destinationId);


      originLines.forEach(lineA => {

        const routeA =
          BUS_DATA.routes[lineA] || [];


        const originIndex =
          routeA.indexOf(originId);


        if (originIndex === -1) {
          return;
        }


        destinationLines.forEach(lineB => {

          if (lineA === lineB) {
            return;
          }


          const routeB =
            BUS_DATA.routes[lineB] || [];


          const destinationIndex =
            routeB.indexOf(destinationId);


          if (destinationIndex === -1) {
            return;
          }


          routeA
            .slice(originIndex + 1)
            .forEach(transferId => {

              if (
                transferId === destinationId
              ) {
                return;
              }


              const transferIndexB =
                routeB.indexOf(
                  transferId
                );


              if (transferIndexB === -1) {
                return;
              }


              const transferIndexA =
                routeA.indexOf(
                  transferId
                );


              const segmentA =
                routeA.slice(
                  originIndex,
                  transferIndexA + 1
                );


              const segmentB =
                routeB.slice(
                  transferIndexB,
                  destinationIndex + 1
                );


              const key =
                `${lineA}|${transferId}|${lineB}`;


              if (
                results.some(
                  result =>
                    result.key === key
                )
              ) {
                return;
              }


              results.push({

                kind: "transfer",
                key,
                lineA,
                lineB,
                transferAt:
                  transferId,
                segmentA,
                segmentB,
                totalStops:
                  segmentA.length +
                  segmentB.length - 1
              });
            });
        });
      });


      return results.sort(
        (a, b) =>
          a.totalStops -
          b.totalStops
      );
    },

    render(
      results,
      container,
      originId,
      destinationId
    ) {

      if (
        !results.direct.length &&
        !results.transfer.length
      ) {

        container.innerHTML = `
          <div class="route-no-result">
             Nenhuma rota encontrada.
          </div>
        `;

        return;
      }


      const direct =
        results.direct
          .map(route =>
            this.renderDirect(route)
          )
          .join("");


      const transfers =
        results.transfer
          .slice(0, 5)
          .map(route =>
            this.renderTransfer(route)
          )
          .join("");


      container.innerHTML = `
        ${
          direct
            ? `
              <h3>🚌 Diretas</h3>
              ${direct}
            `
            : ""
        }

        ${
          transfers
            ? `
              <h3>🔁 Com Integração</h3>
              ${transfers}
            `
            : ""
        }
      `;


      container
        .querySelectorAll("[data-focus]")
        .forEach(element => {

          element.addEventListener(
            "click",
            () => {

              MapManager.focus(
                originId,
                destinationId
              );
            }
          );
        });
    },


    renderDirect(route) {

      const info =
        BUS_DATA.lines[route.line];


      const names =
        route.stops.map(id =>
          pointLabel(
            getPointById(id)
          )
        );


      const intermediate =
        names.slice(1, -1);


      const stopsHtml =
        names
          .map(
            (name, index) => `
              <li>
                ${escapeHtml(name)}

                ${
                  index === 0
                    ? " <em>(origem)</em>"
                    : index === names.length - 1
                      ? " <em>(destino)</em>"
                      : ""
                }
              </li>
            `
          )
          .join("");


      return `
        <div
          class="route-card"
          data-focus
        >

          <div class="route-card-title">

            <span class="badge">
              Linha ${escapeHtml(route.line)}
            </span>

            ${escapeHtml(info?.name || "")}

          </div>


          <div class="route-card-line">

            Sentido:
            <strong>
              ${route.direction}
            </strong>

            · ${intermediate.length}
            ponto(s) intermediário(s)

          </div>


          <div class="route-card-stops">

            <ol>
              ${stopsHtml}
            </ol>

          </div>

        </div>
      `;
    },


    renderTransfer(route) {

      const lineAInfo =
        BUS_DATA.lines[route.lineA];

      const lineBInfo =
        BUS_DATA.lines[route.lineB];


      const firstNames =
        route.segmentA.map(id =>
          pointLabel(
            getPointById(id)
          )
        );


      const secondNames =
        route.segmentB
          .slice(1)
          .map(id =>
            pointLabel(
              getPointById(id)
            )
          );


      const transferName =
        pointLabel(
          getPointById(
            route.transferAt
          )
        );


      return `
        <div
          class="route-card transfer"
          data-focus
        >

          <div class="route-card-title">

            <span class="badge">

              Linha
              ${escapeHtml(route.lineA)}
              →
              Linha
              ${escapeHtml(route.lineB)}

            </span>


            ${escapeHtml(
              lineAInfo?.name || ""
            )}

            →

            ${escapeHtml(
              lineBInfo?.name || ""
            )}

          </div>


          <div class="route-card-line">

            Trocar em
            <strong>
              ${escapeHtml(transferName)}
            </strong>

          </div>


          <div class="route-card-stops">

            <strong>
              1º trecho:
            </strong>

            <ol>
              ${
                firstNames
                  .map(name => `
                    <li>
                      ${escapeHtml(name)}
                    </li>
                  `)
                  .join("")
              }
            </ol>


            <div class="transfer-marker">

               Integração em
              ${escapeHtml(transferName)}

            </div>


            <strong>
              2º trecho:
            </strong>

            <ol start="${firstNames.length}">

              ${
                secondNames
                  .map(name => `
                    <li>
                      ${escapeHtml(name)}
                    </li>
                  `)
                  .join("")
              }

            </ol>

          </div>

        </div>
      `;
    }
  };


  function initRouteView() {

    if (state.initialized.routes) {
      return;
    }

    state.initialized.routes = true;


    const origin =
      $("#routeOrigin");

    const destination =
      $("#routeDest");

    const form =
      $("#routeForm");

    const result =
      $("#routeResult");


    if (
      !origin ||
      !destination ||
      !form ||
      !result
    ) {
      return;
    }


    const points =
      [...BUS_DATA.points]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "pt-BR"
          )
        );


    const options =
      points
        .map(point => `
          <option value="${escapeHtml(point.id)}">
            ${escapeHtml(point.name)}
          </option>
        `)
        .join("");


    origin.innerHTML = options;
    destination.innerHTML = options;


    if (points.length >= 2) {

      origin.value =
        points[0].id;

      destination.value =
        points[1].id;
    }


    form.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const originId =
          origin.value;

        const destinationId =
          destination.value;


        if (
          !originId ||
          !destinationId
        ) {
          return;
        }


        if (
          originId === destinationId
        ) {

          result.innerHTML = `
            <div class="route-no-result">
              Origem e destino são iguais
            </div>
          `;

          return;
        }


        const direct =
          RoutePlanner.findDirect(
            originId,
            destinationId
          );


        const transfer =
          RoutePlanner.findWithTransfer(
            originId,
            destinationId
          );


        RoutePlanner.render(
          {
            direct,
            transfer
          },
          result,
          originId,
          destinationId
        );
      }
    );
  }


  const CardManager = {
    KEY: "buspass.cards.v1",

    digitRegex: /\D/g,

    onlyDigits(value) {
      return String(value || "")
        .replace(this.digitRegex, "");
    },

    toCentavos(value) {
      const number =
        Number(value);

      if (!Number.isFinite(number)) {
        return 0;
      }

      return Math.round(
        number * 100
      );
    },


    toReais(centavos) {
      return (
        Number(centavos || 0) / 100
      ).toFixed(2);
    },


    maskCardNumber(number) {

      const value =
        String(number || "").trim();


      if (value.length <= 4) {
        return value;
      }


      return (
        "*".repeat(
          value.length - 4
        ) +
        value.slice(-4)
      );
    },

    maskCpf(cpf) {
      const digits =
        this.onlyDigits(cpf);


      if (digits.length !== 11) {
        return cpf;
      }


      return (
        `${digits.slice(0, 3)}.` +
        `${digits.slice(3, 6)}.` +
        `***.**-${digits.slice(10)}`
      );
    },

    formatCpfInput(value) {

      const d =
        this.onlyDigits(value)
          .slice(0, 11);


      if (d.length <= 3) {
        return d;
      }


      if (d.length <= 6) {
        return (
          `${d.slice(0, 3)}.` +
          d.slice(3)
        );
      }


      if (d.length <= 9) {
        return (
          `${d.slice(0, 3)}.` +
          `${d.slice(3, 6)}.` +
          d.slice(6)
        );
      }


      return (
        `${d.slice(0, 3)}.` +
        `${d.slice(3, 6)}.` +
        `${d.slice(6, 9)}-` +
        d.slice(9)
      );
    },

    loadLocal() {

      try {

        return JSON.parse(
          localStorage.getItem(
            this.KEY
          ) || "[]"
        );

      } catch {

        return [];
      }
    },

    saveLocal(cards) {

      localStorage.setItem(
        this.KEY,
        JSON.stringify(cards)
      );
    },

    async listar() {

      const session =
        Auth.getSession();

      if (!session) {
        return [];
      }


      try {

        const response =
          await API.listarCartoes(
            session.id
          );


        if (
          response &&
          !response.offline
        ) {
          return response;
        }

      } catch (error) {

        console.warn(
          "Falha ao listar cartões:",
          error
        );
      }


      return this
        .loadLocal()
        .filter(
          card =>
            card.usuarioId == session.id
        );
    },

    async criar(data) {

      const session =
        Auth.getSession();


      if (!session) {
        return null;
      }


      const payload = {

        usuarioId:
          session.id,

        nome:
          data.name.trim(),

        cpf:
          this.onlyDigits(data.cpf),

        numero:
          data.number.trim().toUpperCase(),

        saldoCentavos:
          this.toCentavos(data.balance)
      };


      try {

        const response =
          await API.criarCartao(
            payload
          );


        if (
          response &&
          !response.offline
        ) {
          return response;
        }

      } catch (error) {

        console.warn(
          "Falha ao criar cartão:",
          error
        );
      }


      const cards =
        this.loadLocal();


      const novo = {

        id:
          "c" + Date.now(),

        ...payload,

        recargas: 0
      };


      cards.push(novo);

      this.saveLocal(cards);


      return novo;
    },

    async recarregar(
      id,
      valorReais
    ) {

      const valorCentavos =
        this.toCentavos(
          valorReais
        );


      if (
        valorCentavos <= 0
      ) {
        return {
          ok: false,
          msg: "Informe um valor válido."
        };
      }


      try {

        const response =
          await API.recarregarCartao(
            id,
            valorCentavos
          );


        if (
          response &&
          !response.offline
        ) {

          return {

            ok: true,

            novoSaldo:
              response.novoSaldoCentavos,

            recargas:
              response.recargas
          };
        }

      } catch (error) {
        console.warn("Falha na recarga:", error);
      }

      const cards =
        this.loadLocal();
      const card =
        cards.find(item => item.id == id );
      if (!card) {
        return {
          ok: false,
          msg: "Cartão não encontrado."
        };
      }
      card.saldoCentavos =
        Number(card.saldoCentavos || 0) +
        valorCentavos;

      card.recargas =
        Number(card.recargas || 0) + 1;

      this.saveLocal(cards);

      return {
        ok: true,
        novoSaldo: card.saldoCentavos,
        recargas: card.recargas
      };
    },

    async deletar(id) {

      try {
        const response =
          await API.deletarCartao(id);
        if (
          response &&
          !response.offline
        ) {
          return true;
        }

      } catch (error) {

        console.warn(
          "Falha ao deletar cartão:",
          error
        );
      }
      const cards =
        this
          .loadLocal()
          .filter(
            card => card.id != id
          );

      this.saveLocal(cards);

      return true;
    },

    async render(container) {

      const cards =
        await this.listar();

      if (!cards.length) {

        container.innerHTML = `
          <p class="empty-msg">
            Nenhum cartão cadastrado.
          </p>
        `;

        return;
      }

      container.innerHTML =
        cards
          .map(card => {

            const quick =
              [10, 20, 50, 100]
                .map(value => `
                  <button
                    type="button"
                    class="quick-amt"
                    data-quick="${value}"
                    data-card-id="${card.id}"
                  >
                    +R$${value}
                  </button>
                `)
                .join("");

            const balance =
              this.toReais(
                card.saldoCentavos
              );

            return `
              <div
                class="card-item"
                data-card-id="${card.id}"
              >

                <div class="card-item-head">

                  <div>

                    <div class="card-item-name">
                      ${escapeHtml(card.nome || "")}
                    </div>

                    <div class="card-item-cpf">
                      CPF ${this.maskCpf(card.cpf)}
                    </div>

                  </div>

                </div>

                <div class="card-item-number">
                   ${this.maskCardNumber(card.numero)}
                </div>

                <div class="card-item-balance">

                  Saldo:
                  <strong data-balance>
                    R$ ${balance}
                  </strong>

                </div>

                <div class="recharge-box">

                  <div class="recharge-title">
                     Carregar saldo
                  </div>

                  <div class="recharge-row">

                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      placeholder="Valor (R$)"
                      data-recharge-input="${card.id}"
                    />

                    <button
                      type="button"
                      class="btn btn-primary recharge-btn"
                      data-recharge-id="${card.id}"
                    >
                      Recarregar
                    </button>

                  </div>

                  <div class="recharge-quick">
                    ${quick}
                  </div>

                  <p
                    class="recharge-feedback"
                    data-feedback="${card.id}"
                  ></p>

                </div>

                <div class="card-item-actions">

                  <span
                    class="recharge-count"
                    data-recharge-count
                  >
                    ${card.recargas || 0} recarga(s)
                  </span>

                  <button
                    class="btn btn-danger"
                    data-remove-id="${card.id}"
                  >
                    Excluir
                  </button>

                </div>

              </div>
            `;
          })
          .join("");

      const self = this;

      container.addEventListener(
        "click",
        async event => {

          const removeBtn =
            event.target.closest(
              "[data-remove-id]"
            );

          const rechargeBtn =
            event.target.closest(
              "[data-recharge-id]"
            );

          const quickBtn =
            event.target.closest(
              "[data-quick]"
            );

          if (removeBtn) {

            await self.deletar(
              removeBtn.dataset.removeId
            );

            self.render(container);

          } else if (rechargeBtn) {

            const id =
              rechargeBtn.dataset.rechargeId;

            const input =
              container.querySelector(
                `[data-recharge-input="${id}"]`
              );

            const feedback =
              container.querySelector(
                `[data-feedback="${id}"]`
              );

            await self.processRecharge(
              id,
              input.value,
              feedback,
              container
            );

            input.value = "";

          } else if (quickBtn) {

            const id =
              quickBtn.dataset.cardId;

            const value =
              quickBtn.dataset.quick;

            const feedback =
              container.querySelector(
                `[data-feedback="${id}"]`
              );

            await self.processRecharge(
              id,
              value,
              feedback,
              container
            );
          }
        }
      );

      container.addEventListener(
        "keydown",
        async event => {

          if (event.key !== "Enter") {
            return;
          }

          const input =
            event.target.closest(
              "[data-recharge-input]"
            );

          if (!input) return;

          event.preventDefault();

          const id =
            input.dataset.rechargeInput;

          const feedback =
            container.querySelector(
              `[data-feedback="${id}"]`
            );

          await self.processRecharge(
            id,
            input.value,
            feedback,
            container
          );

          input.value = "";
        }
      );
    },

    async processRecharge(
      cardId,
      value,
      feedbackElement,
      container
    ) {
      const amount = Number(value);

      if (isNaN(amount) || amount <= 0) {
        feedbackElement.textContent = " Informe um valor válido para recarga.";
        feedbackElement.className = "recharge-feedback error";
        return;
      }

      const formattedValue = amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

      const confirmed = confirm(
        `Deseja fazer a recarga no valor de ${formattedValue}?`
      );
      if (!confirmed) {
        return;
      }

      const result = await this.recarregar(cardId, value);

      if (!result.ok) {
        feedbackElement.textContent = " " + result.msg;
        feedbackElement.className = "recharge-feedback error";
        return;
      }

      const newBalance = (result.novoSaldo / 100).toFixed(2);

      feedbackElement.textContent = ` Recarga de R$ ${amount.toFixed(2)} feita! saldo: R$ ${newBalance}`;
      feedbackElement.className = "recharge-feedback success";

      this.updateCardBalanceUI(container, cardId, newBalance);

      setTimeout(() => {
        if (feedbackElement.textContent.startsWith("✅")) {
          feedbackElement.textContent = "";
          feedbackElement.className = "recharge-feedback";
        }
      }, 5000);
    },

    updateCardBalanceUI(container, cardId, balance) {
      const cardElement = container.querySelector(
        `.card-item[data-card-id="${cardId}"]`
      );
      if (cardElement) {
        const balanceEl = cardElement.querySelector("[data-balance]");
        if (balanceEl) {
          balanceEl.textContent = `R$ ${balance}`;
        }
      }
    },
  };

  function initCardView() {

    if (state.initialized.cards) {
      return;
    }

    state.initialized.cards = true;

    const form =
      $("#cardForm");

    const errorEl =
      $("#cardError");

    const cpfInput =
      $("#cardCpf");

    const listEl =
      $("#cardList");

    if (
      !form ||
      !errorEl ||
      !cpfInput ||
      !listEl
    ) {
      return;
    }

    cpfInput.addEventListener(
      "input",
      event => {

        event.target.value =
          CardManager.formatCpfInput(
            event.target.value
          );
      }
    );

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        errorEl.textContent = "";

        const card = {

          name:
            $("#cardName").value.trim(),

          cpf:
            $("#cardCpf").value,

          number:
            $("#cardNumber").value.trim().toUpperCase(),

          balance:
            $("#cardBalance").value
        };

        if (card.name.length < 3) {

          errorEl.textContent =
            "Nome inválido.";

          return;
        }

        if (
          CardManager.onlyDigits(
            card.cpf
          ).length !== 11
        ) {

          errorEl.textContent =
            "CPF deve ter 11 dígitos.";

          return;
        }

        if (!/^[A-Z0-9]{6,}$/.test(card.number)) {

          errorEl.textContent =
            "Número do cartão inválido. Use letras e números, ex.: A1B2C3D4.";

          return;
        }

        if (Number(card.balance) <= 0) {

          errorEl.textContent =
            "Saldo deve ser maior que zero.";

          return;
        }

        const btn =
          form.querySelector("button");

        btn.disabled = true;
        btn.textContent = "Cadastrando...";

        await CardManager.criar(card);

        btn.disabled = false;
        btn.textContent = "Cadastrar cartão";

        form.reset();
        CardManager.render(listEl);
      }
    );

    CardManager.render(listEl);
  }


  const Auth = {
    SESSION_KEY:
      "buspass.session.v1",

    digitRegex: /\D/g,

    onlyDigits(value) {
      return String(value || "")
        .replace(this.digitRegex, "");
    },

    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email || "")
      );
    },

    validate(data) {

      if (
        !data.nome ||
        data.nome.trim().length < 3
      ) {

        return (
          "Nome inválido. Deve ter no mínimo 3 caracteres."
        );
      }

      if (
        !this.isValidEmail(data.email)
      ) {
        return "E-mail inválido.";
      }

      if (
        this.onlyDigits(data.cpf).length !== 11
      ) {
        return "CPF invalido";
      }

      if (
        !data.senha ||
        data.senha.length < 6
      ) {

        return (
          "Senha de no mínimo 6 "
        );
      }

      return null;
    },

    async register(data) {

      const error =
        this.validate(data);

      if (error) {

        return {
          ok: false,
          msg: error
        };
      }

      const payload = {

        nome:
          data.nome.trim(),

        email:
          data.email
            .trim()
            .toLowerCase(),

        cpf:
          this.onlyDigits(data.cpf),

        senha:
          data.senha
      };

      try {

        const response =
          await API.register(payload);

        if (
          response &&
          !response.offline
        ) {

          const session = {

            id: response.id,
            nome: response.nome,
            email: response.email,
            cpf: response.cpf
          };

          this.saveSession(session);

          return {
            ok: true,
            session
          };
        }

      } catch (error) {

        console.warn(
          "Falha no registro:",
          error
        );
      }

      const users =
        this.loadUsers();

      if (
        users.some(
          user =>
            user.email === payload.email
        )
      ) {

        return {
          ok: false,
          msg: "E-mail já cadastrado."
        };
      }

      if (
        users.some(
          user =>
            user.cpf === payload.cpf
        )
      ) {

        return {
          ok: false,
          msg: "CPF já cadastrado."
        };
      }

      const novo = {

        id:
          "u" + Date.now(),

        ...payload
      };

      users.push(novo);

      localStorage.setItem(
        "buspass.users.v1",
        JSON.stringify(users)
      );

      this.saveSession(novo);

      return {
        ok: true,
        session: novo
      };
    },

    async login(email, password) {

      if (!email || !password) {

        return {
          ok: false,
          msg: "Informe e-mail e senha."
        };
      }

      const payload = {

        email:
          email
            .trim()
            .toLowerCase(),

        senha: password
      };

      try {

        const response =
          await API.login(payload);

        if (
          response &&
          !response.offline
        ) {

          const session = {

            id: response.id,
            nome: response.nome,
            email: response.email,
            cpf: response.cpf
          };

          this.saveSession(session);

          return {
            ok: true,
            session
          };
        }

      } catch (error) {

        console.warn(
          "Falha no login:",
          error
        );
      }

      const users =
        this.loadUsers();

      const user =
        users.find(
          u =>
            u.email === payload.email
        );

      if (
        !user ||
        user.senha !== payload.senha
      ) {

        return {
          ok: false,
          msg: "E-mail ou senha inválidos."
        };
      }

      this.saveSession(user);

      return {
        ok: true,
        session: user
      };
    },

    loadUsers() {

      try {

        return JSON.parse(
          localStorage.getItem(
            "buspass.users.v1"
          ) || "[]"
        );

      } catch {

        return [];
      }
    },

    saveSession(session) {

      localStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify(session)
      );
    },

    getSession() {

      try {

        return JSON.parse(
          localStorage.getItem(
            this.SESSION_KEY
          ) || "null"
        );

      } catch {

        return null;
      }
    },

    logout() {

      localStorage.removeItem(
        this.SESSION_KEY
      );
    },

    formatCpfInput(value) {

      const d =
        this.onlyDigits(value)
          .slice(0, 11);

      if (d.length <= 3) {
        return d;
      }

      if (d.length <= 6) {

        return (
          `${d.slice(0, 3)}.` +
          d.slice(3)
        );
      }

      if (d.length <= 9) {

        return (
          `${d.slice(0, 3)}.` +
          `${d.slice(3, 6)}.` +
          d.slice(6)
        );
      }

      return (
        `${d.slice(0, 3)}.` +
        `${d.slice(3, 6)}.` +
        `${d.slice(6, 9)}-` +
        d.slice(9)
      );
    },

    getInitials(name) {

      const parts =
        String(name || "")
          .trim()
          .split(/\s+/);

      if (!parts[0]) {
        return "👤";
      }

      if (parts.length === 1) {

        return parts[0]
          .slice(0, 2)
          .toUpperCase();
      }

      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
    }
  };

  async function backendIsOnline() {

    try {

      const response =
        await fetch(
          "http://localhost:8080/api/linhas"
        );

      return response.ok;
    } catch {
      return false;
    }
  }

  function showUser(session) {

    const chip =  $("#userChip");
    const nameEl =$("#userChipName");
    const avatarEl =$("#userAvatar");
    const logoutBtn = $("#logoutBtn");

    if (
      !chip ||
      !nameEl ||
      !avatarEl ||
      !logoutBtn
    ) {
      return;
    }

    nameEl.textContent =
      session.nome.split(/\s+/)[0];

    avatarEl.textContent =
      Auth.getInitials(session.nome);

    chip.style.display = "flex";

    if (!logoutBtn.dataset.bound) {

      logoutBtn.dataset.bound = "true";

      logoutBtn.addEventListener(
        "click",
        () => {

          if (
            !confirm("Deseja sair?")
          ) {
            return;
          }

          Auth.logout();

          location.reload();
        }
      );
    }
  }

  function initAuth() {

    if (state.initialized.auth) {
      return;
    }

    state.initialized.auth = true;

    const overlay =
      $("#authOverlay");

    if (!overlay) return;

    overlay.style.display = "flex";

    const session =
      Auth.getSession();

    if (
      session &&
      (!session.id || !session.email)
    ) {
      Auth.logout();
    }

    const isValidSession =
      session &&
      session.id &&
      session.email;

    if (isValidSession) {

      overlay.style.display = "none";
      showUser(session);
      boot();
      return;
    }

    const authTabs = $$(".auth-tab");
    const loginForm = $("#loginForm");
    const registerForm = $("#registerForm");
    const loginError = $("#loginError");
    const registerError = $("#registerError");

    authTabs.forEach(tab => {

      tab.addEventListener(
        "click",
        () => {
          const view = tab.dataset.authTab;
          authTabs.forEach(t => {

            t.classList.toggle(
              "active",
              t === tab
            );
          });

          loginForm.style.display =
            view === "login" ? "flex": "none";

          registerForm.style.display =
            view === "register"  ? "flex": "none";

          loginError.textContent = "";
          registerError.textContent = "";
        }
      );
    });

    const regCpf = $("#regCpf");

    if (regCpf) {

      regCpf.addEventListener(
        "input",
        event => {
          event.target.value =
            Auth.formatCpfInput(
              event.target.value
            );
        }
      );
    }

    if (loginForm) {

      loginForm.addEventListener("submit",
        async event => {
          event.preventDefault();
          loginError.textContent = "";

          const btn = loginForm.querySelector("button");

          btn.disabled = true;
          btn.textContent = "Entrando...";

          const result =
            await Auth.login(
              $("#loginEmail").value,
              $("#loginPassword").value
            );

          btn.disabled = false;
          btn.textContent = "Entrar";

          if (!result.ok) {

            loginError.textContent =
               result.msg;
            return;
          }

          overlay.style.display = "none";
          showUser(result.session);
          boot();
        }
      );
    }

    if (registerForm) {

      registerForm.addEventListener(
        "submit",
        async event => {

          event.preventDefault();
          registerError.textContent = "";
          const password = $("#regPassword").value;
          const passwordConfirm = $("#regPassword2").value;

          if (password !== passwordConfirm) {
            registerError.textContent =
              " As senhas não conferem.";
            return;
          }
          const btn =
            registerForm.querySelector(
              "button"
            );
          btn.disabled = true;
          btn.textContent = "Criando conta...";

          const result =
            await Auth.register({

              nome: $("#regName").value,
              email: $("#regEmail").value,
              cpf: $("#regCpf").value,
              senha:
                password
            });

          btn.disabled = false;
          btn.textContent = "Criar conta";

          if (!result.ok) {
            registerError.textContent =
             result.msg;
            return;
          }
          overlay.style.display = "none";
          showUser(result.session);
          boot();
        }
      );
    }
  }

  const PollingManager = {
    intervalId: null,

    start(usuarioId) {
      if (!usuarioId) return;
      if (this.intervalId) return;

      console.log("Iniciando polling de saldo para usuário:", usuarioId);
      this.intervalId = setInterval(async () => {
        try {
          const cards = await API.listarCartoes(usuarioId);
          if (cards && !cards.offline) {
            const container = $("#cardList");
            if (container) {
              cards.forEach(card => {
                const saldoReais = (card.saldoCentavos / 100).toFixed(2);
                CardManager.updateCardBalanceUI(container, card.id, saldoReais);
              });
            }
          }
        } catch (e) {
          console.warn("Erro no polling de saldo:", e);
        }
      }, 5000); // Verifica a cada 5 segundos
    },

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  };

  function boot() {
    if (!state.map) {
      MapManager.init();
      MapManager.renderMarkers();
      FilterManager.renderLines();
    }

    initSearch();
    initTabs();
    initCardView();
    initRouteView();

    if (state.map && state.polylines.size === 0) {
      MapManager.renderRoutes();
    }

    const session = Auth.getSession();
    if (session && session.id) {
      PollingManager.start(session.id);
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initAuth();
    }
  );

  return `
  <div class="route-card" data-focus>
    <img src="assets/trajeto-bus.jpg" alt="Trajeto" class="route-image">

    <div class="route-card-title">
      <span class="badge">Linha ${escapeHtml(route.line)}</span>
      ${escapeHtml(info?.name || "")}
    </div>

    ...
  </div>
`;
})();