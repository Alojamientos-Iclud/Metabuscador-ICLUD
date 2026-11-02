import test from 'node:test';
import assert from 'node:assert/strict';
import { conReintentos, esTransitorio } from '../src/lib/reintentos.js';

const sinEspera = { pausa: async () => {} };
const err503 = () => Object.assign(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'), { status: 503 });

test('reconoce errores pasajeros y errores reales', () => {
  assert.ok(esTransitorio(err503()));
  assert.ok(esTransitorio(new Error('This model is currently experiencing high demand')));
  assert.ok(!esTransitorio(Object.assign(new Error('API key not valid'), { status: 400 })));
  assert.ok(!esTransitorio(Object.assign(new Error('model not found'), { status: 404 })));
});
test('reintenta y termina bien si el 503 se pasa', async () => {
  let llamadas = 0;
  const r = await conReintentos(['m1'], async () => { if (++llamadas < 3) throw err503(); return 'ok'; }, sinEspera);
  assert.equal(r, 'ok');
  assert.equal(llamadas, 3);
});
test('pasa al modelo de respaldo si el principal sigue saturado', async () => {
  const usados = [];
  const r = await conReintentos(['principal', 'respaldo'], async (m) => { usados.push(m); if (m === 'principal') throw err503(); return m; }, sinEspera);
  assert.equal(r, 'respaldo');
  assert.deepEqual(usados, ['principal', 'principal', 'principal', 'respaldo']);
});
test('un error real no se reintenta', async () => {
  let llamadas = 0;
  await assert.rejects(
    () => conReintentos(['m1', 'm2'], async () => { llamadas++; throw Object.assign(new Error('API key not valid'), { status: 400 }); }, sinEspera),
    /API key/,
  );
  assert.equal(llamadas, 1);
});
test('si todo falla, devuelve el último error', async () => {
  await assert.rejects(() => conReintentos(['m1'], async () => { throw err503(); }, sinEspera), /UNAVAILABLE/);
});
