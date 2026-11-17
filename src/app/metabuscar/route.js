// POST /metabuscar: único endpoint de búsqueda que consume el frontend.
import { json, leerJson } from '@/lib/http';
import { permitir, ipDe } from '@/lib/limitador';
import { ejecutarMetabusqueda } from '@/lib/metabuscar';
import { usuarioId } from '@/lib/auth';
import { registrarBusqueda } from '@/lib/busquedas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!permitir(`busqueda:${ipDe(request)}`, { limite: 10, ventanaMs: 60_000 })) {
    return json({ ok: false, resultados: [], error: 'Demasiadas búsquedas seguidas. Esperá un minuto.' }, 429);
  }

  const faltan = ['SERPAPI_API_KEY'].filter((k) => !process.env[k]?.trim());
  if (faltan.length) {
    console.error(`Faltan variables en .env: ${faltan.join(', ')}`);
    return json({
      ok: false,
      resultados: [],
      error: 'Falta configurar SERPAPI_API_KEY en .env. Creá una clave en serpapi.com y reiniciá el servidor.',
    }, 500);
  }

  const { status, cuerpo, filtros } = await ejecutarMetabusqueda(await leerJson(request));

  // El id sale de la cookie firmada, nunca del body: el usuario no puede
  // inflar el contador de otra cuenta.
  const id = usuarioId(request);

  // Solo se cuentan búsquedas válidas y de usuarios logueados.
  if (cuerpo.ok && id) {
    try {
      cuerpo.busquedas = await registrarBusqueda(id, filtros);
    } catch (e) {
      // Si falla el contador, la búsqueda igual se devuelve: es un dato secundario.
      console.error('No se pudo registrar la búsqueda:', e.message);
    }
  }

  return json(cuerpo, status);
}
