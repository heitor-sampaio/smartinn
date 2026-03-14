'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getComodidades() {
    try {
        const { pousadaId } = await requireAuth()
        const comodidades = await prisma.comodidade.findMany({
            where: { pousadaId },
            orderBy: { nome: 'asc' },
            select: { nome: true }
        })
        return { data: comodidades.map(c => c.nome) }
    } catch {
        return { data: [] as string[] }
    }
}

export async function createComodidade(nome: string) {
    try {
        const { pousadaId } = await requireAuth()

        const nomeFormatado = nome.trim()
        if (!nomeFormatado) return { error: 'Nome inválido.' }

        await prisma.comodidade.create({
            data: { pousadaId, nome: nomeFormatado }
        })

        revalidatePath('/dashboard/acomodacoes')
        return { success: nomeFormatado }
    } catch (e: any) {
        if (e?.code === 'P2002') return { error: 'Essa comodidade já existe.' }
        return { error: 'Erro ao adicionar comodidade.' }
    }
}
