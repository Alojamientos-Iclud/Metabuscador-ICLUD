import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores } from '@/lib/http';

export const runtime = 'nodejs';

export const DELETE = conErrores(async (request, { params }) => {
  const usuario = usuarioId(request);
  if (!usuario) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return json({ error: 'Id inválido.' }, 400);

  // Transacción: borrar el favorito y restar 1 al contador, todo o nada
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.favorito.deleteMany({ where: { id, idUsuario: usuario } });
    if (count > 0) {
      await tx.usuario.update({
        where: { id: usuario },
        data: { cantidadFavoritos: { decrement: count } },
      });
    }
  });
  return json({ ok: true });
});
