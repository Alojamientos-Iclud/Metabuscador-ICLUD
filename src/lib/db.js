import { PrismaClient } from '@prisma/client';

// En desarrollo Next recarga el código seguido: se guarda el cliente para no abrir conexiones de más.
const global = globalThis;
export const prisma = global.__icludPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__icludPrisma = prisma;
