 test from 'node:test';
import assert from 'node:assert/strict';
import { permitir } from '../src/lib/limitador.js';

test('permite hasta el límite y bloquea el excedente', () => {
  const clave = `t-${Math.random()}`;
  const r = Array.from({ length: 4 }, () => permitir(clave, { limite: 3, ventanaMs: 60_000 }));
  assert.deepEqual(r, [true, true, true, false]);
});
test('cada clave tiene su propio contador', () => {
  assert.ok(permitir(`a-${Math.random()}`, { limite: 1, ventanaMs: 1000 }));
  assert.ok(permitir(`b-${Math.random()}`, { limite: 1, ventanaMs: 1000 }));
});
