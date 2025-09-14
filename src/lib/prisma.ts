import { PrismaClient } from '@prisma/client';


declare global {
  var dbInstance: PrismaClient | undefined;
}

const db = (globalThis.dbInstance as PrismaClient | undefined) || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.dbInstance = db;

export default db;