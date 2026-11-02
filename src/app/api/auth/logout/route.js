import { NextResponse } from 'next/server';
import { cerrarSesion } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  cerrarSesion(respuesta);
  return respuesta;
}
