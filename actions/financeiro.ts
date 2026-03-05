'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

export async function getLancamentosList(mes?: number, ano?: number) {
    try {
        const { pousadaId } = await requireAuth()

        const dataAtual = new Date()
        const targetMes = mes ? mes - 1 : dataAtual.getMonth() // 0-based
        const targetAno = ano || dataAtual.getFullYear()

        const dataInicio = new Date(targetAno, targetMes, 1)
        const dataFim = new Date(targetAno, targetMes + 1, 0, 23, 59, 59, 999)

        const lancamentos = await prisma.lancamentoFinanceiro.findMany({
            where: {
                pousadaId,
                data: {
                    gte: dataInicio,
                    lte: dataFim
                }
            },
            orderBy: { data: 'desc' }
        })

        // Serializa Decimal pro Client Component
        const serialized = lancamentos.map(l => ({
            ...l,
            valor: Number(l.valor)
        }))

        return { data: serialized }
    } catch (error) {
        console.error("Erro ao listar Lançamentos", error)
        return { error: 'Falha ao buscar os Lançamentos Financeiros' }
    }
}

export async function createLancamento(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const tipo = formData.get('tipo') as any // ENTRADA | SAIDA
        const formaPagamento = formData.get('formaPagamento') as any
        const descricao = formData.get('descricao') as string
        const valorRaw = formData.get('valor') as string
        const ignorarSinalValor = Math.abs(parseFloat(valorRaw.replace(',', '.'))) || 0
        const dataStr = formData.get('data') as string
        const categoria = formData.get('categoria') as any || null
        const observacoes = formData.get('observacoes') as string || null

        if (!descricao || !tipo || !formaPagamento || !valorRaw || !dataStr) {
            return { error: 'Preencha todos os campos obrigatórios' }
        }

        const data = new Date(dataStr + 'T12:00:00Z') // Força meio-dia para evitar fuso bugado

        await prisma.lancamentoFinanceiro.create({
            data: {
                pousadaId,
                tipo,
                descricao,
                valor: ignorarSinalValor, // Protege contra o cara digitar Entrada "-50", banco fica positivo puro, o ENUM dita
                formaPagamento,
                categoria: categoria || null, // Permite Categorias tanto para SAIDA quanto para ENTRADA
                data,
                observacoes
            }
        })

        revalidatePath('/dashboard/financeiro')
        return { success: 'Lançamento registrado com sucesso!' }
    } catch (error) {
        console.error("Erro ao criar Lançamento:", error)
        return { error: 'Ocorreu um erro ao salvar o Lançamento' }
    }
}

export async function deleteLancamento(id: string) {
    try {
        const { pousadaId } = await requireAuth()

        await prisma.lancamentoFinanceiro.delete({
            where: {
                id,
                pousadaId
            }
        })

        revalidatePath('/dashboard/financeiro')
        return { success: 'Lançamento excluído com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao excluir Lançamento' }
    }
}
