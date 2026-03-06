'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { randomUUID } from 'crypto'

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

/** Gera as datas futuras de repetição a partir de dataBase, respeitando o intervalo. */
function gerarDatasRecorrentes(dataBase: Date, intervalo: string, max = 12): Date[] {
    const datas: Date[] = []
    let current = new Date(dataBase)

    for (let i = 0; i < max - 1; i++) {
        switch (intervalo) {
            case 'SEMANAL':
                current = new Date(current)
                current.setDate(current.getDate() + 7)
                break
            case 'MENSAL':
                current = new Date(current)
                current.setMonth(current.getMonth() + 1)
                break
            case 'BIMESTRAL':
                current = new Date(current)
                current.setMonth(current.getMonth() + 2)
                break
            case 'TRIMESTRAL':
                current = new Date(current)
                current.setMonth(current.getMonth() + 3)
                break
            case 'SEMESTRAL':
                current = new Date(current)
                current.setMonth(current.getMonth() + 6)
                break
            case 'ANUAL':
                current = new Date(current)
                current.setFullYear(current.getFullYear() + 1)
                break
        }
        datas.push(new Date(current))
    }

    return datas
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
        const recorrenteRaw = formData.get('recorrente') as string
        const intervaloRecorrencia = formData.get('intervaloRecorrencia') as string || null

        if (!descricao || !tipo || !formaPagamento || !valorRaw || !dataStr) {
            return { error: 'Preencha todos os campos obrigatórios' }
        }

        const isRecorrente = tipo === 'SAIDA' && recorrenteRaw === 'true' && !!intervaloRecorrencia

        const data = new Date(dataStr + 'T12:00:00Z') // Força meio-dia para evitar fuso bugado
        const grupoId = isRecorrente ? randomUUID() : null

        // Cria o lançamento principal
        await prisma.lancamentoFinanceiro.create({
            data: {
                pousadaId,
                tipo,
                descricao,
                valor: ignorarSinalValor,
                formaPagamento,
                categoria: categoria || null,
                data,
                observacoes,
                recorrente: isRecorrente,
                intervaloRecorrencia: isRecorrente ? (intervaloRecorrencia as any) : null,
                recorrenciaGrupoId: grupoId,
            }
        })

        // Se recorrente, cria as próximas 11 ocorrências (total: 12)
        if (isRecorrente && grupoId) {
            const datasRecorrentes = gerarDatasRecorrentes(data, intervaloRecorrencia!, 12)

            await prisma.lancamentoFinanceiro.createMany({
                data: datasRecorrentes.map(dataFutura => ({
                    pousadaId,
                    tipo,
                    descricao,
                    valor: ignorarSinalValor,
                    formaPagamento,
                    categoria: categoria || null,
                    data: dataFutura,
                    observacoes,
                    recorrente: true,
                    intervaloRecorrencia: intervaloRecorrencia as any,
                    recorrenciaGrupoId: grupoId,
                }))
            })
        }

        revalidatePath('/dashboard/financeiro')

        const msg = isRecorrente
            ? `Lançamento recorrente registrado! 12 ocorrências criadas (intervalo: ${intervaloRecorrencia!.toLowerCase()}).`
            : 'Lançamento registrado com sucesso!'

        return { success: msg }
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
