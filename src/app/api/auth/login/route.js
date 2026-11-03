import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fijarSesion } from '@/lib/auth';
import { json, conErrores, leerJson } from '@/lib/http';
import { permitir, ipDe } from '@/lib/limitador';

export const runtime = 'nodejs';

export const POST = conErrores(async (request) => {
  if (!permitir(`auth:${ipDe(request)}`, { limite: 30, ventanaMs: 15 * 60_000 })) {
    return json({ error: 'Demasiados intentos. Esperá unos minutos.' }, 429);
  }
  const b = await leerJson(request);
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  const usuario = await prisma.usuario.findFirst({ where: { gmail: email } });
  const ok = usuario && (await bcrypt.compare(password, usuario.password));
  if (!ok) return json({ error: 'Email o contraseña incorrectos.' }, 401);

  const respuesta = NextResponse.json({ usuario: { id: usuario.id, gmail: usuario.gmail } });
  fijarSesion(respuesta, usuario);
  return respuesta;
});
