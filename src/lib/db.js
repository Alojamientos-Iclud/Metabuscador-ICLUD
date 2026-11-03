import 'dotenv/config';
import { PrismaClient } from '@prisma/client';   // o la ruta de tu generator, ver abajo
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
// En desarrollo Next recarga el código seguido: se guarda el cliente para no abrir conexiones de más.
const global = globalThis;
if (process.env.NODE_ENV !== 'production') global.__icludPrisma = prisma;
