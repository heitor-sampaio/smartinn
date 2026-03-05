import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRawUnsafe("GRANT SELECT ON tarefas TO anon, authenticated;");
    console.log("Permissões concedidas.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
