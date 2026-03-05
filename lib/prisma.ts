import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Mantem o cliente Singleton globalmente durante instâncias do dev server
// Evitando a criação de N conexões (exaustão do pooler)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
