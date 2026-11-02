import jwt from 'jsonwebtoken';

function secreto() {
  if (!process.env.JWT_SECRET) throw new Error('Falta JWT_SECRET en .env');
  return process.env.JWT_SECRET;
}

// Guarda la sesión en una cookie httpOnly (el JavaScript del navegador no puede leerla).
export function fijarSesion(respuesta, usuario) {
  const token = jwt.sign({ id: usuario.id }, secreto(), { expiresIn: '7d' });
  respuesta.cookies.set('sesion', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function cerrarSesion(respuesta) {
  respuesta.cookies.set('sesion', '', { httpOnly: true, path: '/', maxAge: 0 });
}

// Devuelve el id del usuario logueado, o null.
export function usuarioId(request) {
  const clave = secreto();
  try {
    return jwt.verify(request.cookies.get('sesion')?.value ?? '', clave).id;
  } catch {
    return null;
  }
}
