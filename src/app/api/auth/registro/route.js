import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { fijarSesion } from '@/lib/auth';
import { json, conErrores, leerJson } from '@/lib/http';
import { permitir, ipDe } from '@/lib/limitador';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST = conErrores(async (request) => {
  if (!permitir(`auth:${ipDe(request)}`, { limite: 30, ventanaMs: 15 * 60_000 })) {
    return json({ error: 'Demasiados intentos. Esperá unos minutos.' }, 429);
  }
  const b = await leerJson(request);
  const email = String(b.email ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  if (!RE_EMAIL.test(email) || email.length > 120) return json({ error: 'Email inválido.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' }, 400);

  try {
    const existente = await prisma.usuario.findFirst({ where: { gmail: email } });
    if (existente) return json({ error: 'Ese email ya está registrado.' }, 409);

    const usuario = await prisma.usuario.create({
      data: { gmail: email, password: await bcrypt.hash(password, 12), estatus: 'activo' },
    });
    const respuesta = NextResponse.json({ usuario: { id: usuario.id, gmail: usuario.gmail } }, { status: 201 });
    fijarSesion(respuesta, usuario);
    return respuesta;
  } catch (e) {
    if (e.code === 'P2002') return json({ error: 'Ese email ya está registrado.' }, 409);
    throw e;
  }
});
