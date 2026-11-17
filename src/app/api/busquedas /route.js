// GET /api/busquedas -> { total, ultimas: [...] }
// Endpoint dedicado para consultar el contador y el historial de la cuenta.
import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = conErrores(async (request) => {
  const id = usuarioId(request);
  if (!id) return json({ error: 'Iniciá sesión para continuar.' }, 401);

  // Una sola ida a la base de datos trae el contador y las últimas búsquedas.
  // Esto es lo contrario del problema N+1: no se consulta de a una fila.
  const u = await prisma.usuario.findUnique({
    where: { id },
    select: {
      busquedasTotal: true,
      busquedas: {
        orderBy: { fecha: 'desc' },
        take: 10,
        select: { id: true, destino: true, huespedes: true, fecha: true },
      },
    },
  });
  if (!u) return json({ error: 'Sesión inválida.' }, 401);

  return json({ total: u.busquedasTotal, ultimas: u.busquedas });
});
