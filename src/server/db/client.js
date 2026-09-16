import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma único por processo.
 *
 * Em desenvolvimento o hot reload recria os módulos a cada alteração; sem o
 * cache no globalThis cada recarga abriria um novo pool de conexões.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
