import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var dbInstance: PrismaClient | undefined;
}

const db = (globalThis as any).dbInstance || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).dbInstance = db;

export default db;