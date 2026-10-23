(async () => {
  // Script para rodar no console da página (ex: abra index.html e execute)
  // Gera um arquivo geocoded-points.json com {id, name, address, lat, lon}

  if (typeof BUS_DATA === 'undefined' || !Array.isArray(BUS_DATA.points)) {
    console.error('BUS_DATA não encontrado. Abra index.html e rode o script no console.');
    return;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const results = [];

  for (const point of BUS_DATA.points) {
    const query = `${point.address || ''} ${point.name || ''} São Carlos SP`.trim();
    try {
      console.log('Geocoding:', point.id, query);
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query);
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const json = await res.json();

      if (Array.isArray(json) && json.length) {
        const hit = json[0];
        const lat = Number(hit.lat);
        const lon = Number(hit.lon);
        console.log(`=> ${point.id} => ${lat}, ${lon} (source: ${hit.display_name})`);
        results.push({ id: point.id, name: point.name, address: point.address, lat, lon, source: hit.display_name });
      } else {
        console.warn(`Nenhum resultado para ${point.id} (${query}).`);
        results.push({ id: point.id, name: point.name, address: point.address, lat: null, lon: null, source: null });
      }
    } catch (e) {
      console.error('Erro ao geocodificar', point.id, e);
      results.push({ id: point.id, name: point.name, address: point.address, lat: null, lon: null, source: null, error: String(e) });
    }

    // Respeitar o limite de uso público do Nominatim
    await sleep(1100);
  }

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geocoded-points.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  console.log('Arquivo geocoded-points.json gerado. Revise e me envie se quiser que eu aplique as mudanças.');
})();
