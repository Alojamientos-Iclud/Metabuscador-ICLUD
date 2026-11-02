import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores } from '@/lib/http';

export const runtime = 'nodejs';

export const DELETE = conErrores(async (request, { params }) => {
  const usuario = usuarioId(request);
  if (!usuario) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return json({ error: 'Id inválido.' }, 400);
  await prisma.favorito.deleteMany({ where: { id, idUsuario: usuario } });
  return json({ ok: true });
});
