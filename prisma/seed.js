const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.$queryRaw`SELECT * FROM auth.users`
    console.log(`Found ${users.length} users in auth.users`)

    if (users.length > 0) {
        const user = users[users.length - 1]

        let pousada = await prisma.pousada.findFirst()
        if (!pousada) {
            pousada = await prisma.pousada.create({
                data: {
                    nome: 'Pousada de Teste',
                    email: user?.email || 'admin@pousadadeteste.com'
                }
            })
            console.log('Created Pousada', pousada)
        }

        const sysUser = await prisma.usuario.findUnique({ where: { supabaseId: user.id } })
        if (!sysUser) {
            await prisma.usuario.create({
                data: {
                    supabaseId: user.id,
                    pousadaId: pousada.id,
                    nome: user.email.split('@')[0],
                    email: user.email,
                    perfil: 'ADMIN'
                }
            })
            console.log('Created Usuario for', user.email)
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
