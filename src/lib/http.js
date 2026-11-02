import { NextResponse } from 'next/server';

export const json = (cuerpo, status = 200) => NextResponse.json(cuerpo, { status });

// Atrapa cualquier error inesperado: responde JSON y no tira abajo el servidor.
export const conErrores = (handler) => async (...args) => {
  try {
    return await handler(...args);
  } catch (e) {
    console.error(e);
    return json({ error: 'Error interno del servidor.' }, 500);
  }
};

export const leerJson = (request) => request.json().catch(() => ({}));
