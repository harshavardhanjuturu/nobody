import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

function getDbPath() {
  const defaultPath = path.join(process.cwd(), 'prisma', 'dev.db');

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpPath = path.join('/tmp', 'dev.db');
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, tmpPath);
        }
      } catch (err) {
        console.error('Error copying DB to /tmp:', err);
      }
    }
    return 'file:' + tmpPath;
  }

  return 'file:' + defaultPath;
}

const adapter = new PrismaBetterSqlite3({ url: getDbPath() });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
