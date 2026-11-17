import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = conErrores(async (request) => {
  const id = usuarioId(request);
  if (!id) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  // Una sola consulta trae usuario + contador: no hay consulta extra por el número.
  const u = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, gmail: true, busquedasTotal: true },
  });
  if (!u) return json({ error: 'Sesión inválida.' }, 401);
  return json({ usuario: { id: u.id, gmail: u.gmail, busquedas: u.busquedasTotal } });
});
