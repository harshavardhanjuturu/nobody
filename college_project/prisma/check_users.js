const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = 'file:' + path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const db = new PrismaClient({ adapter });

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log('USERS IN DB:', users);
}

main().finally(() => db.$disconnect());
