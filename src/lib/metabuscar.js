// Orquesta la búsqueda: validar -> consultar hoteles y tarifas en Google Hotels.
// Devuelve siempre el mismo shape: { ok, resultados, error? }
import { validarFiltros } from './validar.js';
import { buscarEnSerpApi } from '../servicios/serpapi.js';

export async function ejecutarMetabusqueda(body, { buscar = buscarEnSerpApi } = {}) {
  const { valor: filtros, error } = validarFiltros(body);
  if (error) return { status: 400, cuerpo: { ok: false, resultados: [], error } };

  try {
    const resultados = await buscar(filtros);
    return { status: 200, cuerpo: { ok: true, resultados } };
  } catch (e) {
    console.error('Fallo en /metabuscar:', e.message);
    return {
      status: 502,
      cuerpo: { ok: false, resultados: [], error: 'No pudimos completar la búsqueda en este momento. Probá de nuevo en unos minutos.' },
    };
  }
}
