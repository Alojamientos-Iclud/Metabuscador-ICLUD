// Utilidades del navegador.

export async function api(ruta, opciones = {}) {
  const r = await fetch(ruta, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(datos.error || 'Error inesperado.'), { status: r.status });
  return datos;
}

// RNF-03: React ya escapa todo el texto que se muestra (cumple el rol de esc()).
// Lo que falta controlar son los enlaces: solo se permiten http(s), nunca javascript:
export function urlSegura(u) {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : '';
  } catch {
    return '';
  }
}
