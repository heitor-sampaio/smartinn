'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

export async function getAcomodacoes() {
    try {
        const { pousadaId } = await requireAuth()

        const acomodacoes = await prisma.acomodacao.findMany({
            where: { pousadaId },
            orderBy: [
                { status: 'asc' }, // Traz disponiveis/ocupados primeiro
                { nome: 'asc' }
            ]
        })

        const serialized = acomodacoes.map(ac => ({
            ...ac,
            criadoEm: ac.criadoEm.toISOString(),
            atualizadoEm: ac.atualizadoEm.toISOString(),
            valorDiaria: Number(ac.valorDiaria)
        }))

        return { data: serialized }
    } catch (error) {
        return { error: 'Falha ao buscar acomodações' }
    }
}

export async function createAcomodacao(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const nome = formData.get('nome') as string
        const tipo = formData.get('tipo') as any // Type-casting temporário para o enum
        const capacidade = parseInt(formData.get('capacidade') as string) || 2
        const descricao = formData.get('descricao') as string
        const valorDiariaRaw = formData.get('valorDiaria') as string
        const valorDiaria = valorDiariaRaw ? parseFloat(valorDiariaRaw.replace(',', '.')) : 0
        const caracteristicas = formData.getAll('caracteristicas') as string[]

        if (!nome) return { error: 'O nome (número/identificação) é obrigatório' }

        await prisma.acomodacao.create({
            data: {
                pousadaId,
                nome,
                tipo,
                capacidade,
                valorDiaria,
                descricao,
                caracteristicas,
                status: 'DISPONIVEL', // Valor padrão
            }
        })

        revalidatePath('/dashboard/acomodacoes')
        return { success: 'Acomodação cadastrada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao cadastrar acomodação' }
    }
}

export async function updateAcomodacao(id: string, formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const nome = formData.get('nome') as string
        const tipo = formData.get('tipo') as any
        const capacidade = parseInt(formData.get('capacidade') as string) || 2
        const descricao = formData.get('descricao') as string
        const status = formData.get('status') as any
        const valorDiariaRaw = formData.get('valorDiaria') as string
        const valorDiaria = valorDiariaRaw ? parseFloat(valorDiariaRaw.replace(',', '.')) : 0
        const caracteristicas = formData.getAll('caracteristicas') as string[]

        if (!nome) return { error: 'O nome é obrigatório' }

        // Verifica se pertence à pousada logada antes de atualizar
        await prisma.acomodacao.update({
            where: {
                id,
                pousadaId // Injetando aqui previne edição não autorizada
            },
            data: {
                nome,
                tipo,
                capacidade,
                valorDiaria,
                descricao,
                caracteristicas,
                ...(status && { status }) // Atualiza status só se vier no form
            }
        })

        revalidatePath('/dashboard/acomodacoes')
        return { success: 'Acomodação atualizada com sucesso!' }
    } catch (error) {
        return { error: 'Erro ao atualizar acomodação' }
    }
}

export async function deleteAcomodacao(id: string) {
    try {
        const { pousadaId } = await requireAuth()

        await prisma.acomodacao.delete({
            where: {
                id,
                pousadaId
            }
        })

        revalidatePath('/dashboard/acomodacoes')
        return { success: 'Acomodação removida!' }
    } catch (error) {
        return { error: 'Não é possível remover quartos com reservas atreladas.' }
    }
}

export async function toggleStatusAcomodacao(id: string, novoStatus: any) {
    try {
        const { pousadaId } = await requireAuth()

        await prisma.acomodacao.update({
            where: {
                id,
                pousadaId
            },
            data: {
                status: novoStatus
            }
        })

        revalidatePath('/dashboard/acomodacoes')
        return { success: 'Status modificado!' }
    } catch (error) {
        return { error: 'Erro ao alterar status.' }
    }
}
