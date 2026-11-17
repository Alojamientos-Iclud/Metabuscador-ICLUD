import { prisma } from '@/lib/db';
import { usuarioId } from '@/lib/auth';
import { json, conErrores, leerJson } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const urlHttp = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const GET = conErrores(async (request) => {
  const id = usuarioId(request);
  if (!id) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  const [favoritos, u] = await Promise.all([
    prisma.favorito.findMany({ where: { idUsuario: id }, orderBy: { fechaGuardado: 'desc' } }),
    prisma.usuario.findUnique({ where: { id }, select: { cantidadFavoritos: true } }),
  ]);
  return json({ favoritos, total: u?.cantidadFavoritos ?? favoritos.length });
});

export const POST = conErrores(async (request) => {
  const id = usuarioId(request);
  if (!id) return json({ error: 'Iniciá sesión para continuar.' }, 401);

  const { nombre, precio, url, imagen } = await leerJson(request);
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 200) return json({ error: 'Nombre inválido.' }, 400);
  if (typeof url !== 'string' || url.length > 2000 || !urlHttp(url)) return json({ error: 'URL inválida.' }, 400);
  if (imagen != null && (typeof imagen !== 'string' || imagen.length > 2000 || !urlHttp(imagen))) return json({ error: 'Imagen inválida.' }, 400);
  const precioNum = precio == null ? null : Number(precio);
  if (precioNum !== null && (!Number.isFinite(precioNum) || precioNum < 0)) return json({ error: 'Precio inválido.' }, 400);

  try {
    // Transacción: crear el favorito y sumar 1 al contador del usuario, todo o nada
    const resultado = await prisma.$transaction(async (tx) => {
      const existente = await tx.favorito.findUnique({
        where: { idUsuario_urlOrigen: { idUsuario: id, urlOrigen: url } },
      });
      if (existente) return { favorito: existente, creado: false };

      const favorito = await tx.favorito.create({
        data: { idUsuario: id, nombreAlojamiento: nombre.trim(), precio: precioNum, urlOrigen: url, imagenUrl: imagen ?? null },
      });
      await tx.usuario.update({
        where: { id },
        data: { cantidadFavoritos: { increment: 1 } },
      });
      return { favorito, creado: true };
    });
    return json({ favorito: resultado.favorito }, resultado.creado ? 201 : 200);
  } catch (e) {
    if (e.code === 'P2002') return json({ error: 'Ese alojamiento ya está en tus favoritos.' }, 409);
    throw e;
  }
});