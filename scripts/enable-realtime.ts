import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRawUnsafe('ALTER PUBLICATION supabase_realtime ADD TABLE tarefas;');
    console.log('Realtime ativado com sucesso para tabela tarefas!');
}

main().catch(e => {
    // Pode falhar se a role atual no connection pooling direto não for owner da tabela
    // Mas na Vercel / Prisma Direct URL costuma ir normal
    console.error(e);
}).finally(() => {
    prisma.$disconnect();
});
