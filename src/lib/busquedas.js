// Contador de búsquedas por cuenta.
//
// Hay dos piezas que trabajan juntas:
//   1. La tabla `Busqueda`: una fila por búsqueda. Es el historial / la fuente de verdad.
//   2. La columna `Usuario.busquedasTotal`: el total ya calculado.
//
// Leer el total es una sola lectura (O(1)): no hay que contar filas nunca.
// Y si alguna vez el número quedara desfasado, se recalcula desde el historial.
import { prisma } from './db.js';

// Guarda la búsqueda y devuelve el total actualizado.
// Las dos operaciones van en UNA transacción: o pasan las dos, o ninguna.
// Así el historial y el contador no pueden quedar desincronizados.
export async function registrarBusqueda(idUsuario, filtros) {
  const [, usuario] = await prisma.$transaction([
    prisma.busqueda.create({
      data: {
        idUsuario,
        destino: filtros.destino,
        huespedes: filtros.huespedes,
      },
    }),
    // `increment` hace el +1 dentro de Postgres (UPDATE ... SET x = x + 1).
    // Es atómico: si el usuario busca desde dos pestañas a la vez, no se pierde ninguna.
    prisma.usuario.update({
      where: { id: idUsuario },
      data: { busquedasTotal: { increment: 1 } },
      select: { busquedasTotal: true },
    }),
  ]);
  return usuario.busquedasTotal;
}

// Lectura rápida del contador (una sola fila, por clave primaria).
export async function totalBusquedas(idUsuario) {
  const u = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: { busquedasTotal: true },
  });
  return u?.busquedasTotal ?? 0;
}

// Cuenta real, contando filas del historial. Usa el índice (idUsuario, fecha).
// Sirve para auditar el contador o para contar un período ("este mes").
export function contarEnHistorial(idUsuario, { desde = null } = {}) {
  return prisma.busqueda.count({
    where: { idUsuario, ...(desde ? { fecha: { gte: desde } } : {}) },
  });
}

// Repara el contador de un usuario a partir del historial, en una sola consulta
// (el COUNT con subconsulta se resuelve entero dentro de Postgres).
export async function recalcularContador(idUsuario) {
  const [fila] = await prisma.$queryRaw`
    UPDATE "Usuario" u
       SET "busquedasTotal" = (
             SELECT COUNT(*) FROM "Busqueda" b WHERE b."idUsuario" = u.id
           )
     WHERE u.id = ${idUsuario}
    RETURNING u."busquedasTotal" AS total
  `;
  return Number(fila?.total ?? 0);
}
