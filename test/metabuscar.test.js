import test from 'node:test';
import assert from 'node:assert/strict';
import { ejecutarMetabusqueda } from '../src/lib/metabuscar.js';

const fechaEnDias = (dias) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
const entrada = {
  destino: 'Bariloche',
  checkIn: fechaEnDias(10),
  checkOut: fechaEnDias(14),
  huespedes: 2,
};

test('rechaza entradas inválidas sin consultar el proveedor', async () => {
  let llamadas = 0;
  const r = await ejecutarMetabusqueda({ ...entrada, destino: '' }, { buscar: async () => { llamadas++; return []; } });
  assert.equal(r.status, 400);
  assert.deepEqual([r.cuerpo.ok, r.cuerpo.resultados], [false, []]);
  assert.equal(llamadas, 0);
});

test('requiere fechas antes de consultar disponibilidad', async () => {
  let llamadas = 0;
  const r = await ejecutarMetabusqueda({ destino: 'Ushuaia', huespedes: 2 }, { buscar: async () => { llamadas++; return []; } });
  assert.equal(r.status, 400);
  assert.equal(llamadas, 0);
});

test('devuelve los resultados disponibles del proveedor sin reescribirlos', async () => {
  const resultados = [{ nombre: 'Hotel confirmado', moneda: 'USD', url: 'https://www.booking.com/hotel/?hotel_id=1' }];
  const r = await ejecutarMetabusqueda(entrada, { buscar: async () => resultados });
  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo, { ok: true, resultados });
});

test('0 resultados responde [] y ok:true', async () => {
  const r = await ejecutarMetabusqueda(entrada, { buscar: async () => [] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo, { ok: true, resultados: [] });
});

test('si falla la API externa responde error claro (502)', async () => {
  const r = await ejecutarMetabusqueda(entrada, { buscar: async () => { throw new Error('boom'); } });
  assert.equal(r.status, 502);
  assert.equal(r.cuerpo.ok, false);
  assert.deepEqual(r.cuerpo.resultados, []);
  assert.ok(r.cuerpo.error);
});
