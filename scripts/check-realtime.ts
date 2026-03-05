import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const res = await prisma.$queryRawUnsafe("SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'");
    console.log('Tabelas no realtime:', res);
}
main().finally(() => prisma.$disconnect());
