import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarEnSerpApi } from '../src/servicios/serpapi.js';

const fechaEnDias = (dias) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
const filtros = {
  destino: 'Bariloche, Argentina',
  checkIn: fechaEnDias(10),
  checkOut: fechaEnDias(14),
  huespedes: 2,
  precioMax: 100,
  servicios: ['wifi'],
};

function fetchDePrueba(datos) {
  let pedido;
  const fetchImpl = async (url, opciones) => {
    pedido = { url: new URL(url), opciones };
    return { ok: true, json: async () => datos };
  };
  return { fetchImpl, getPedido: () => pedido };
}

test('consulta Google Hotels con fechas, USD y devuelve tarifas disponibles con enlace de proveedor', async () => {
  const { fetchImpl, getPedido } = fetchDePrueba({
    properties: [{
      type: 'hotel',
      name: 'Hotel Real',
      rate_per_night: { extracted_lowest: 80 },
      overall_rating: 4.5,
      amenities: ['Free Wi-Fi'],
      prices: [{ source: 'Hotel Real', link: 'https://hotel.example/booking' }],
      images: [{ thumbnail: 'https://images.example/hotel.jpg' }],
    }],
  });
  process.env.SERPAPI_API_KEY = 'clave-de-prueba';

  const resultados = await buscarEnSerpApi(filtros, { fetchImpl });
  const pedido = getPedido();

  assert.equal(pedido.url.origin, 'https://serpapi.com');
  assert.equal(pedido.url.pathname, '/search.json');
  assert.equal(pedido.url.searchParams.get('engine'), 'google_hotels');
  assert.equal(pedido.url.searchParams.get('q'), 'hotels in Bariloche, Argentina');
  assert.equal(pedido.url.searchParams.get('check_in_date'), filtros.checkIn);
  assert.equal(pedido.url.searchParams.get('check_out_date'), filtros.checkOut);
  assert.equal(pedido.url.searchParams.get('currency'), 'USD');
  assert.equal(pedido.url.searchParams.get('no_cache'), 'true');
  assert.equal(pedido.url.searchParams.get('api_key'), 'clave-de-prueba');
  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].nombre, 'Hotel Real');
  assert.equal(resultados[0].precioNumero, 80);
  assert.equal(resultados[0].moneda, 'USD');
  assert.equal(resultados[0].url, 'https://hotel.example/booking');
  assert.deepEqual(resultados[0].servicios, ['Wi-Fi']);
});

test('usa una búsqueda de Google Hotels del hotel específico si no hay enlace de proveedor', async () => {
  const { fetchImpl } = fetchDePrueba({
    properties: [{
      type: 'hotel',
      name: 'Hotel Real',
      rate_per_night: { extracted_lowest: 80 },
      amenities: ['Free Wi-Fi'],
    }],
  });

  const [resultado] = await buscarEnSerpApi(filtros, { fetchImpl });
  const url = new URL(resultado.url);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/travel/search');
  assert.match(url.searchParams.get('q'), /Hotel Real Bariloche, Argentina/);
  assert.equal(url.searchParams.get('checkin'), filtros.checkIn);
  assert.equal(url.searchParams.get('checkout'), filtros.checkOut);
});

test('descarta alojamientos sin precio verificable, alquileres y resultados que no cumplen servicios', async () => {
  const { fetchImpl } = fetchDePrueba({
    properties: [
      { type: 'hotel', name: 'Sin precio', amenities: ['Free Wi-Fi'] },
      { type: 'vacation rental', name: 'Alquiler', rate_per_night: { extracted_lowest: 50 }, amenities: ['Free Wi-Fi'] },
      { type: 'hotel', name: 'Sin wifi', rate_per_night: { extracted_lowest: 50 }, amenities: [] },
      { type: 'hotel', name: 'Muy caro', rate_per_night: { extracted_lowest: 150 }, amenities: ['Free Wi-Fi'] },
      { type: 'hotel', name: 'Link inseguro', rate_per_night: { extracted_lowest: 50 }, amenities: ['Free Wi-Fi'], prices: [{ link: 'javascript:alert(1)' }] },
    ],
  });

  const resultados = await buscarEnSerpApi(filtros, { fetchImpl });
  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].nombre, 'Link inseguro');
  assert.ok(resultados.every((resultado) => resultado.url.startsWith('https://')));
  assert.ok(resultados.every((resultado) => resultado.precioNumero <= filtros.precioMax));
});

test('propaga errores HTTP de SerpApi sin exponer la clave de API', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401 });
  process.env.SERPAPI_API_KEY = 'clave-secreta';
  await assert.rejects(() => buscarEnSerpApi(filtros, { fetchImpl }), (error) => {
    assert.equal(error.message, 'SerpApi respondió 401');
    assert.equal(error.message.includes('clave-secreta'), false);
    return true;
  });
});
