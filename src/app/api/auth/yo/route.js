import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = conErrores(async (request) => {
  const id = usuarioId(request);
  if (!id) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) return json({ error: 'Sesión inválida.' }, 401);
  return json({ usuario: { id: u.id, nombre: u.nombre } });
});
