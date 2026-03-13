'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { broadcastPousadaChange } from '@/lib/broadcast'
import { cookies } from 'next/headers'

// Helper de Autenticação e Segurança
async function requireAuth(fallbackLinkEquipe?: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        if (fallbackLinkEquipe && cookies().get(`equipe_auth_${fallbackLinkEquipe}`)?.value === 'true') {
            const pousadaLink = await prisma.pousada.findUnique({
                where: { linkEquipe: fallbackLinkEquipe },
                select: { id: true }
            });
            if (pousadaLink) {
                return { user: null, pousadaId: pousadaLink.id, perfil: 'EQUIPE', linkEquipe: fallbackLinkEquipe }
            }
        }
        throw new Error('Não autorizado')
    }

    const usuario = await prisma.usuario.findUnique({
        where: { supabaseId: user.id },
        select: { pousadaId: true, perfil: true }
    })

    if (!usuario) throw new Error('Usuário não encontrado no sistema')

    return { user, pousadaId: usuario.pousadaId, perfil: usuario.perfil }
}

export async function getTarefasList(fallbackLinkEquipe?: string) {
    try {
        const { pousadaId } = await requireAuth(fallbackLinkEquipe)

        // Para este MVP vamos focar apenas no modelo "Tarefa". 
        // Trataremos Limpeza e Manutenção como Tipos dentro de Tarefa para manter um Kanban Unificado fácil.
        const tarefas = await prisma.tarefa.findMany({
            where: { pousadaId },
            include: {
                acomodacao: {
                    select: { nome: true, status: true }
                },
                responsavel: {
                    select: { nome: true }
                }
            },
            orderBy: [
                { prioridade: 'asc' }, // URGENTE vem primeiro (enum ordena alfabetico, talvez precise numérico, ajustaremos depois)
                { criadoEm: 'desc' }
            ]
        })

        // Serialização para Client Components
        const serialized = tarefas.map(t => ({
            ...t,
            prazo: t.prazo ? t.prazo.toISOString() : null,
            criadoEm: t.criadoEm.toISOString(),
            atualizadoEm: t.atualizadoEm.toISOString(),
            concluidaEm: t.concluidaEm ? t.concluidaEm.toISOString() : null,
            iniciadaEm: t.iniciadaEm ? t.iniciadaEm.toISOString() : null
        }))

        // Ordernamento na mão pra garantir Enum URGENTE > NORMAL > BAIXA
        const priorityScore: Record<string, number> = { URGENTE: 3, NORMAL: 2, BAIXA: 1 }

        serialized.sort((a, b) => {
            const scoreA = priorityScore[a.prioridade] || 0
            const scoreB = priorityScore[b.prioridade] || 0

            if (scoreA !== scoreB) {
                return scoreB - scoreA; // Maior (3) primeiro
            }
            // Desempate por mais recente
            return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        })

        return { data: serialized, pousadaId }
    } catch (err) {
        return { error: 'Falha ao buscar as tarefas.' }
    }
}

export async function createTarefa(formData: FormData) {
    try {
        const { pousadaId } = await requireAuth()

        const titulo = formData.get('titulo') as string
        const tipo = formData.get('tipo') as any // LIMPEZA, PREPARACAO, MANUTENCAO, OUTRO
        const prioridade = formData.get('prioridade') as any || 'NORMAL'
        const descricao = formData.get('descricao') as string || null
        const acomodacaoId = formData.get('acomodacaoId') as string || null

        if (!titulo || !tipo) return { error: 'O título e o tipo da tarefa são obrigatórios.' }

        await prisma.tarefa.create({
            data: {
                pousadaId,
                titulo,
                tipo,
                prioridade,
                descricao,
                acomodacaoId: acomodacaoId && acomodacaoId !== "no-room" ? acomodacaoId : null,
                status: 'PENDENTE'
            }
        })

        revalidatePath('/dashboard/tarefas')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Tarefa adicionada ao quadro!' }
    } catch (err) {
        console.error("DEBUG TAREFA:", err)
        return { error: 'Erro ao criar a tarefa.' }
    }
}

export async function deleteTarefa(id: string) {
    try {
        const { pousadaId } = await requireAuth()
        const tarefa = await prisma.tarefa.findUnique({ where: { id } })
        if (!tarefa || tarefa.pousadaId !== pousadaId) {
            return { error: 'Não autorizado ou tarefa inexistente.' }
        }
        await prisma.tarefa.delete({ where: { id } })

        revalidatePath('/dashboard/tarefas')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Tarefa excluída com sucesso!' }
    } catch (error) {
        return { error: 'Erro ao tentar deletar a tarefa.' }
    }
}

export async function updateStatusTarefa(id: string, novoStatus: any, fallbackLinkEquipe?: string) {
    try {
        const { pousadaId } = await requireAuth(fallbackLinkEquipe)

        // 1. Busca a tarefa atual pra checar se pertence à pousada e ver o vínculo original
        const tarefa = await prisma.tarefa.findUnique({
            where: { id },
            include: { acomodacao: true }
        })

        if (!tarefa || tarefa.pousadaId !== pousadaId) return { error: 'Tarefa não encontrada ou acesso negado.' }

        let dataValues: any = { status: novoStatus }

        if (novoStatus === 'EM_ANDAMENTO' && !tarefa.iniciadaEm) {
            dataValues.iniciadaEm = new Date()
        }

        if (novoStatus === 'CONCLUIDA') {
            const now = new Date()
            dataValues.concluidaEm = now

            if (tarefa.iniciadaEm) {
                const diffMs = now.getTime() - new Date(tarefa.iniciadaEm).getTime()
                dataValues.tempoGastoMinutos = Math.floor(diffMs / 60000)
            }
        }

        // 2. Faz o Update da tabela Tarefas
        await prisma.tarefa.update({
            where: { id },
            data: dataValues
        })

        // 3. FEATURE MASTER: Automação Quarto Limpo
        // Se a tarefa é do tipo Limpeza ou PREPARACAO, estava em LIMPEZA/MANUTENCAO e a tarefa acaba de ser Concluida, libere o quarto
        if (novoStatus === 'CONCLUIDA' && tarefa.acomodacaoId) {
            const quarterStatusToRelease = ['LIMPEZA', 'MANUTENCAO']
            if (quarterStatusToRelease.includes(tarefa.acomodacao!.status)) {
                await prisma.acomodacao.update({
                    where: { id: tarefa.acomodacaoId },
                    data: { status: 'DISPONIVEL' }
                })
            }
        }

        revalidatePath('/dashboard/tarefas')
        revalidatePath('/dashboard/acomodacoes')
        await broadcastPousadaChange(pousadaId)
        return { success: 'Card movido!' }

    } catch (error) {
        return { error: 'Ocorreu um erro ao arrastar o card.' }
    }
}
