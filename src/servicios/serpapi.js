const API = 'https://serpapi.com/search.json';

function urlSegura(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function urlDeOferta(propiedad, filtros) {
  const enlaceProveedor = propiedad.prices?.find((oferta) => urlSegura(oferta.link))?.link;
  if (enlaceProveedor) return urlSegura(enlaceProveedor);

  const url = new URL('https://www.google.com/travel/search');
  url.searchParams.set('q', `${propiedad.name} ${filtros.destino}`);
  url.searchParams.set('checkin', filtros.checkIn);
  url.searchParams.set('checkout', filtros.checkOut);
  url.searchParams.set('adults', String(filtros.huespedes));
  url.searchParams.set('curr', 'USD');
  return url.href;
}

function tieneServicio(propiedad, servicio) {
  const amenities = (propiedad.amenities ?? []).join(' ').toLowerCase();
  if (servicio === 'wifi') return /wi-?fi|wireless/.test(amenities);
  if (servicio === 'cocina') return /kitchen|cocina/.test(amenities);
  if (servicio === 'estacionamiento') return /parking|estacionamiento/.test(amenities);
  return false;
}

function normalizar(propiedad, filtros) {
  if (
    typeof propiedad.name !== 'string'
    || !propiedad.name.trim()
    || /vacation rental/i.test(propiedad.type ?? '')
    || !Number.isFinite(propiedad.rate_per_night?.extracted_lowest)
  ) return null;

  const precioNumero = propiedad.rate_per_night.extracted_lowest;
  if (filtros.precioMax && precioNumero > filtros.precioMax) return null;
  if (!filtros.servicios.every((servicio) => tieneServicio(propiedad, servicio))) return null;

  const imagen = urlSegura(propiedad.images?.[0]?.thumbnail);
  const rating = Number.isFinite(propiedad.overall_rating)
    ? `Calificación ${propiedad.overall_rating}/5.`
    : '';
  const amenities = filtros.servicios.map((servicio) => {
    if (servicio === 'wifi') return 'Wi-Fi';
    if (servicio === 'cocina') return 'Cocina';
    return 'Estacionamiento';
  });

  return {
    nombre: propiedad.name.trim(),
    precio: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(precioNumero),
    precioNumero,
    moneda: 'USD',
    descripcion: rating,
    url: urlDeOferta(propiedad, filtros),
    imagen,
    servicios: amenities,
  };
}

export async function buscarEnSerpApi(filtros, { fetchImpl = fetch } = {}) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey?.trim()) throw new Error('Falta configurar SERPAPI_API_KEY');

  const url = new URL(API);
  const params = {
    engine: 'google_hotels',
    q: `hotels in ${filtros.destino}`,
    check_in_date: filtros.checkIn,
    check_out_date: filtros.checkOut,
    adults: String(filtros.huespedes),
    currency: 'USD',
    hl: 'es',
    no_cache: 'true',
    api_key: apiKey,
  };
  for (const [clave, valor] of Object.entries(params)) url.searchParams.set(clave, valor);

  const response = await fetchImpl(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`SerpApi respondió ${response.status}`);

  const datos = await response.json();
  if (datos.error) throw new Error('SerpApi no pudo completar la búsqueda');

  const propiedades = Array.isArray(datos.properties) ? datos.properties : [];
  const resultados = propiedades
    .map((propiedad) => normalizar(propiedad, filtros))
    .filter(Boolean);
  return [...new Map(resultados.map((resultado) => [resultado.nombre.toLowerCase(), resultado])).values()];
}
