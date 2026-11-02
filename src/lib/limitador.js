// Límite simple por clave (por ejemplo, IP). Vive en memoria: alcanza para desarrollo y la feria.
// Cada búsqueda gasta créditos de Tavily, por eso se limita.
const cubos = (globalThis.__icludLimitador ??= new Map());

export function permitir(clave, { limite, ventanaMs }) {
  const ahora = Date.now();
  if (cubos.size > 5000) for (const [k, c] of cubos) if (ahora > c.reinicio) cubos.delete(k);
  const c = cubos.get(clave);
  if (!c || ahora > c.reinicio) {
    cubos.set(clave, { n: 1, reinicio: ahora + ventanaMs });
    return true;
  }
  c.n += 1;
  return c.n <= limite;
}

export function ipDe(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}
