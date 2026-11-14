#!/usr/bin/env python3
"""Generate a checked-in OSM bus-stop snapshot for São Carlos, SP.

Run only when updating the dataset; the website itself never needs Overpass.
The snapshot is licensed under ODbL © OpenStreetMap contributors.
"""
import json
import math
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "osm_stops_static.js"
SOUTH, WEST, NORTH, EAST = (-22.095, -47.965, -21.945, -47.825)
MAX_STOPS = 260
ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]
QUERY = (
    f'[out:json][timeout:30];('
    f'node["highway"="bus_stop"]({SOUTH},{WEST},{NORTH},{EAST});'
    f'way["highway"="bus_stop"]({SOUTH},{WEST},{NORTH},{EAST});'
    f'node["public_transport"="platform"]["bus"="yes"]({SOUTH},{WEST},{NORTH},{EAST});'
    f'way["public_transport"="platform"]["bus"="yes"]({SOUTH},{WEST},{NORTH},{EAST});'
    ');out center;'
)

def fetch():
    errors = []
    for endpoint in ENDPOINTS:
        try:
            print("Consultando", endpoint, flush=True)
            url = endpoint + "?" + urllib.parse.urlencode({"data": QUERY})
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "BusPass-educational-map/1.0 (OSM attribution in project)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=45) as response:
                data = json.load(response)
            if not isinstance(data.get("elements"), list) or data.get("remark"):
                raise ValueError("Overpass retornou dados incompletos")
            print("Elementos OSM:", len(data["elements"]), flush=True)
            return data["elements"]
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            errors.append(f"{endpoint}: {exc}")
            print("Fonte indisponível:", errors[-1], flush=True)
    raise RuntimeError("Falha nas fontes OSM: " + " | ".join(errors))

def meters(a, b):
    avg_lat = math.radians((a["lat"] + b["lat"]) / 2)
    x = (a["lng"] - b["lng"]) * 111320 * math.cos(avg_lat)
    y = (a["lat"] - b["lat"]) * 111320
    return math.hypot(x, y)

def existing_coords():
    txt = (ROOT / "data.js").read_text(encoding="utf-8")
    pattern = re.compile(
        r'id:\s*"p\d+"(?:(?!\bid:).)*?\blat:\s*(-?\d+(?:\.\d+)?),\s*\blng:\s*(-?\d+(?:\.\d+)?)',
        re.S,
    )
    return [{"lat": float(lat), "lng": float(lng)} for lat, lng in pattern.findall(txt)]

def build(elements, old):
    seen_osm = set()
    result = []
    cells = set()
    for item in sorted(
        elements,
        key=lambda i: (not bool(i.get("tags", {}).get("name")), int(i.get("id", 0))),
    ):
        kind = item.get("type")
        if kind not in ("node", "way"): continue
        osm_id = item.get("id")
        if not isinstance(osm_id, int) or (kind, osm_id) in seen_osm: continue
        seen_osm.add((kind, osm_id))

        center = item.get("center") or {}
        lat = item.get("lat", center.get("lat"))
        lng = item.get("lon", center.get("lon"))
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)): continue
        if not (SOUTH <= lat <= NORTH and WEST <= lng <= EAST): continue
        p = {"lat": round(lat, 7), "lng": round(lng, 7)}
        if any(meters(p, old_stop) < 75 for old_stop in old): continue
        if any(meters(p, other) < 90 for other in result): continue
        cell = (round((lng - WEST) * 365), round((lat - SOUTH) * 395))
        if cell in cells: continue

        tags = item.get("tags") or {}
        street = str(tags.get("addr:street") or tags.get("addr:full") or "").strip()
        name = str(tags.get("name") or "").strip()
        label = name or ("Parada - " + street if street else "Parada de ônibus OSM " + str(osm_id)[-6:])
        address = street or name or "Localização registrada no OpenStreetMap"
        p.update({
            "id": f"osm-{kind}-{osm_id}",
            "osmId": osm_id,
            "osmType": kind,
            "name": label[:120],
            "address": address[:180],
            "type": "osm_stop",
            "lines": [],
        })
        result.append(p)
        cells.add(cell)
        if len(result) >= MAX_STOPS: break
    return result

def main():
    old = existing_coords()
    if len(old) < 60:
        raise RuntimeError("Não consegui localizar os 75 pontos originais para evitar duplicações")
    points = build(fetch(), old)
    print("Paradas extraídas:", len(points), "pontos originais:", len(old), flush=True)
    if len(points) < 20:
        raise RuntimeError("Menos de 20 paradas reais encontradas; não substituir snapshot por dados insuficientes")
    js = (
        "/* São Carlos, SP — paradas mapeadas no OpenStreetMap (ODbL).\n"
        " * © OpenStreetMap contributors: https://www.openstreetmap.org/copyright\n"
        " * Gerado por scripts/refresh_bus_stops.py, sem requisições no navegador.\n"
        " */\nwindow.BusPassStaticStops = "
        + json.dumps(points, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    OUT.write_text(js, encoding="utf-8")
    print("Snapshot gravado em", OUT, flush=True)

if __name__ == "__main__":
    main()
